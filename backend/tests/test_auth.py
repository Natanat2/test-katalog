def _register_user(client, email="user@example.com", password="password123"):
    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_auth_register_success(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "  USER@Example.com ", "password": "password123"},
    )
    assert response.status_code == 200

    payload = response.json()
    assert payload["token_type"] == "bearer"
    assert payload["access_token"]
    assert payload["user"]["email"] == "user@example.com"
    assert response.headers.get("x-session-id")


def test_auth_register_conflict(client):
    _register_user(client)
    response = client.post(
        "/api/auth/register",
        json={"email": "user@example.com", "password": "password123"},
    )
    assert response.status_code == 409
    payload = response.json()
    assert payload["code"] == "auth_email_exists"


def test_auth_login_success_and_invalid_password(client):
    _register_user(client, email="login@example.com", password="password123")

    ok_response = client.post(
        "/api/auth/login",
        json={"email": "LOGIN@example.com", "password": "password123"},
    )
    assert ok_response.status_code == 200
    assert ok_response.json()["access_token"]

    bad_response = client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "wrongpass123"},
    )
    assert bad_response.status_code == 401
    bad_payload = bad_response.json()
    assert bad_payload["code"] == "auth_invalid_credentials"


def test_auth_me_requires_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    payload = response.json()
    assert payload["code"] == "auth_invalid_token"


def test_auth_me_success(client):
    register_response = _register_user(client, email="me@example.com", password="password123")
    token = register_response.json()["access_token"]

    response = client.get("/api/auth/me", headers=_auth_headers(token))
    assert response.status_code == 200
    payload = response.json()
    assert payload["email"] == "me@example.com"
    assert payload["is_active"] is True


def test_auth_login_merges_guest_cart_into_user_cart(client, sample_products):
    first_product_id = sample_products[0]
    second_product_id = sample_products[1]

    register_response = _register_user(client, email="merge@example.com", password="password123")
    token = register_response.json()["access_token"]

    add_user_item_response = client.post(
        "/api/cart/",
        headers=_auth_headers(token),
        json={"product_id": first_product_id, "quantity": 1},
    )
    assert add_user_item_response.status_code == 200

    add_guest_item_response = client.post(
        "/api/cart/",
        json={"product_id": first_product_id, "quantity": 2},
    )
    assert add_guest_item_response.status_code == 200
    guest_session_id = add_guest_item_response.headers.get("x-session-id")
    assert guest_session_id

    add_second_guest_item_response = client.post(
        "/api/cart/",
        headers={"X-Session-Id": guest_session_id},
        json={"product_id": second_product_id, "quantity": 3},
    )
    assert add_second_guest_item_response.status_code == 200

    login_response = client.post(
        "/api/auth/login",
        headers={"X-Session-Id": guest_session_id},
        json={"email": "merge@example.com", "password": "password123"},
    )
    assert login_response.status_code == 200

    merged_cart_response = client.get("/api/cart/", headers=_auth_headers(login_response.json()["access_token"]))
    assert merged_cart_response.status_code == 200
    merged_payload = merged_cart_response.json()

    quantities = {item["product"]["id"]: item["quantity"] for item in merged_payload["items"]}
    assert quantities[first_product_id] == 3
    assert quantities[second_product_id] == 3

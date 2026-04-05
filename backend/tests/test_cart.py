def test_cart_full_flow(client, sample_products):
    product_id = sample_products[0]

    get_response = client.get("/api/cart/")
    assert get_response.status_code == 200
    session_id = get_response.headers.get("x-session-id")
    assert session_id
    assert get_response.json()["items"] == []

    add_response = client.post(
        "/api/cart/",
        headers={"X-Session-Id": session_id},
        json={"product_id": product_id, "quantity": 2},
    )
    assert add_response.status_code == 200
    add_payload = add_response.json()
    assert add_payload["total_price"] == "200.00"
    assert len(add_payload["items"]) == 1
    item_id = add_payload["items"][0]["id"]

    update_response = client.put(
        f"/api/cart/{item_id}/",
        headers={"X-Session-Id": session_id},
        json={"quantity": 5},
    )
    assert update_response.status_code == 200
    update_payload = update_response.json()
    assert update_payload["items"][0]["quantity"] == 5
    assert update_payload["total_price"] == "500.00"

    delete_response = client.delete(
        f"/api/cart/{item_id}/",
        headers={"X-Session-Id": session_id},
    )
    assert delete_response.status_code == 200
    delete_payload = delete_response.json()
    assert delete_payload["items"] == []
    assert delete_payload["total_price"] == "0.00"


def test_cart_update_requires_session_header(client, sample_products):
    response = client.put("/api/cart/1/", json={"quantity": 2})
    assert response.status_code == 400
    payload = response.json()
    assert payload["code"] == "http_400"


def test_cart_add_validation_error(client, sample_products):
    response = client.post("/api/cart/", json={"product_id": sample_products[0], "quantity": 0})
    assert response.status_code == 422
    payload = response.json()
    assert payload["code"] == "validation_error"

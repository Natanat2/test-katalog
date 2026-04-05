def test_products_list_and_detail(client, sample_products):
    response = client.get("/api/products/", params={"limit": 2, "offset": 0, "ordering": "price"})
    assert response.status_code == 200

    payload = response.json()
    assert payload["count"] == 3
    assert len(payload["results"]) == 2
    assert payload["next"] is not None
    assert payload["previous"] is None

    product_id = payload["results"][0]["id"]
    detail_response = client.get(f"/api/products/{product_id}/")
    assert detail_response.status_code == 200
    detail_payload = detail_response.json()
    assert detail_payload["id"] == product_id
    assert "description" in detail_payload


def test_products_invalid_price_range_returns_422(client, sample_products):
    response = client.get("/api/products/", params={"min_price": 100, "max_price": 10})
    assert response.status_code == 422
    payload = response.json()
    assert payload["code"] == "http_422"
    assert "min_price" in payload["detail"]


def test_products_not_found_returns_404(client):
    response = client.get("/api/products/999999/")
    assert response.status_code == 404
    payload = response.json()
    assert payload["code"] == "http_404"

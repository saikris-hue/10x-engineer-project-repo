"""API tests for PromptLab."""

from fastapi.testclient import TestClient


class TestHealth:
    """Tests for health endpoint."""
    
    def test_health_check(self, client: TestClient):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data


class TestPrompts:
    """Tests for prompt endpoints."""
    
    def test_create_prompt(self, client: TestClient, sample_prompt_data):
        response = client.post("/prompts", json=sample_prompt_data)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == sample_prompt_data["title"]
        assert data["content"] == sample_prompt_data["content"]
        assert "id" in data
        assert "created_at" in data
    
    def test_list_prompts_empty(self, client: TestClient):
        response = client.get("/prompts")
        assert response.status_code == 200
        data = response.json()
        assert data["prompts"] == []
        assert data["total"] == 0
    
    def test_list_prompts_with_data(self, client: TestClient, sample_prompt_data):
        # Create a prompt first
        client.post("/prompts", json=sample_prompt_data)
        
        response = client.get("/prompts")
        assert response.status_code == 200
        data = response.json()
        assert len(data["prompts"]) == 1
        assert data["total"] == 1
    
    def test_get_prompt_success(self, client: TestClient, sample_prompt_data):
        # Create a prompt first
        create_response = client.post("/prompts", json=sample_prompt_data)
        prompt_id = create_response.json()["id"]
        
        response = client.get(f"/prompts/{prompt_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == prompt_id
    
    def test_get_prompt_not_found(self, client: TestClient):
        """Test that getting a non-existent prompt returns 404."""
        response = client.get("/prompts/nonexistent-id")
        assert response.status_code == 404
    
    def test_delete_prompt(self, client: TestClient, sample_prompt_data):
        # Create a prompt first
        create_response = client.post("/prompts", json=sample_prompt_data)
        prompt_id = create_response.json()["id"]
        
        # Delete it
        response = client.delete(f"/prompts/{prompt_id}")
        assert response.status_code == 204
        
        # Verify it's gone
        get_response = client.get(f"/prompts/{prompt_id}")
        assert get_response.status_code == 404
    
    def test_update_prompt(self, client: TestClient, sample_prompt_data):
        # Create a prompt first
        create_response = client.post("/prompts", json=sample_prompt_data)
        prompt_id = create_response.json()["id"]
        original_updated_at = create_response.json()["updated_at"]
        
        # Update it
        updated_data = {
            "title": "Updated Title",
            "content": "Updated content for the prompt",
            "description": "Updated description"
        }
        
        import time
        time.sleep(0.1)  # Small delay to ensure timestamp would change
        
        response = client.put(f"/prompts/{prompt_id}", json=updated_data)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        
        assert data["updated_at"] != original_updated_at
    
    def test_sorting_order(self, client: TestClient):
        """Test that prompts are sorted newest first."""
        import time
        
        # Create prompts with delay
        prompt1 = {"title": "First", "content": "First prompt content"}
        prompt2 = {"title": "Second", "content": "Second prompt content"}
        
        client.post("/prompts", json=prompt1)
        time.sleep(0.1)
        client.post("/prompts", json=prompt2)
        
        response = client.get("/prompts")
        prompts = response.json()["prompts"]
        
        # Newest (Second) should be first
        assert prompts[0]["title"] == "Second"

    def test_create_prompt_with_collection_invalid(self, client: TestClient, sample_prompt_data):
        # Attempt to create a prompt with a non-existent collection
        data = {**sample_prompt_data, "collection_id": "nonexistent-collection"}
        response = client.post("/prompts", json=data)
        assert response.status_code == 400
        assert response.json()["detail"] == "Collection not found"

    def test_create_prompt_unicode_and_special_chars(self, client: TestClient):
        data = {
            "title": "Unicode ✅",
            "content": "Handle emoji 🚀 and special chars: !@#$%^&*()[]{}<>",
            "description": "测试 unicode"
        }
        response = client.post("/prompts", json=data)
        assert response.status_code == 201
        body = response.json()
        assert body["title"] == data["title"]
        assert "id" in body

    def test_search_prompts(self, client: TestClient, sample_prompt_data):
        # Create two prompts, one with 'review' term
        p1 = {"title": "Code Review Prompt", "content": "Please review this code", "description": "review"}
        p2 = {"title": "Other", "content": "Some content", "description": "misc"}
        client.post("/prompts", json=p1)
        client.post("/prompts", json=p2)

        response = client.get("/prompts?search=review")
        assert response.status_code == 200
        prompts = response.json()["prompts"]
        assert any("review" in ((p.get("description") or "").lower()) or "review" in ((p.get("title") or "").lower()) for p in prompts)

    def test_filter_by_collection(self, client: TestClient, sample_collection_data, sample_prompt_data):
        # Create collection and attach prompt
        col = client.post("/collections", json=sample_collection_data).json()
        prompt_data = {**sample_prompt_data, "collection_id": col["id"]}
        client.post("/prompts", json=prompt_data)

        response = client.get(f"/prompts?collection_id={col['id']}")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["prompts"][0]["collection_id"] == col["id"]

    def test_patch_partial_update(self, client: TestClient, sample_prompt_data):
        # Create and partially update a prompt
        create = client.post("/prompts", json=sample_prompt_data).json()
        pid = create["id"]

        patch = {"description": "Patched description"}
        resp = client.patch(f"/prompts/{pid}", json=patch)
        assert resp.status_code == 200
        updated = resp.json()
        assert updated["description"] == "Patched description"
        assert updated["content"] == sample_prompt_data["content"]

    def test_update_not_found(self, client: TestClient):
        updated_data = {"title": "X", "content": "Y", "description": "Z"}
        resp = client.put("/prompts/nonexistent", json=updated_data)
        assert resp.status_code == 404

    def test_delete_not_found(self, client: TestClient):
        resp = client.delete("/prompts/nonexistent")
        assert resp.status_code == 404


class TestCollections:
    """Tests for collection endpoints."""
    
    def test_create_collection(self, client: TestClient, sample_collection_data):
        response = client.post("/collections", json=sample_collection_data)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_collection_data["name"]
        assert "id" in data
    
    def test_list_collections(self, client: TestClient, sample_collection_data):
        client.post("/collections", json=sample_collection_data)
        
        response = client.get("/collections")
        assert response.status_code == 200
        data = response.json()
        assert len(data["collections"]) == 1
    
    def test_get_collection_not_found(self, client: TestClient):
        response = client.get("/collections/nonexistent-id")
        assert response.status_code == 404
    
    def test_delete_collection_with_prompts(self, client: TestClient, sample_collection_data, sample_prompt_data):
        """Test deleting a collection also removes its prompts."""
        # Create collection
        col_response = client.post("/collections", json=sample_collection_data)
        collection_id = col_response.json()["id"]
        
        # Create prompt in collection
        prompt_data = {**sample_prompt_data, "collection_id": collection_id}
        prompt_response = client.post("/prompts", json=prompt_data)
        prompt_id = prompt_response.json()["id"]
        
        # Delete collection
        client.delete(f"/collections/{collection_id}")
        
        prompts = client.get("/prompts").json()["prompts"]
        assert all(p.get("collection_id") != collection_id for p in prompts)


class TestValidationAndErrors:
    """Additional tests for validation and error scenarios."""

    def test_create_collection_missing_name(self, client: TestClient):
        # Missing required field 'name' should return 422 from FastAPI
        resp = client.post("/collections", json={})
        assert resp.status_code == 422

    def test_get_collection_not_found(self, client: TestClient):
        resp = client.get("/collections/nonexistent-id")
        assert resp.status_code == 404

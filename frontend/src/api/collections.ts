import type { Collection, CollectionDraft, CollectionListResponse } from "../types/api";

import { request } from "./client";

export function getCollections() {
  return request<CollectionListResponse>("/collections", {
    method: "GET",
  });
}

export function createCollection(data: CollectionDraft) {
  return request<Collection>("/collections", {
    body: {
      ...data,
      description: data.description || null,
    },
    method: "POST",
  });
}

export function deleteCollection(id: string) {
  return request<void>(`/collections/${id}`, {
    method: "DELETE",
  });
}

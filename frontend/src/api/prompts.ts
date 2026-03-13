import type { Prompt, PromptDraft, PromptListResponse } from "../types/api";

import { request } from "./client";

export interface GetPromptsParams {
  collection_id?: string | null;
  search?: string;
}

export function getPrompts(params: GetPromptsParams = {}) {
  return request<PromptListResponse>("/prompts", {
    method: "GET",
    query: params as Record<string, string | number | boolean | null | undefined>,
  });
}

export function getPrompt(id: string) {
  return request<Prompt>(`/prompts/${id}`, {
    method: "GET",
  });
}

export function createPrompt(data: PromptDraft) {
  return request<Prompt>("/prompts", {
    body: {
      ...data,
      description: data.description || null,
    },
    method: "POST",
  });
}

export function updatePrompt(id: string, data: PromptDraft) {
  return request<Prompt>(`/prompts/${id}`, {
    body: {
      ...data,
      description: data.description || null,
    },
    method: "PUT",
  });
}

export function deletePrompt(id: string) {
  return request<void>(`/prompts/${id}`, {
    method: "DELETE",
  });
}

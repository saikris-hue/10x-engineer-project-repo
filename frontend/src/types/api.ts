export interface HealthResponse {
  status: string;
  version: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  description: string | null;
  collection_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromptListResponse {
  prompts: Prompt[];
  total: number;
}

export interface CollectionListResponse {
  collections: Collection[];
  total: number;
}

export interface PromptDraft {
  title: string;
  content: string;
  description: string;
  collection_id: string | null;
}

export interface CollectionDraft {
  name: string;
  description: string;
}

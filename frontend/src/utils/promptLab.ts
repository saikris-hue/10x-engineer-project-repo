import type { Collection, Prompt } from "../types/api";

export function buildCollectionNameMap(collections: Collection[]) {
  return Object.fromEntries(collections.map((collection) => [collection.id, collection.name]));
}

export function buildPromptCountMap(prompts: Prompt[]) {
  return prompts.reduce<Record<string, number>>((counts, prompt) => {
    if (prompt.collection_id) {
      counts[prompt.collection_id] = (counts[prompt.collection_id] ?? 0) + 1;
    }
    return counts;
  }, {});
}

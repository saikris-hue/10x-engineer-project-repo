import { useMemo, useState } from "react";

import { getCollections } from "../api/collections";
import { getPrompts } from "../api/prompts";
import { Layout, Sidebar } from "../components/layout";
import { PromptDetail, PromptList } from "../components/prompts";
import { Button } from "../components/shared";
import { useAsync } from "../hooks/useAsync";
import type { Collection, Prompt } from "../types/api";

function buildCollectionNameMap(collections: Collection[]) {
  return Object.fromEntries(collections.map((collection) => [collection.id, collection.name]));
}

function buildPromptCountMap(prompts: Prompt[]) {
  return prompts.reduce<Record<string, number>>((counts, prompt) => {
    if (prompt.collection_id) {
      counts[prompt.collection_id] = (counts[prompt.collection_id] ?? 0) + 1;
    }
    return counts;
  }, {});
}

export function PromptsPage() {
  const [searchValue, setSearchValue] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const promptState = useAsync(getPrompts);
  const collectionState = useAsync(getCollections);

  const collections = collectionState.data?.collections ?? [];
  const prompts = promptState.data?.prompts ?? [];
  const collectionNames = useMemo(() => buildCollectionNameMap(collections), [collections]);
  const promptCounts = useMemo(() => buildPromptCountMap(prompts), [prompts]);

  const filteredPrompts = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();

    return prompts.filter((prompt) => {
      const matchesCollection =
        selectedCollectionId === null || prompt.collection_id === selectedCollectionId;
      const matchesQuery =
        !normalizedQuery ||
        prompt.title.toLowerCase().includes(normalizedQuery) ||
        (prompt.description ?? "").toLowerCase().includes(normalizedQuery);

      return matchesCollection && matchesQuery;
    });
  }, [prompts, searchValue, selectedCollectionId]);

  return (
    <Layout
      sidebarContent={
        <Sidebar
          collections={collections}
          error={collectionState.error}
          loading={collectionState.isLoading}
          onSelectCollection={(collection) => setSelectedCollectionId(collection?.id ?? null)}
          promptCounts={promptCounts}
          selectedCollectionId={selectedCollectionId}
        />
      }
    >
      <section className="space-y-6">
        <div className="panel p-8">
          <span className="pill bg-signal/10 text-signal">Live backend data</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink">Prompts</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-ink/70">
            This view reads real backend data from `GET /prompts` and `GET /collections`, then
            applies frontend search and collection filtering using the backend-derived DTOs.
          </p>
          <div className="mt-5">
            <Button variant="ghost" onClick={() => void promptState.reload()}>
              Reload prompts
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <PromptList
            collectionNames={collectionNames}
            error={promptState.error}
            loading={promptState.isLoading}
            onSearchChange={setSearchValue}
            onSelect={setSelectedPrompt}
            prompts={filteredPrompts}
            searchValue={searchValue}
          />

          <PromptDetail
            collectionName={
              selectedPrompt?.collection_id
                ? collectionNames[selectedPrompt.collection_id]
                : undefined
            }
            prompt={selectedPrompt}
          />
        </div>
      </section>
    </Layout>
  );
}

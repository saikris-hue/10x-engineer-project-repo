import { useMemo, useState } from "react";

import { CollectionForm, CollectionList } from "../components/collections";
import { Layout, Sidebar } from "../components/layout";
import { PromptDetail, PromptForm, PromptList } from "../components/prompts";
import { Button, Modal } from "../components/shared";
import { demoCollections, demoPrompts } from "../mocks/promptLabDemo";
import type { Collection, CollectionDraft, Prompt, PromptDraft } from "../types/api";

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

export function HomePage() {
  const [collections, setCollections] = useState(demoCollections);
  const [prompts, setPrompts] = useState(demoPrompts);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(demoPrompts[0]);
  const [searchValue, setSearchValue] = useState("");
  const [promptModalState, setPromptModalState] = useState<"closed" | "create" | "edit">(
    "closed",
  );
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);

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

  const handleCreatePrompt = async (values: PromptDraft) => {
    const createdPrompt: Prompt = {
      ...values,
      id: `prompt-${crypto.randomUUID()}`,
      description: values.description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setPrompts((current) => [createdPrompt, ...current]);
    setSelectedPrompt(createdPrompt);
    setPromptModalState("closed");
  };

  const handleEditPrompt = async (values: PromptDraft) => {
    if (!selectedPrompt) {
      return;
    }

    const updatedPrompt: Prompt = {
      ...selectedPrompt,
      ...values,
      description: values.description || null,
      updated_at: new Date().toISOString(),
    };

    setPrompts((current) =>
      current.map((prompt) => (prompt.id === updatedPrompt.id ? updatedPrompt : prompt)),
    );
    setSelectedPrompt(updatedPrompt);
    setPromptModalState("closed");
  };

  const handleDeletePrompt = (prompt: Prompt) => {
    setPrompts((current) => current.filter((item) => item.id !== prompt.id));
    if (selectedPrompt?.id === prompt.id) {
      setSelectedPrompt(null);
    }
  };

  const handleCreateCollection = async (values: CollectionDraft) => {
    const createdCollection: Collection = {
      id: `collection-${crypto.randomUUID()}`,
      name: values.name,
      description: values.description || null,
      created_at: new Date().toISOString(),
    };
    setCollections((current) => [...current, createdCollection]);
    setCollectionModalOpen(false);
  };

  return (
    <Layout
      sidebarContent={
        <Sidebar
          collections={collections}
          onCreateCollection={() => setCollectionModalOpen(true)}
          onSelectCollection={(collection) => setSelectedCollectionId(collection?.id ?? null)}
          promptCounts={promptCounts}
          selectedCollectionId={selectedCollectionId}
        />
      }
    >
      <section className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
          <div className="space-y-6">
            <div className="panel p-8">
              <span className="pill bg-ember/10 text-ember">Mocked workspace</span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink">
                Component demo built from the backend schema for prompts and collections.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/70">
                The mock data below matches the backend fields exactly: prompt `title`, `content`,
                `description`, `collection_id`, timestamps, and collection `name` plus optional
                `description`.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={() => setPromptModalState("create")}>Create prompt</Button>
                <Button variant="ghost" onClick={() => setCollectionModalOpen(true)}>
                  Create collection
                </Button>
              </div>
            </div>

            <PromptList
              collectionNames={collectionNames}
              emptyAction={
                <Button onClick={() => setPromptModalState("create")}>Create prompt</Button>
              }
              onDelete={handleDeletePrompt}
              onEdit={(prompt) => {
                setSelectedPrompt(prompt);
                setPromptModalState("edit");
              }}
              onSearchChange={setSearchValue}
              onSelect={setSelectedPrompt}
              prompts={filteredPrompts}
              searchValue={searchValue}
            />
          </div>

          <div className="space-y-6">
            <PromptDetail
              collectionName={
                selectedPrompt?.collection_id
                  ? collectionNames[selectedPrompt.collection_id]
                  : undefined
              }
              onDelete={handleDeletePrompt}
              onEdit={(prompt) => {
                setSelectedPrompt(prompt);
                setPromptModalState("edit");
              }}
              prompt={selectedPrompt}
            />

            <div className="panel p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Collections</p>
              <h3 className="mt-3 text-xl font-semibold text-ink">Management preview</h3>
              <div className="mt-5">
                <CollectionList
                  collections={collections}
                  promptCounts={promptCounts}
                  selectedCollectionId={selectedCollectionId}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Modal
        isOpen={promptModalState !== "closed"}
        onClose={() => setPromptModalState("closed")}
        title={promptModalState === "edit" ? "Edit prompt" : "Create prompt"}
      >
        <PromptForm
          collections={collections}
          initialValues={
            promptModalState === "edit" && selectedPrompt
              ? {
                  title: selectedPrompt.title,
                  content: selectedPrompt.content,
                  description: selectedPrompt.description ?? "",
                  collection_id: selectedPrompt.collection_id,
                }
              : undefined
          }
          mode={promptModalState === "edit" ? "edit" : "create"}
          onSubmit={promptModalState === "edit" ? handleEditPrompt : handleCreatePrompt}
        />
      </Modal>

      <Modal
        isOpen={collectionModalOpen}
        onClose={() => setCollectionModalOpen(false)}
        title="Create collection"
      >
        <CollectionForm onSubmit={handleCreateCollection} />
      </Modal>
    </Layout>
  );
}

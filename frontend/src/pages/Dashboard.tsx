import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { getCollections } from "../api/collections";
import { getPrompts } from "../api/prompts";
import { Layout, Sidebar } from "../components/layout";
import { PromptList } from "../components/prompts";
import { Button } from "../components/shared";
import type { Collection, Prompt } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { buildCollectionNameMap, buildPromptCountMap } from "../utils/promptLab";

interface DashboardLocationState {
  message?: string;
}

export function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as DashboardLocationState | null;
  const [collections, setCollections] = useState<Collection[]>([]);
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [collectionErrorDetails, setCollectionErrorDetails] = useState<string | null>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [promptErrorDetails, setPromptErrorDetails] = useState<string | null>(null);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const collectionRequestIdRef = useRef(0);
  const promptRequestIdRef = useRef(0);

  const collectionNames = useMemo(() => buildCollectionNameMap(collections), [collections]);
  const promptCounts = useMemo(() => buildPromptCountMap(allPrompts), [allPrompts]);

  useEffect(() => {
    let isActive = true;

    async function loadSidebarData() {
      const requestId = ++collectionRequestIdRef.current;
      setLoadingCollections(true);
      setCollectionError(null);
      setCollectionErrorDetails(null);

      try {
        const [collectionsResponse, promptsResponse] = await Promise.all([
          getCollections(),
          getPrompts(),
        ]);

        if (!isActive || requestId !== collectionRequestIdRef.current) {
          return;
        }

        setCollections(collectionsResponse.collections);
        setAllPrompts(promptsResponse.prompts);
      } catch (error) {
        if (!isActive || requestId !== collectionRequestIdRef.current) {
          return;
        }

        const friendlyError = getErrorMessage(error);
        setCollectionError(friendlyError.message);
        setCollectionErrorDetails(friendlyError.details ?? null);
      } finally {
        if (isActive && requestId === collectionRequestIdRef.current) {
          setLoadingCollections(false);
        }
      }
    }

    void loadSidebarData();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadPrompts() {
      const requestId = ++promptRequestIdRef.current;
      setLoadingPrompts(true);
      setPromptError(null);
      setPromptErrorDetails(null);

      try {
        const response = await getPrompts({
          collection_id: selectedCollectionId,
          search: searchValue || undefined,
        });

        if (!isActive || requestId !== promptRequestIdRef.current) {
          return;
        }

        setPrompts(response.prompts);
      } catch (error) {
        if (!isActive || requestId !== promptRequestIdRef.current) {
          return;
        }

        const friendlyError = getErrorMessage(error);
        setPromptError(friendlyError.message);
        setPromptErrorDetails(friendlyError.details ?? null);
      } finally {
        if (isActive && requestId === promptRequestIdRef.current) {
          setLoadingPrompts(false);
        }
      }
    }

    void loadPrompts();
    return () => {
      isActive = false;
    };
  }, [searchValue, selectedCollectionId]);

  return (
    <Layout
      headerActions={
        <Link to="/prompts/new">
          <Button>Create prompt</Button>
        </Link>
      }
      sidebarContent={
        <Sidebar
          collections={collections}
          errorDetails={collectionErrorDetails ?? undefined}
          error={collectionError}
          loading={loadingCollections}
          onCreateCollection={() => navigate("/collections")}
          onRetry={() => window.location.reload()}
          onSelectCollection={(collection) => setSelectedCollectionId(collection?.id ?? null)}
          promptCounts={promptCounts}
          selectedCollectionId={selectedCollectionId}
        />
      }
      title="PromptLab Dashboard"
    >
      <section className="space-y-6">
        <div className="panel p-6 sm:p-8">
          <span className="pill bg-signal/10 text-signal">Server-side filtering</span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">Prompts dashboard</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-ink/70">
            Prompts are loaded from the real backend using `GET /prompts` with server-side
            `search` and `collection_id` query parameters.
          </p>
          {locationState?.message ? (
            <div className="mt-5 rounded-3xl border border-lagoon/20 bg-lagoon/10 px-4 py-3 text-sm text-lagoon">
              {locationState.message}
            </div>
          ) : null}
        </div>

        <PromptList
          collectionNames={collectionNames}
          emptyAction={
            <Link to="/prompts/new">
              <Button>Create prompt</Button>
            </Link>
          }
          emptyMessage={
            searchValue
              ? "No prompts matched your search. Try a different phrase or clear the search."
              : selectedCollectionId
                ? "No prompts are in this collection yet. Create one or clear the filter."
                : "Create your first prompt to start building your library."
          }
          emptySecondaryAction={
            searchValue || selectedCollectionId ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchValue("");
                  setSelectedCollectionId(null);
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
          emptyTitle={
            searchValue
              ? "No search results"
              : selectedCollectionId
                ? "No prompts in this collection"
                : "No prompts yet"
          }
          errorDetails={promptErrorDetails ?? undefined}
          error={promptError}
          loading={loadingPrompts}
          onEdit={(prompt) => navigate(`/prompts/${prompt.id}/edit`)}
          onRetry={() => window.location.reload()}
          onSearchChange={setSearchValue}
          onSelect={(prompt) => navigate(`/prompts/${prompt.id}`)}
          prompts={prompts}
          searchValue={searchValue}
        />
      </section>
    </Layout>
  );
}

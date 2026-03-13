import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createCollection, deleteCollection, getCollections } from "../api/collections";
import { getPrompts } from "../api/prompts";
import { CollectionForm, CollectionList } from "../components/collections";
import { Layout } from "../components/layout";
import { Button, ErrorMessage, LoadingSpinner, Modal } from "../components/shared";
import type { Collection, CollectionDraft, Prompt } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { buildPromptCountMap } from "../utils/promptLab";

export function CollectionsPage() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadErrorDetails, setLoadErrorDetails] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorDetails, setSubmitErrorDetails] = useState<string | null>(null);
  const [submitFieldErrors, setSubmitFieldErrors] = useState<
    Partial<Record<keyof CollectionDraft, string>>
  >({});
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteErrorDetails, setDeleteErrorDetails] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);

  const promptCounts = useMemo(() => buildPromptCountMap(prompts), [prompts]);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    setLoadErrorDetails(null);

    try {
      const [collectionsResponse, promptsResponse] = await Promise.all([
        getCollections(),
        getPrompts(),
      ]);
      setCollections(collectionsResponse.collections);
      setPrompts(promptsResponse.prompts);
    } catch (error) {
      const friendlyError = getErrorMessage(error);
      setLoadError(friendlyError.message);
      setLoadErrorDetails(friendlyError.details ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreate = async (values: CollectionDraft) => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitErrorDetails(null);
    setSubmitFieldErrors({});

    try {
      await createCollection(values);
      await loadData();
    } catch (error) {
      const friendlyError = getErrorMessage(error);
      setSubmitError(friendlyError.message);
      setSubmitErrorDetails(friendlyError.details ?? null);
      setSubmitFieldErrors(
        (friendlyError.fieldErrors as Partial<Record<keyof CollectionDraft, string>>) ?? {},
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!collectionToDelete) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    setDeleteErrorDetails(null);

    try {
      await deleteCollection(collectionToDelete.id);
      setCollectionToDelete(null);
      await loadData();
    } catch (error) {
      const friendlyError = getErrorMessage(error);
      setDeleteError(friendlyError.message);
      setDeleteErrorDetails(friendlyError.details ?? null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout
      headerActions={
        <div className="flex gap-3">
          <Button onClick={() => navigate("/prompts/new")}>New prompt</Button>
          <Link to="/">
            <Button variant="ghost">Back to dashboard</Button>
          </Link>
        </div>
      }
      title="Collections"
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_420px]">
        <div className="space-y-6">
          <div className="panel p-8">
            <span className="pill bg-signal/10 text-signal">Collections CRUD</span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">
              Manage collections
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-ink/70">
              Collections are loaded from `GET /collections`, created with `POST /collections`,
              and deleted with `DELETE /collections/:id`.
            </p>
          </div>

          {loadError ? (
            <ErrorMessage
              details={loadErrorDetails ?? undefined}
              message={loadError}
              onRetry={() => void loadData()}
            />
          ) : null}
          {loading ? <LoadingSpinner centered label="Loading collections" /> : null}
          {!loading ? (
            <div className="panel p-6">
              <CollectionList
                collections={collections}
                onDelete={(collection) => setCollectionToDelete(collection)}
                promptCounts={promptCounts}
              />
              {!collections.length ? (
                <div className="mt-5 rounded-3xl border border-dashed border-ink/10 bg-white/50 p-5 text-sm text-ink/65">
                  No collections yet. Create one from the form to start organizing prompts.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="panel p-8">
          <span className="pill bg-ember/10 text-ember">Create collection</span>
          <h2 className="mt-4 text-2xl font-semibold text-ink">New collection</h2>
          <div className="mt-6">
            <CollectionForm
              error={submitError}
              fieldErrors={submitFieldErrors}
              onSubmit={handleCreate}
              submitting={submitting}
            />
            {submitErrorDetails ? (
              <div className="mt-5">
                <ErrorMessage details={submitErrorDetails} message={submitError ?? ""} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <Modal
        closeDisabled={deleting}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button disabled={deleting} variant="ghost" onClick={() => setCollectionToDelete(null)}>
              Cancel
            </Button>
            <Button
              loading={deleting}
              loadingLabel="Deleting..."
              variant="danger"
              onClick={() => void handleDelete()}
            >
              Delete collection
            </Button>
          </div>
        }
        isOpen={collectionToDelete !== null}
        onClose={() => setCollectionToDelete(null)}
        title="Delete collection"
      >
        <p className="text-sm leading-6 text-ink/70">
          Deleting a collection also deletes prompts that belong to it in the current backend
          implementation.
        </p>
        {deleteError ? (
          <div className="mt-4">
            <ErrorMessage details={deleteErrorDetails ?? undefined} message={deleteError} />
          </div>
        ) : null}
      </Modal>
    </Layout>
  );
}

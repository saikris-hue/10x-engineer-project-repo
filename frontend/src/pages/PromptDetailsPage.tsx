import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { deletePrompt, getPrompt } from "../api/prompts";
import { getCollections } from "../api/collections";
import { Layout } from "../components/layout";
import { PromptDetail } from "../components/prompts";
import { Button, ErrorMessage, Modal } from "../components/shared";
import type { Collection, Prompt } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { buildCollectionNameMap } from "../utils/promptLab";

interface PromptLocationState {
  message?: string;
}

export function PromptDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as PromptLocationState | null;
  const { id } = useParams();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteErrorDetails, setDeleteErrorDetails] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const collectionNames = useMemo(() => buildCollectionNameMap(collections), [collections]);

  useEffect(() => {
    let isActive = true;

    async function loadData() {
      if (!id) {
        setError("Prompt ID is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setErrorDetails(null);

      try {
        const [promptResponse, collectionsResponse] = await Promise.all([
          getPrompt(id),
          getCollections(),
        ]);

        if (!isActive) {
          return;
        }

        setPrompt(promptResponse);
        setCollections(collectionsResponse.collections);
      } catch (loadFailure) {
        if (!isActive) {
          return;
        }
        const friendlyError = getErrorMessage(loadFailure);
        setError(friendlyError.message);
        setErrorDetails(friendlyError.details ?? null);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      isActive = false;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!id) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    setDeleteErrorDetails(null);

    try {
      await deletePrompt(id);
      navigate("/", {
        state: { message: "Prompt deleted successfully." },
      });
    } catch (deleteFailure) {
      const friendlyError = getErrorMessage(deleteFailure);
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
          {id ? (
            <Link to={`/prompts/${id}/edit`}>
              <Button variant="secondary">Edit prompt</Button>
            </Link>
          ) : null}
          <Link to="/">
            <Button variant="ghost">Back to dashboard</Button>
          </Link>
        </div>
      }
      title="Prompt Details"
    >
      <section className="space-y-6">
        {locationState?.message ? (
          <div className="rounded-3xl border border-lagoon/20 bg-lagoon/10 px-4 py-3 text-sm text-lagoon">
            {locationState.message}
          </div>
        ) : null}

        <PromptDetail
          collectionName={
            prompt?.collection_id ? collectionNames[prompt.collection_id] : undefined
          }
          errorDetails={errorDetails ?? undefined}
          error={error}
          loading={loading}
          onBack={() => navigate("/")}
          onDelete={() => setDeleteModalOpen(true)}
          onEdit={(currentPrompt) => navigate(`/prompts/${currentPrompt.id}/edit`)}
          onRetry={() => window.location.reload()}
          prompt={prompt}
        />
      </section>

      <Modal
        closeDisabled={deleting}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button disabled={deleting} variant="ghost" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={deleting}
              loadingLabel="Deleting..."
              variant="danger"
              onClick={() => void handleDelete()}
            >
              Delete prompt
            </Button>
          </div>
        }
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete prompt"
      >
        <p className="text-sm leading-6 text-ink/70">
          This will permanently delete the prompt and its saved versions. This action cannot be
          undone.
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

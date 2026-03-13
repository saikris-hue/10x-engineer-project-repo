import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getCollections } from "../api/collections";
import { createPrompt } from "../api/prompts";
import { Layout } from "../components/layout";
import { PromptForm } from "../components/prompts";
import { Button, ErrorMessage, LoadingSpinner } from "../components/shared";
import type { Collection, PromptDraft } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";

export function PromptCreate() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadErrorDetails, setLoadErrorDetails] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorDetails, setSubmitErrorDetails] = useState<string | null>(null);
  const [submitFieldErrors, setSubmitFieldErrors] = useState<Partial<Record<keyof PromptDraft, string>>>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadCollections() {
      setLoadingCollections(true);
      setLoadError(null);
      setLoadErrorDetails(null);

      try {
        const response = await getCollections();
        if (isActive) {
          setCollections(response.collections);
        }
      } catch (error) {
        if (isActive) {
          const friendlyError = getErrorMessage(error);
          setLoadError(friendlyError.message);
          setLoadErrorDetails(friendlyError.details ?? null);
        }
      } finally {
        if (isActive) {
          setLoadingCollections(false);
        }
      }
    }

    void loadCollections();
    return () => {
      isActive = false;
    };
  }, []);

  const handleSubmit = async (values: PromptDraft) => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitErrorDetails(null);
    setSubmitFieldErrors({});

    try {
      const createdPrompt = await createPrompt(values);
      navigate(`/prompts/${createdPrompt.id}`, {
        state: { message: "Prompt created successfully." },
      });
    } catch (error) {
      const friendlyError = getErrorMessage(error);
      setSubmitError(friendlyError.message);
      setSubmitErrorDetails(friendlyError.details ?? null);
      setSubmitFieldErrors((friendlyError.fieldErrors as Partial<Record<keyof PromptDraft, string>>) ?? {});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout
      headerActions={
        <Link to="/">
          <Button variant="ghost">Back to dashboard</Button>
        </Link>
      }
      title="Create Prompt"
    >
      <section className="space-y-6">
        <div className="panel p-8">
          <span className="pill bg-ember/10 text-ember">Create flow</span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">New prompt</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-ink/70">
            This form posts to `POST /prompts` using the backend-required fields: title, content,
            optional description, and optional collection ID.
          </p>
        </div>

        {loadingCollections ? <LoadingSpinner centered label="Loading collections" /> : null}
        {loadError ? (
          <ErrorMessage
            details={loadErrorDetails ?? undefined}
            message={loadError}
            onRetry={() => window.location.reload()}
            title="Couldn't load collections"
          />
        ) : null}
        {!loadingCollections ? (
          <div className="panel p-8">
            <PromptForm
              collections={collections}
              error={submitError}
              fieldErrors={submitFieldErrors}
              initialValues={{ collection_id: collections[0]?.id ?? null }}
              mode="create"
              onSubmit={handleSubmit}
              submitting={submitting}
            />
            {submitErrorDetails ? (
              <div className="mt-5">
                <ErrorMessage details={submitErrorDetails} message={submitError ?? ""} />
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </Layout>
  );
}

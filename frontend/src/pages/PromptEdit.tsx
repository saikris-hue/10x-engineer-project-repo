import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getCollections } from "../api/collections";
import { getPrompt, updatePrompt } from "../api/prompts";
import { Layout } from "../components/layout";
import { PromptForm } from "../components/prompts";
import { Button, ErrorMessage, LoadingSpinner } from "../components/shared";
import type { Collection, Prompt, PromptDraft } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";

export function PromptEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
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

    async function loadData() {
      if (!id) {
        setLoadError("Prompt ID is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);
      setLoadErrorDetails(null);

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
      } catch (error) {
        if (!isActive) {
          return;
        }
        const friendlyError = getErrorMessage(error);
        setLoadError(friendlyError.message);
        setLoadErrorDetails(friendlyError.details ?? null);
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

  const handleSubmit = async (values: PromptDraft) => {
    if (!id) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitErrorDetails(null);
    setSubmitFieldErrors({});

    try {
      await updatePrompt(id, values);
      navigate(`/prompts/${id}`, {
        state: { message: "Prompt updated successfully." },
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
        <Link to={id ? `/prompts/${id}` : "/"}>
          <Button variant="ghost">Back</Button>
        </Link>
      }
      title="Edit Prompt"
    >
      <section className="space-y-6">
        <div className="panel p-8">
          <span className="pill bg-signal/10 text-signal">Edit flow</span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">Edit prompt</h1>
        </div>

        {loading ? <LoadingSpinner centered label="Loading prompt" /> : null}
        {loadError ? (
          <ErrorMessage
            details={loadErrorDetails ?? undefined}
            message={loadError}
            onRetry={() => window.location.reload()}
            title="Couldn't load prompt"
          />
        ) : null}
        {!loading && !loadError && prompt ? (
          <div className="panel p-8">
            <PromptForm
              collections={collections}
              error={submitError}
              fieldErrors={submitFieldErrors}
              initialValues={{
                title: prompt.title,
                content: prompt.content,
                description: prompt.description ?? "",
                collection_id: prompt.collection_id,
              }}
              mode="edit"
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

import type { Prompt } from "../../types/api";
import { Button, ErrorMessage } from "../shared";

interface PromptDetailProps {
  collectionName?: string;
  errorDetails?: string;
  errorTitle?: string;
  error?: string | null;
  loading?: boolean;
  onBack?: () => void;
  onDelete?: (prompt: Prompt) => void;
  onEdit?: (prompt: Prompt) => void;
  onRetry?: () => void;
  prompt?: Prompt | null;
}

export default function PromptDetail({
  collectionName,
  errorDetails,
  errorTitle = "Couldn't load prompt",
  error,
  loading = false,
  onBack,
  onDelete,
  onEdit,
  onRetry,
  prompt,
}: PromptDetailProps) {
  if (loading) {
    return (
      <div className="panel p-8">
        <div className="skeleton h-6 w-28" />
        <div className="skeleton mt-5 h-10 w-2/3" />
        <div className="skeleton mt-4 h-4 w-full" />
        <div className="skeleton mt-2 h-4 w-5/6" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
        </div>
        <div className="skeleton mt-6 h-72" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        details={errorDetails}
        message={error}
        onRetry={onRetry}
        title={errorTitle}
      />
    );
  }

  if (!prompt) {
    return (
      <div className="panel p-8 text-sm text-ink/60">
        Select a prompt to inspect its full content and metadata.
      </div>
    );
  }

  return (
    <article className="panel p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="pill bg-lagoon/10 text-lagoon">
            {collectionName ?? "No collection"}
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-ink">{prompt.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/70">
            {prompt.description ?? "No description provided."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onBack ? (
            <Button variant="ghost" onClick={onBack}>
              Back
            </Button>
          ) : null}
          {onEdit ? (
            <Button variant="secondary" onClick={() => onEdit(prompt)}>
              Edit
            </Button>
          ) : null}
          {onDelete ? (
            <Button variant="danger" onClick={() => onDelete(prompt)}>
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-white/70 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Created</p>
          <p className="mt-2 text-sm text-ink">{new Date(prompt.created_at).toLocaleString()}</p>
        </div>
        <div className="rounded-3xl bg-white/70 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Updated</p>
          <p className="mt-2 text-sm text-ink">{new Date(prompt.updated_at).toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[2rem] bg-ink px-5 py-5">
        <pre className="max-h-[32rem] whitespace-pre-wrap text-sm leading-7 text-mist">
          <code>{prompt.content}</code>
        </pre>
      </div>
    </article>
  );
}

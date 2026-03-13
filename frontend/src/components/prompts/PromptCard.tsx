import type { Prompt } from "../../types/api";
import { Button } from "../shared";

interface PromptCardProps {
  collectionName?: string;
  onDelete?: (prompt: Prompt) => void;
  onEdit?: (prompt: Prompt) => void;
  onView?: (prompt: Prompt) => void;
  prompt: Prompt;
  // TODO(confirm backend field): no tags exist in the current backend schema.
  tags?: string[];
  view?: "grid" | "list";
}

export default function PromptCard({
  collectionName,
  onDelete,
  onEdit,
  onView,
  prompt,
  tags = [],
  view = "grid",
}: PromptCardProps) {
  return (
    <article className="panel p-6">
      <div className={view === "list" ? "flex flex-wrap items-start justify-between gap-5" : ""}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill bg-signal/10 text-signal">
              {collectionName ?? "No collection"}
            </span>
            <span className="text-xs uppercase tracking-[0.18em] text-ink/40">
              Updated {new Date(prompt.updated_at).toLocaleDateString()}
            </span>
          </div>

          <h3 className="mt-4 text-2xl font-semibold text-ink">{prompt.title}</h3>
          <p className="mt-3 text-fade-3 text-sm leading-6 text-ink/70">
            {prompt.description ?? prompt.content}
          </p>

          {tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="pill border-lagoon/20 bg-lagoon/10 text-lagoon">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {onView ? (
            <Button size="sm" variant="primary" onClick={() => onView(prompt)}>
              View
            </Button>
          ) : null}
          {onEdit ? (
            <Button size="sm" variant="ghost" onClick={() => onEdit(prompt)}>
              Edit
            </Button>
          ) : null}
          {onDelete ? (
            <Button size="sm" variant="danger" onClick={() => onDelete(prompt)}>
              Delete
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

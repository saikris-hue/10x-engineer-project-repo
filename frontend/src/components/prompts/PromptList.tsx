import type { ReactNode } from "react";
import type { Prompt } from "../../types/api";
import { ErrorMessage, LoadingSpinner, SearchBar } from "../shared";

import PromptCard from "./PromptCard";

type PromptListView = "grid" | "list";

interface PromptListProps {
  collectionNames?: Record<string, string>;
  emptyAction?: ReactNode;
  emptyMessage?: string;
  emptySecondaryAction?: ReactNode;
  emptyTitle?: string;
  errorDetails?: string;
  errorTitle?: string;
  error?: string | null;
  loading?: boolean;
  onDelete?: (prompt: Prompt) => void;
  onEdit?: (prompt: Prompt) => void;
  onRetry?: () => void;
  onSearchChange?: (value: string) => void;
  onSelect?: (prompt: Prompt) => void;
  prompts: Prompt[];
  searchValue?: string;
  view?: PromptListView;
}

export default function PromptList({
  collectionNames = {},
  emptyAction,
  emptyMessage = "Create your first prompt or adjust the current search and collection filters.",
  emptySecondaryAction,
  emptyTitle = "No prompts found",
  errorDetails,
  errorTitle = "Couldn't load prompts",
  error,
  loading = false,
  onDelete,
  onEdit,
  onRetry,
  onSearchChange,
  onSelect,
  prompts,
  searchValue = "",
  view = "grid",
}: PromptListProps) {
  return (
    <section className="space-y-5">
      {onSearchChange ? (
        <SearchBar
          debounceMs={150}
          disabled={loading}
          onChange={onSearchChange}
          placeholder="Search prompts by title or description"
          value={searchValue}
        />
      ) : null}

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="panel p-6">
              <div className="skeleton h-6 w-24" />
              <div className="skeleton mt-4 h-8 w-3/4" />
              <div className="skeleton mt-4 h-4 w-full" />
              <div className="skeleton mt-2 h-4 w-5/6" />
              <div className="mt-6 flex gap-2">
                <div className="skeleton h-11 w-24" />
                <div className="skeleton h-11 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {error ? (
        <ErrorMessage
          details={errorDetails}
          message={error}
          onRetry={onRetry}
          title={errorTitle}
        />
      ) : null}

      {!loading && !error && prompts.length === 0 ? (
        <div className="panel p-8">
          <p className="text-xl font-semibold text-ink">{emptyTitle}</p>
          <p className="mt-2 text-sm text-ink/65">{emptyMessage}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {emptyAction}
            {emptySecondaryAction}
          </div>
        </div>
      ) : null}

      {!loading && !error && prompts.length > 0 ? (
        <div className={view === "grid" ? "grid gap-4 xl:grid-cols-2" : "grid gap-4"}>
          {prompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              collectionName={
                prompt.collection_id ? collectionNames[prompt.collection_id] : undefined
              }
              onDelete={onDelete}
              onEdit={onEdit}
              onView={onSelect}
              prompt={prompt}
              view={view}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

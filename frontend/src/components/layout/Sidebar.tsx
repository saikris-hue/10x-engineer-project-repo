import type { Collection } from "../../types/api";
import { CollectionList } from "../collections";
import { Button, ErrorMessage } from "../shared";

interface SidebarProps {
  collections: Collection[];
  errorDetails?: string;
  errorTitle?: string;
  error?: string | null;
  loading?: boolean;
  onCreateCollection?: () => void;
  onRetry?: () => void;
  onSelectCollection?: (collection: Collection | null) => void;
  promptCounts?: Record<string, number>;
  selectedCollectionId?: string | null;
}

export default function Sidebar({
  collections,
  errorDetails,
  errorTitle = "Couldn't load collections",
  error,
  loading = false,
  onCreateCollection,
  onRetry,
  onSelectCollection,
  promptCounts,
  selectedCollectionId,
}: SidebarProps) {
  return (
    <aside className="panel h-fit p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink/40">Collections</p>
          <h2 className="mt-2 text-xl font-semibold text-ink">Browse by group</h2>
        </div>
        {onCreateCollection ? (
          <Button size="sm" variant="secondary" onClick={onCreateCollection}>
            Create
          </Button>
        ) : null}
      </div>

      <button
        type="button"
        className={[
          "mt-5 w-full rounded-3xl border px-4 py-3 text-left text-sm font-semibold transition",
          selectedCollectionId === null
            ? "border-ink bg-ink text-white"
            : "border-ink/10 bg-white/60 text-ink hover:bg-ink/5",
        ].join(" ")}
        onClick={() => onSelectCollection?.(null)}
      >
        All prompts
      </button>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-ink/8 bg-white/60 p-4">
                <div className="skeleton h-5 w-2/3" />
                <div className="skeleton mt-3 h-4 w-full" />
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
        {!loading && !error ? (
          <CollectionList
            collections={collections}
            onSelect={onSelectCollection}
            promptCounts={promptCounts}
            selectedCollectionId={selectedCollectionId}
          />
        ) : null}
      </div>

      {!loading && !error && collections.length === 0 && onCreateCollection ? (
        <div className="mt-5">
          <Button className="w-full" variant="ghost" onClick={onCreateCollection}>
            Create your first collection
          </Button>
        </div>
      ) : null}
    </aside>
  );
}

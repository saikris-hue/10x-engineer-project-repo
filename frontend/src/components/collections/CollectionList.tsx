import type { Collection } from "../../types/api";

import { Button } from "../shared";

interface CollectionListProps {
  collections: Collection[];
  onDelete?: (collection: Collection) => void;
  onEdit?: (collection: Collection) => void;
  onSelect?: (collection: Collection) => void;
  promptCounts?: Record<string, number>;
  selectedCollectionId?: string | null;
}

export default function CollectionList({
  collections,
  onDelete,
  onEdit,
  onSelect,
  promptCounts = {},
  selectedCollectionId,
}: CollectionListProps) {
  if (!collections.length) {
    return (
      <div className="rounded-3xl border border-dashed border-ink/10 bg-white/50 p-4 text-sm text-ink/60">
        No collections yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {collections.map((collection) => {
        const isSelected = collection.id === selectedCollectionId;

        return (
          <div
            key={collection.id}
            className={[
              "rounded-3xl border px-4 py-4 transition",
              isSelected
                ? "border-signal/25 bg-signal/10"
                : "border-ink/8 bg-white/60 hover:border-ink/15",
            ].join(" ")}
          >
            <button
              type="button"
              className="w-full text-left"
              onClick={() => onSelect?.(collection)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{collection.name}</p>
                  <p className="mt-1 text-sm text-ink/60">
                    {collection.description ?? "No description"}
                  </p>
                </div>
                <span className="pill bg-white/70 text-ink">
                  {promptCounts[collection.id] ?? 0}
                </span>
              </div>
            </button>

            {onEdit || onDelete ? (
              <div className="mt-4 flex gap-2">
                {onEdit ? (
                  <Button size="sm" variant="ghost" onClick={() => onEdit(collection)}>
                    Edit
                  </Button>
                ) : null}
                {onDelete ? (
                  <Button size="sm" variant="danger" onClick={() => onDelete(collection)}>
                    Delete
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

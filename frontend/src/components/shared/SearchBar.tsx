import { useEffect, useState } from "react";

interface SearchBarProps {
  debounceMs?: number;
  disabled?: boolean;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  value: string;
}

export default function SearchBar({
  debounceMs = 0,
  disabled = false,
  onChange,
  onClear,
  placeholder = "Search",
  value,
}: SearchBarProps) {
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  useEffect(() => {
    if (!debounceMs) {
      return;
    }

    const timeoutId = window.setTimeout(() => onChange(draftValue), debounceMs);
    return () => window.clearTimeout(timeoutId);
  }, [debounceMs, draftValue, onChange]);

  const handleImmediateChange = (nextValue: string) => {
    setDraftValue(nextValue);
    if (!debounceMs) {
      onChange(nextValue);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35">
          Search
        </span>
        <input
          aria-label={placeholder}
          className="field pl-20 disabled:cursor-not-allowed disabled:bg-ink/5"
          disabled={disabled}
          placeholder={placeholder}
          value={draftValue}
          onChange={(event) => handleImmediateChange(event.target.value)}
        />
      </div>
      {draftValue ? (
        <button
          type="button"
          className="rounded-full border border-ink/10 px-4 py-3 text-sm font-semibold text-ink/70 transition hover:bg-ink/5"
          disabled={disabled}
          onClick={() => {
            setDraftValue("");
            onChange("");
            onClear?.();
          }}
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}

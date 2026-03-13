interface LoadingSpinnerProps {
  centered?: boolean;
  inline?: boolean;
  label?: string;
}

export default function LoadingSpinner({
  centered = false,
  inline = false,
  label = "Loading",
}: LoadingSpinnerProps) {
  const spinner = (
    <span className="inline-flex items-center gap-2" role="status">
      <span
        aria-hidden="true"
        className={[
          "inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent",
          inline ? "" : "text-signal",
        ].join(" ")}
      />
      <span className="sr-only">{label}</span>
    </span>
  );

  if (centered) {
    return (
      <div className="flex items-center justify-center py-10 text-signal">
        {spinner}
      </div>
    );
  }

  return spinner;
}

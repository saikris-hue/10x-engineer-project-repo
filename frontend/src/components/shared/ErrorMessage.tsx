import Button from "./Button";

interface ErrorMessageProps {
  details?: string;
  message: string;
  onRetry?: () => void;
  title?: string;
}

export default function ErrorMessage({
  details,
  message,
  onRetry,
  title = "Something went wrong",
}: ErrorMessageProps) {
  return (
    <div className="panel border border-red-200 bg-red-50/90 p-5 text-red-700" role="alert">
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6">{message}</p>
      {details ? (
        <details className="mt-3 text-xs text-red-800/85">
          <summary className="cursor-pointer font-semibold">Technical details</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-white/70 p-3">
            {details}
          </pre>
        </details>
      ) : null}
      {onRetry ? (
        <div className="mt-4">
          <Button size="sm" variant="danger" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}

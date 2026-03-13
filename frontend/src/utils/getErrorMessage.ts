import { ApiError } from "../api/client";

export interface FriendlyError {
  details?: string;
  fieldErrors?: Record<string, string>;
  message: string;
  title: string;
}

function toSentence(value: string) {
  return value.endsWith(".") ? value : `${value}.`;
}

function formatDetails(details: unknown): string | undefined {
  if (!details) {
    return undefined;
  }

  if (typeof details === "string") {
    return details;
  }

  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return undefined;
  }
}

function extractFieldErrors(details: unknown): Record<string, string> | undefined {
  if (!Array.isArray(details)) {
    return undefined;
  }

  const fieldErrors = details.reduce<Record<string, string>>((errors, item) => {
    if (
      item &&
      typeof item === "object" &&
      "loc" in item &&
      Array.isArray((item as { loc: unknown }).loc) &&
      "msg" in item &&
      typeof (item as { msg: unknown }).msg === "string"
    ) {
      const locationParts = (item as { loc: unknown[] }).loc;
      const field = String(locationParts[locationParts.length - 1] ?? "");
      if (field) {
        errors[field] = (item as { msg: string }).msg;
      }
    }
    return errors;
  }, {});

  return Object.keys(fieldErrors).length ? fieldErrors : undefined;
}

export function getErrorMessage(error: unknown): FriendlyError {
  if (error instanceof ApiError) {
    const details = formatDetails(error.details);
    const fieldErrors = extractFieldErrors(error.details);

    if (error.status === 400 || error.status === 422) {
      return {
        details,
        fieldErrors,
        message: fieldErrors
          ? "Please fix the highlighted fields and try again."
          : toSentence(error.message || "Please fix the highlighted fields"),
        title: "Please check your input",
      };
    }

    if (error.status === 401 || error.status === 403) {
      return {
        details,
        message: "You're not authorized to do that. Please sign in and try again.",
        title: "Authorization required",
      };
    }

    if (error.status === 404) {
      return {
        details,
        message: "We couldn't find that item. It may have been removed or never existed.",
        title: "Item not found",
      };
    }

    if (error.status === 409) {
      return {
        details,
        message: "This request conflicts with existing data. Please review and try again.",
        title: "Conflict detected",
      };
    }

    if (error.status >= 500 || error.status === 0 || error.status === 408) {
      return {
        details,
        message: "Something went wrong. Check your connection and try again.",
        title: "Request failed",
      };
    }

    return {
      details,
      message: toSentence(error.message || "We couldn't complete that request"),
      title: "Request failed",
    };
  }

  if (error instanceof Error) {
    return {
      message: toSentence(error.message || "Something went wrong"),
      title: "Request failed",
    };
  }

  return {
    message: "Something went wrong. Check your connection and try again.",
    title: "Request failed",
  };
}

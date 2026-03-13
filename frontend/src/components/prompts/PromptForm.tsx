import { useEffect, useMemo, useRef, useState } from "react";

import type { Collection, PromptDraft } from "../../types/api";
import { Button, ErrorMessage } from "../shared";

interface PromptFormProps {
  collections?: Collection[];
  error?: string | null;
  fieldErrors?: Partial<Record<keyof PromptDraft, string>>;
  initialValues?: Partial<PromptDraft>;
  mode?: "create" | "edit";
  onSubmit: (values: PromptDraft) => void | Promise<void>;
  submitting?: boolean;
}

const defaultValues: PromptDraft = {
  title: "",
  content: "",
  description: "",
  collection_id: null,
};

export default function PromptForm({
  collections = [],
  error,
  fieldErrors = {},
  initialValues,
  mode = "create",
  onSubmit,
  submitting = false,
}: PromptFormProps) {
  const startingValues = useMemo(
    () => ({ ...defaultValues, ...initialValues }),
    [initialValues],
  );
  const [values, setValues] = useState<PromptDraft>(startingValues);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof PromptDraft, string>>>(
    {},
  );
  const titleRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const collectionRef = useRef<HTMLSelectElement | null>(null);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setValues(startingValues);
  }, [startingValues]);

  useEffect(() => {
    setValidationErrors((current) => ({ ...fieldErrors, ...current }));
  }, [fieldErrors]);

  const focusField = (field: keyof PromptDraft) => {
    const fieldMap = {
      collection_id: collectionRef,
      content: contentRef,
      description: descriptionRef,
      title: titleRef,
    };

    fieldMap[field]?.current?.focus();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof PromptDraft, string>> = {};

    if (!values.title.trim()) {
      nextErrors.title = "Prompt title is required.";
    }

    if (values.title.trim().length > 200) {
      nextErrors.title = "Prompt title must be 200 characters or fewer.";
    }

    if (!values.content.trim()) {
      nextErrors.content = "Prompt content is required.";
    }

    if (values.description.trim().length > 500) {
      nextErrors.description = "Description must be 500 characters or fewer.";
    }

    setValidationErrors(nextErrors);

    const firstInvalidField = Object.keys(nextErrors)[0] as keyof PromptDraft | undefined;
    if (firstInvalidField) {
      focusField(firstInvalidField);
      return;
    }

    await onSubmit({
      title: values.title.trim(),
      content: values.content,
      description: values.description.trim(),
      collection_id: values.collection_id || null,
    });
  };

  return (
    <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
      {error ? <ErrorMessage message={error} /> : null}

      <div>
        <label className="label" htmlFor="prompt-title">
          Title
        </label>
        <input
          aria-describedby={validationErrors.title ? "prompt-title-error" : undefined}
          aria-invalid={Boolean(validationErrors.title)}
          className="field"
          disabled={submitting}
          id="prompt-title"
          maxLength={200}
          ref={titleRef}
          value={values.title}
          onChange={(event) => {
            setValidationErrors((current) => ({ ...current, title: undefined }));
            setValues((current) => ({ ...current, title: event.target.value }));
          }}
        />
        {validationErrors.title ? (
          <p className="mt-2 text-sm text-red-700" id="prompt-title-error">
            {validationErrors.title}
          </p>
        ) : null}
      </div>

      <div>
        <label className="label" htmlFor="prompt-description">
          Description
        </label>
        <textarea
          aria-describedby={validationErrors.description ? "prompt-description-error" : undefined}
          aria-invalid={Boolean(validationErrors.description)}
          className="field min-h-24 resize-y"
          disabled={submitting}
          id="prompt-description"
          maxLength={500}
          ref={descriptionRef}
          value={values.description}
          onChange={(event) => {
            setValidationErrors((current) => ({ ...current, description: undefined }));
            setValues((current) => ({ ...current, description: event.target.value }));
          }}
        />
        {validationErrors.description ? (
          <p className="mt-2 text-sm text-red-700" id="prompt-description-error">
            {validationErrors.description}
          </p>
        ) : null}
      </div>

      <div>
        <label className="label" htmlFor="prompt-collection">
          Collection
        </label>
        <select
          aria-describedby={validationErrors.collection_id ? "prompt-collection-error" : undefined}
          aria-invalid={Boolean(validationErrors.collection_id)}
          className="field"
          disabled={submitting}
          id="prompt-collection"
          ref={collectionRef}
          value={values.collection_id ?? ""}
          onChange={(event) =>
            setValues((current) => {
              setValidationErrors((errors) => ({ ...errors, collection_id: undefined }));
              return {
                ...current,
                collection_id: event.target.value || null,
              };
            })
          }
        >
          <option value="">No collection</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>
        {validationErrors.collection_id ? (
          <p className="mt-2 text-sm text-red-700" id="prompt-collection-error">
            {validationErrors.collection_id}
          </p>
        ) : null}
      </div>

      <div>
        <label className="label" htmlFor="prompt-content">
          Content
        </label>
        <textarea
          aria-describedby={validationErrors.content ? "prompt-content-error" : undefined}
          aria-invalid={Boolean(validationErrors.content)}
          className="field min-h-56 resize-y font-mono"
          disabled={submitting}
          id="prompt-content"
          ref={contentRef}
          value={values.content}
          onChange={(event) => {
            setValidationErrors((current) => ({ ...current, content: undefined }));
            setValues((current) => ({ ...current, content: event.target.value }));
          }}
        />
        {validationErrors.content ? (
          <p className="mt-2 text-sm text-red-700" id="prompt-content-error">
            {validationErrors.content}
          </p>
        ) : null}
      </div>

      <Button
        loading={submitting}
        loadingLabel={mode === "edit" ? "Saving prompt..." : "Creating prompt..."}
        type="submit"
      >
        {mode === "edit" ? "Update prompt" : "Create prompt"}
      </Button>
    </form>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";

import type { CollectionDraft } from "../../types/api";
import { Button, ErrorMessage } from "../shared";

interface CollectionFormProps {
  error?: string | null;
  fieldErrors?: Partial<Record<keyof CollectionDraft, string>>;
  initialValues?: Partial<CollectionDraft>;
  onSubmit: (values: CollectionDraft) => void | Promise<void>;
  submitting?: boolean;
}

const defaultValues: CollectionDraft = {
  name: "",
  description: "",
};

export default function CollectionForm({
  error,
  fieldErrors = {},
  initialValues,
  onSubmit,
  submitting = false,
}: CollectionFormProps) {
  const startingValues = useMemo(
    () => ({ ...defaultValues, ...initialValues }),
    [initialValues],
  );
  const [values, setValues] = useState<CollectionDraft>(startingValues);
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof CollectionDraft, string>>
  >({});
  const nameRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setValues(startingValues);
  }, [startingValues]);

  useEffect(() => {
    setValidationErrors((current) => ({ ...fieldErrors, ...current }));
  }, [fieldErrors]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof CollectionDraft, string>> = {};

    if (!values.name.trim()) {
      nextErrors.name = "Collection name is required.";
    }

    if (values.name.trim().length > 100) {
      nextErrors.name = "Collection name must be 100 characters or fewer.";
    }

    if (values.description.trim().length > 500) {
      nextErrors.description = "Description must be 500 characters or fewer.";
    }

    setValidationErrors(nextErrors);
    if (nextErrors.name) {
      nameRef.current?.focus();
      return;
    }
    if (nextErrors.description) {
      descriptionRef.current?.focus();
      return;
    }

    await onSubmit({
      name: values.name.trim(),
      description: values.description.trim(),
    });
  };

  return (
    <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
      {error ? <ErrorMessage message={error} /> : null}

      <div>
        <label className="label" htmlFor="collection-name">
          Name
        </label>
        <input
          aria-describedby={validationErrors.name ? "collection-name-error" : undefined}
          aria-invalid={Boolean(validationErrors.name)}
          className="field"
          disabled={submitting}
          id="collection-name"
          maxLength={100}
          ref={nameRef}
          value={values.name}
          onChange={(event) => {
            setValidationErrors((current) => ({ ...current, name: undefined }));
            setValues((current) => ({ ...current, name: event.target.value }));
          }}
        />
        {validationErrors.name ? (
          <p className="mt-2 text-sm text-red-700" id="collection-name-error">
            {validationErrors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label className="label" htmlFor="collection-description">
          Description
        </label>
        <textarea
          aria-describedby={validationErrors.description ? "collection-description-error" : undefined}
          aria-invalid={Boolean(validationErrors.description)}
          className="field min-h-28 resize-y"
          disabled={submitting}
          id="collection-description"
          maxLength={500}
          ref={descriptionRef}
          value={values.description}
          onChange={(event) => {
            setValidationErrors((current) => ({ ...current, description: undefined }));
            setValues((current) => ({ ...current, description: event.target.value }));
          }}
        />
        {validationErrors.description ? (
          <p className="mt-2 text-sm text-red-700" id="collection-description-error">
            {validationErrors.description}
          </p>
        ) : null}
      </div>

      <Button loading={submitting} loadingLabel="Saving collection..." type="submit">
        Save collection
      </Button>
    </form>
  );
}

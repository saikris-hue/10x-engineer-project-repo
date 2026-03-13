import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import Button from "./Button";

interface ModalProps {
  children: ReactNode;
  closeDisabled?: boolean;
  footer?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export default function Modal({
  children,
  closeDisabled = false,
  footer,
  isOpen,
  onClose,
  title,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      previouslyFocusedRef.current?.focus();
      return;
    }

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closeDisabled) {
        onClose();
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (!firstElement || !lastElement) {
          return;
        }

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closeDisabled, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 px-4 py-8"
      onClick={() => {
        if (!closeDisabled) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        aria-labelledby="modal-title"
        aria-modal="true"
        className="panel max-h-[90vh] w-full max-w-2xl overflow-hidden bg-mist"
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/8 px-6 py-5">
          <div>
            <p className="pill bg-signal/10 text-signal">Dialog</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink" id="modal-title">
              {title}
            </h2>
          </div>
          <Button
            aria-label="Close dialog"
            disabled={closeDisabled}
            size="sm"
            variant="ghost"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-6 py-6">{children}</div>
        {footer ? <div className="border-t border-ink/8 px-6 py-5">{footer}</div> : null}
      </div>
    </div>
  );
}

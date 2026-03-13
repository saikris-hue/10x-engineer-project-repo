import type { ButtonHTMLAttributes, ReactNode } from "react";

import LoadingSpinner from "./LoadingSpinner";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-ink/90 focus:ring-ink/15",
  secondary: "bg-lagoon text-white hover:bg-lagoon/90 focus:ring-lagoon/15",
  ghost: "border border-ink/12 bg-white text-ink hover:bg-ink/5 focus:ring-ink/10",
  danger: "bg-red-600 text-white hover:bg-red-500 focus:ring-red-200",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-3 text-sm",
  lg: "px-5 py-3.5 text-sm",
};

export default function Button({
  children,
  className = "",
  disabled = false,
  loading = false,
  loadingLabel,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full font-semibold transition focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-55",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
      aria-busy={loading}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoadingSpinner inline /> : null}
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
    </button>
  );
}

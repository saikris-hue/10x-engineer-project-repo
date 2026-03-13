interface StatusCardProps {
  description: string;
  title: string;
  value: string;
}

export function StatusCard({ description, title, value }: StatusCardProps) {
  return (
    <article className="panel p-6">
      <p className="text-sm uppercase tracking-[0.18em] text-ink/45">{title}</p>
      <p className="mt-4 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-3 text-sm leading-6 text-ink/65">{description}</p>
    </article>
  );
}

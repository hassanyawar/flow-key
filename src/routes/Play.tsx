import { useParams } from 'react-router-dom';

export function Play() {
  const { mode } = useParams<{ mode: string }>();

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
      <p className="font-mono text-sm text-text-muted">/play/{mode}</p>
      <p className="max-w-sm text-sm text-text-muted">This mode isn&apos;t wired up yet.</p>
    </section>
  );
}

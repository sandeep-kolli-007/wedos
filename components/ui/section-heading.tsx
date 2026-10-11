import type { ReactNode } from "react";
export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-sm font-semibold tracking-tight text-neutral-900">{title}</h2>{description && <p className="mt-1 text-xs text-neutral-500">{description}</p>}</div>{action}</div>;
}

import type { HTMLAttributes } from "react";
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-xl border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.025)] ${className}`} {...props} />;
}
export function CardHeader({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex items-start justify-between gap-3 px-5 pb-3 pt-5 ${className}`} {...props} />;
}
export function CardTitle({ className = "", ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`text-sm font-semibold tracking-tight text-neutral-900 ${className}`} {...props} />;
}
export function CardDescription({ className = "", ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`mt-1 text-xs leading-5 text-neutral-500 ${className}`} {...props} />;
}
export function CardContent({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-5 pb-5 ${className}`} {...props} />;
}

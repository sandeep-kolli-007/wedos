import type { HTMLAttributes } from "react";
type BadgeVariant = "default" | "success" | "warning" | "danger" | "outline";
const styles: Record<BadgeVariant, string> = {
  default: "bg-neutral-100 text-neutral-700",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15",
  danger: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/15",
  outline: "bg-white text-neutral-600 ring-1 ring-inset ring-neutral-200",
};
export function Badge({ variant = "default", className = "", ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return <span className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium leading-none ${styles[variant]} ${className}`} {...props} />;
}

import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "icon";
const variants: Record<ButtonVariant, string> = {
  default: "bg-neutral-900 text-white hover:bg-neutral-700 border border-neutral-900",
  secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-100",
  outline: "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300",
  ghost: "bg-transparent text-neutral-600 border border-transparent hover:bg-neutral-100 hover:text-neutral-900",
  destructive: "bg-red-600 text-white border border-red-600 hover:bg-red-700",
};
const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3.5 text-sm",
  lg: "h-10 px-4 text-sm",
  icon: "h-9 w-9 p-0",
};
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize };
export function Button({ className = "", variant = "default", size = "md", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={`inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}

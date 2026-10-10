import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WedOS — Wedding Operations, Beautifully Connected",
  description: "The command centre for professional wedding planners. Manage celebrations, vendors, budgets, timelines and creative direction in one workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

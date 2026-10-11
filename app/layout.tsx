import type { Metadata } from "next";
import "./globals.css";
import MobileAppNavigation from "@/components/mobile-app-navigation";

export const metadata: Metadata = {
  title: "WedOS — Wedding Operations, Beautifully Connected",
  description: "The command centre for professional wedding planners. Manage celebrations, vendors, budgets, timelines and creative direction in one workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><div className="mobile-app-content">{children}</div><MobileAppNavigation /></body>
    </html>
  );
}

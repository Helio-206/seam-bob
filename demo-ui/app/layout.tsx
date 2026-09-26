import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEAM — Semantic Integrity Layer for Agentic Software",
  description: "Bob knew the requirement. The handoff lost it. SEAM catches missing meaning before the subagent runs.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

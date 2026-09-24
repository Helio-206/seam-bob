import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEAM — Semantic Boundary Guard",
  description: "Prevent critical requirements from disappearing at agent handoff boundaries.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

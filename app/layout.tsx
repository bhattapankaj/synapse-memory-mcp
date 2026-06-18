import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Synapse: Universal AI Memory over MCP",
  description:
    "Synapse is a local-first, private memory layer for AI. Exposed over the Model Context Protocol, it gives any AI client persistent, semantic, cross-tool memory.",
  keywords: [
    "MCP",
    "Model Context Protocol",
    "AI memory",
    "LLM memory",
    "semantic search",
    "Synapse",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen antialiased">
        <div className="app-aurora" aria-hidden />
        <div className="grid-veil" aria-hidden />
        <SiteNav />
        <main className="relative z-0">{children}</main>
      </body>
    </html>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/playground", label: "Playground" },
  { href: "/connect", label: "Connect" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto mt-4 w-[min(1180px,92vw)]">
        <nav className="glass flex items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <SynapseMark />
            <span className="text-[1.05rem] font-semibold tracking-tight">
              Synapse
            </span>
            <span className="chip hidden sm:inline-flex">MCP</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active =
                l.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="relative rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-full bg-black/[0.04] ring-gradient"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{l.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:block">
            <Link href="/dashboard" className="btn-primary text-sm">
              Open Console
            </Link>
          </div>

          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="btn-ghost px-3 py-2 md:hidden"
          >
            <Burger open={open} />
          </button>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="glass mt-2 flex flex-col gap-1 p-3 md:hidden"
            >
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-ink-soft transition-colors hover:bg-black/[0.04] hover:text-ink"
                >
                  {l.label}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function SynapseMark() {
  return (
    <span className="relative grid h-9 w-9 place-items-center">
      <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-grade to-cyan-grade opacity-90 blur-[2px] transition-opacity group-hover:opacity-100" />
      <svg
        viewBox="0 0 24 24"
        className="relative h-5 w-5 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="5" cy="6" r="2" />
        <circle cx="19" cy="9" r="2" />
        <circle cx="8" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
        <path d="M6.7 7.3 17.3 8.1M6.5 7.6 8 16M9.7 17.6 15.4 17.9M18.5 10.8 17.4 16" />
      </svg>
    </span>
  );
}

function Burger({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="text-ink">
      <motion.line
        x1="3" y1="6" x2="21" y2="6"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
        style={{ originX: "12px", originY: "6px" }}
      />
      <motion.line
        x1="3" y1="12" x2="21" y2="12"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        animate={open ? { opacity: 0 } : { opacity: 1 }}
      />
      <motion.line
        x1="3" y1="18" x2="21" y2="18"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
        style={{ originX: "12px", originY: "18px" }}
      />
    </svg>
  );
}

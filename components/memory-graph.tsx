"use client";

import { useEffect, useRef, useState } from "react";
import type { MemoryGraph } from "@/lib/memory/types";

interface SimNode {
  id: string;
  label: string;
  source: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  deg: number;
}

// Brand palette tuned for the cream canvas (violet, orchid, coral, teal).
const NODE_PALETTE: [number, number, number][] = [
  [124, 58, 237],
  [214, 64, 159],
  [251, 111, 60],
  [13, 148, 136],
];

function colorFor(s: string): [number, number, number] {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return NODE_PALETTE[h % NODE_PALETTE.length];
}

export function MemoryGraph({ refreshKey }: { refreshKey: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graph, setGraph] = useState<MemoryGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<{ x: number; y: number; label: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/graph")
      .then((r) => r.json())
      .then((g: MemoryGraph) => {
        if (!cancelled) {
          setGraph(g);
          setLoading(false);
        }
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!canvasRef.current || !graph) return;
    const canvas = canvasRef.current;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;
    const data: MemoryGraph = graph;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const degree = new Map<string, number>();
    for (const l of data.links) {
      degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
      degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
    }

    const nodes: SimNode[] = data.nodes.map((n, i) => ({
      id: n.id,
      label: n.label,
      source: n.source,
      x: Math.cos((i / Math.max(1, data.nodes.length)) * Math.PI * 2) * 120,
      y: Math.sin((i / Math.max(1, data.nodes.length)) * Math.PI * 2) * 120,
      vx: 0,
      vy: 0,
      deg: degree.get(n.id) ?? 0,
    }));
    const byId = new Map(nodes.map((n) => [n.id, n]));

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = Math.max(360, parent.clientHeight);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let alpha = 1;

    function step() {
      const cx = width / 2;
      const cy = height / 2;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 0.01) {
            dx = Math.random();
            dy = Math.random();
            d2 = 1;
          }
          const force = (2600 / d2) * alpha;
          const d = Math.sqrt(d2);
          a.vx += (dx / d) * force;
          a.vy += (dy / d) * force;
          b.vx -= (dx / d) * force;
          b.vy -= (dy / d) * force;
        }
      }

      for (const l of data.links) {
        const a = byId.get(l.source);
        const b = byId.get(l.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const target = 90;
        const f = ((d - target) / d) * 0.04 * (0.5 + l.weight) * alpha;
        a.vx += dx * f;
        a.vy += dy * f;
        b.vx -= dx * f;
        b.vy -= dy * f;
      }

      for (const n of nodes) {
        n.vx += (cx - (cx + n.x)) * 0.002 * alpha;
        n.vy += (cy - (cy + n.y)) * 0.002 * alpha;
        n.vx *= 0.86;
        n.vy *= 0.86;
        n.x += n.vx;
        n.y += n.vy;
      }
      alpha *= 0.992;
      if (alpha < 0.02) alpha = 0.02;
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;

      for (const l of data.links) {
        const a = byId.get(l.source);
        const b = byId.get(l.target);
        if (!a || !b) continue;
        ctx.strokeStyle = `rgba(28, 25, 23, ${0.08 + l.weight * 0.28})`;
        ctx.lineWidth = 0.6 + l.weight * 1.4;
        ctx.beginPath();
        ctx.moveTo(cx + a.x, cy + a.y);
        ctx.lineTo(cx + b.x, cy + b.y);
        ctx.stroke();
      }

      for (const n of nodes) {
        const [cr, cg, cb] = colorFor(n.source);
        const r = 4 + Math.min(8, n.deg * 1.4);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, 0.95)`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, 0.45)`;
        ctx.arc(cx + n.x, cy + n.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    function loop() {
      step();
      draw();
      raf = requestAnimationFrame(loop);
    }
    loop();

    function onMove(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cx = width / 2;
      const cy = height / 2;
      let found: SimNode | null = null;
      for (const n of nodes) {
        const r = 6 + Math.min(8, n.deg * 1.4);
        if (Math.hypot(cx + n.x - mx, cy + n.y - my) < r + 4) {
          found = n;
          break;
        }
      }
      setHover(found ? { x: mx, y: my, label: found.label } : null);
    }
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", () => setHover(null));

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onMove);
    };
  }, [graph]);

  return (
    <div className="relative h-[420px] w-full">
      {loading && (
        <div className="absolute inset-0 grid place-items-center text-sm text-ink-soft">
          Building semantic graph...
        </div>
      )}
      {!loading && graph && graph.nodes.length === 0 && (
        <div className="absolute inset-0 grid place-items-center text-sm text-ink-soft">
          No memories yet. Add a few to see the graph form.
        </div>
      )}
      <canvas ref={canvasRef} className="h-full w-full" />
      {hover && (
        <div
          className="pointer-events-none absolute z-10 max-w-[240px] rounded-lg border border-black/10 bg-surface/95 px-3 py-2 text-xs text-ink shadow-lg backdrop-blur"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          {hover.label}
        </div>
      )}
    </div>
  );
}

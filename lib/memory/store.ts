import Database from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { getEmbedder, type Embedder } from "./embeddings";
import type {
  MemoryGraph,
  MemoryHit,
  MemoryRecord,
  MemoryStats,
} from "./types";

function toBlob(vec: Float32Array): Buffer {
  return Buffer.from(vec.buffer, vec.byteOffset, vec.byteLength);
}

/**
 * Default DB location. Serverless platforms (Vercel, Lambda) ship a read-only
 * filesystem except for /tmp, so fall back there. Note: /tmp is ephemeral and
 * per-instance, so persistence on serverless lasts only for a warm instance.
 */
function defaultDbPath(): string {
  if (process.env.SYNAPSE_DB_PATH) return process.env.SYNAPSE_DB_PATH;
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return "/tmp/synapse/synapse.db";
  }
  return "./data/synapse.db";
}

interface MemoryRow {
  rowid: number;
  uid: string;
  content: string;
  tags: string;
  source: string;
  created_at: number;
  updated_at: number;
}

function rowToRecord(row: MemoryRow): MemoryRecord {
  return {
    id: row.uid,
    content: row.content,
    tags: safeTags(row.tags),
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function safeTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export class MemoryStore {
  private db: Database.Database;
  private embedder: Embedder;
  private ready = false;

  constructor(dbPath?: string) {
    const path = resolve(dbPath || defaultDbPath());
    const dir = dirname(path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    this.db = new Database(path);
    this.db.pragma("journal_mode = WAL");
    sqliteVec.load(this.db);
    this.embedder = getEmbedder();
    this.init();
  }

  private init() {
    if (this.ready) return;
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        rowid      INTEGER PRIMARY KEY AUTOINCREMENT,
        uid        TEXT UNIQUE NOT NULL,
        content    TEXT NOT NULL,
        tags       TEXT NOT NULL DEFAULT '[]',
        source     TEXT NOT NULL DEFAULT 'manual',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS meta (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    const storedDim = this.db
      .prepare("SELECT value FROM meta WHERE key = 'embedding_dim'")
      .get() as { value: string } | undefined;

    if (storedDim && Number(storedDim.value) !== this.embedder.dim) {
      throw new Error(
        `Embedding dimension mismatch: database was built with ${storedDim.value}-dim ` +
          `vectors but the active provider produces ${this.embedder.dim}-dim vectors. ` +
          `Delete the database file to switch providers.`,
      );
    }

    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS vec_memories USING vec0(
        embedding float[${this.embedder.dim}] distance_metric=cosine
      );
    `);

    this.db
      .prepare(
        "INSERT OR REPLACE INTO meta(key, value) VALUES ('embedding_dim', ?), ('embedding_provider', ?)",
      )
      .run(String(this.embedder.dim), this.embedder.provider);

    this.ready = true;
  }

  async add(input: {
    content: string;
    tags?: string[];
    source?: string;
  }): Promise<MemoryRecord> {
    const content = input.content.trim();
    if (!content) throw new Error("Memory content cannot be empty.");

    const uid = randomUUID();
    const now = Date.now();
    const tags = JSON.stringify(input.tags ?? []);
    const source = input.source?.trim() || "manual";
    const embedding = await this.embedder.embed(content);

    const insertMemory = this.db.prepare(
      `INSERT INTO memories (uid, content, tags, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const insertVec = this.db.prepare(
      `INSERT INTO vec_memories (rowid, embedding) VALUES (?, ?)`,
    );

    const tx = this.db.transaction(() => {
      const info = insertMemory.run(uid, content, tags, source, now, now);
      // sqlite-vec requires the virtual-table primary key bound as a BigInt.
      insertVec.run(BigInt(info.lastInsertRowid as number), toBlob(embedding));
    });
    tx();

    return {
      id: uid,
      content,
      tags: input.tags ?? [],
      source,
      createdAt: now,
      updatedAt: now,
    };
  }

  get(id: string): MemoryRecord | null {
    const row = this.db
      .prepare("SELECT * FROM memories WHERE uid = ?")
      .get(id) as MemoryRow | undefined;
    return row ? rowToRecord(row) : null;
  }

  list(limit = 50, offset = 0): MemoryRecord[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM memories ORDER BY created_at DESC LIMIT ? OFFSET ?",
      )
      .all(limit, offset) as MemoryRow[];
    return rows.map(rowToRecord);
  }

  delete(id: string): boolean {
    const row = this.db
      .prepare("SELECT rowid FROM memories WHERE uid = ?")
      .get(id) as { rowid: number } | undefined;
    if (!row) return false;
    const tx = this.db.transaction(() => {
      this.db.prepare("DELETE FROM memories WHERE rowid = ?").run(row.rowid);
      this.db
        .prepare("DELETE FROM vec_memories WHERE rowid = ?")
        .run(BigInt(row.rowid));
    });
    tx();
    return true;
  }

  async search(query: string, limit = 6): Promise<MemoryHit[]> {
    const q = query.trim();
    if (!q) return [];
    if (this.count() === 0) return [];

    const embedding = await this.embedder.embed(q);
    const matches = this.db
      .prepare(
        `SELECT rowid, distance FROM vec_memories
         WHERE embedding MATCH ? ORDER BY distance LIMIT ?`,
      )
      .all(toBlob(embedding), limit) as { rowid: number; distance: number }[];

    return this.hydrate(matches);
  }

  async related(id: string, limit = 6): Promise<MemoryHit[]> {
    const row = this.db
      .prepare("SELECT rowid FROM memories WHERE uid = ?")
      .get(id) as { rowid: number } | undefined;
    if (!row) return [];

    const vec = this.db
      .prepare("SELECT embedding FROM vec_memories WHERE rowid = ?")
      .get(row.rowid) as { embedding: Buffer } | undefined;
    if (!vec) return [];

    const matches = this.db
      .prepare(
        `SELECT rowid, distance FROM vec_memories
         WHERE embedding MATCH ? ORDER BY distance LIMIT ?`,
      )
      .all(vec.embedding, limit + 1) as {
      rowid: number;
      distance: number;
    }[];

    return this.hydrate(matches.filter((m) => m.rowid !== row.rowid).slice(0, limit));
  }

  private hydrate(
    matches: { rowid: number; distance: number }[],
  ): MemoryHit[] {
    if (matches.length === 0) return [];
    const byRow = new Map(matches.map((m) => [m.rowid, m.distance]));
    const placeholders = matches.map(() => "?").join(",");
    const rows = this.db
      .prepare(`SELECT * FROM memories WHERE rowid IN (${placeholders})`)
      .all(...matches.map((m) => m.rowid)) as MemoryRow[];

    return rows
      .map((row) => {
        const distance = byRow.get(row.rowid) ?? 1;
        return {
          ...rowToRecord(row),
          score: Math.max(0, Math.min(1, 1 - distance)),
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  count(): number {
    const row = this.db
      .prepare("SELECT COUNT(*) AS c FROM memories")
      .get() as { c: number };
    return row.c;
  }

  stats(): MemoryStats {
    const total = this.count();
    const sources = this.db
      .prepare(
        "SELECT source, COUNT(*) AS count FROM memories GROUP BY source ORDER BY count DESC",
      )
      .all() as { source: string; count: number }[];

    const bounds = this.db
      .prepare(
        "SELECT MIN(created_at) AS firstAt, MAX(created_at) AS lastAt FROM memories",
      )
      .get() as { firstAt: number | null; lastAt: number | null };

    const tagCounts = new Map<string, number>();
    const tagRows = this.db
      .prepare("SELECT tags FROM memories")
      .all() as { tags: string }[];
    for (const r of tagRows) {
      for (const t of safeTags(r.tags)) {
        tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      }
    }
    const tags = [...tagCounts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    return {
      total,
      sources,
      tags,
      firstAt: bounds.firstAt,
      lastAt: bounds.lastAt,
      embeddingProvider: this.embedder.provider,
      embeddingDim: this.embedder.dim,
    };
  }

  /**
   * Build a semantic graph: nodes are memories, links connect each memory to
   * its nearest neighbours above a similarity threshold.
   */
  async graph(maxNodes = 60, threshold = 0.45): Promise<MemoryGraph> {
    const records = this.list(maxNodes, 0);
    const nodes = records.map((r) => ({
      id: r.id,
      label: r.content.length > 48 ? r.content.slice(0, 48) + "…" : r.content,
      source: r.source,
      tags: r.tags,
    }));

    const seen = new Set<string>();
    const links: MemoryGraph["links"] = [];
    for (const r of records) {
      const neighbours = await this.related(r.id, 4);
      for (const n of neighbours) {
        if (n.score < threshold) continue;
        const key = [r.id, n.id].sort().join("::");
        if (seen.has(key)) continue;
        seen.add(key);
        links.push({ source: r.id, target: n.id, weight: n.score });
      }
    }
    return { nodes, links };
  }

  close() {
    this.db.close();
  }
}

/* ------------------------- Process-wide singleton -------------------- */

declare global {
  // eslint-disable-next-line no-var
  var __synapseStore: MemoryStore | undefined;
}

export function getStore(): MemoryStore {
  if (!globalThis.__synapseStore) {
    globalThis.__synapseStore = new MemoryStore();
  }
  return globalThis.__synapseStore;
}

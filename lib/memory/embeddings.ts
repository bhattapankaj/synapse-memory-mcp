/**
 * Pluggable embedding layer.
 *
 * Default: on-device embeddings via Transformers.js (all-MiniLM-L6-v2, 384-dim).
 * This means Synapse works with NO API key and stays fully private/local.
 *
 * Optional: OpenAI-compatible embeddings when SYNAPSE_EMBEDDINGS=openai and a
 * key is provided.
 */

export interface Embedder {
  readonly provider: string;
  readonly model: string;
  readonly dim: number;
  embed(text: string): Promise<Float32Array>;
  embedBatch(texts: string[]): Promise<Float32Array[]>;
}

const LOCAL_MODEL = "Xenova/all-MiniLM-L6-v2";
const LOCAL_DIM = 384;

function normalize(vec: Float32Array): Float32Array {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < vec.length; i++) vec[i] = vec[i] / norm;
  return vec;
}

/* ------------------------------- Local ------------------------------- */

let extractorPromise: Promise<unknown> | null = null;

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      // Keep everything offline-friendly and cached locally.
      env.allowLocalModels = true;
      return pipeline("feature-extraction", LOCAL_MODEL);
    })();
  }
  return extractorPromise;
}

class LocalEmbedder implements Embedder {
  readonly provider = "local";
  readonly model = LOCAL_MODEL;
  readonly dim = LOCAL_DIM;

  async embed(text: string): Promise<Float32Array> {
    const [vec] = await this.embedBatch([text]);
    return vec;
  }

  async embedBatch(texts: string[]): Promise<Float32Array[]> {
    const extractor = (await getExtractor()) as (
      input: string[],
      opts: { pooling: "mean"; normalize: boolean },
    ) => Promise<{ tolist: () => number[][] }>;
    const cleaned = texts.map((t) => t.replace(/\s+/g, " ").trim() || " ");
    const output = await extractor(cleaned, {
      pooling: "mean",
      normalize: true,
    });
    return output.tolist().map((arr) => normalize(Float32Array.from(arr)));
  }
}

/* ------------------------------- OpenAI ------------------------------ */

class OpenAIEmbedder implements Embedder {
  readonly provider = "openai";
  readonly model: string;
  readonly dim: number;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.model = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";
    this.baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    this.apiKey = process.env.OPENAI_API_KEY || "";
    // text-embedding-3-small => 1536 dims; allow override.
    this.dim = Number(process.env.OPENAI_EMBED_DIM || 1536);
  }

  async embed(text: string): Promise<Float32Array> {
    const [vec] = await this.embedBatch([text]);
    return vec;
  }

  async embedBatch(texts: string[]): Promise<Float32Array[]> {
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, input: texts }),
    });
    if (!res.ok) {
      throw new Error(`Embedding request failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as {
      data: { embedding: number[] }[];
    };
    return json.data.map((d) => normalize(Float32Array.from(d.embedding)));
  }
}

/* ----------------------------- Selection ----------------------------- */

let embedderSingleton: Embedder | null = null;

export function getEmbedder(): Embedder {
  if (embedderSingleton) return embedderSingleton;
  const provider = (process.env.SYNAPSE_EMBEDDINGS || "local").toLowerCase();
  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    embedderSingleton = new OpenAIEmbedder();
  } else {
    embedderSingleton = new LocalEmbedder();
  }
  return embedderSingleton;
}

/** Pre-warm the local model so the first user request is fast. */
export async function warmEmbedder(): Promise<void> {
  const embedder = getEmbedder();
  if (embedder.provider === "local") {
    await embedder.embed("warm up");
  }
}

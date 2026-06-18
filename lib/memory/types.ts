export interface MemoryRecord {
  id: string;
  content: string;
  tags: string[];
  source: string;
  createdAt: number;
  updatedAt: number;
}

export interface MemoryHit extends MemoryRecord {
  /** Cosine similarity in [0, 1], higher is more relevant. */
  score: number;
}

export interface MemoryStats {
  total: number;
  sources: { source: string; count: number }[];
  tags: { tag: string; count: number }[];
  firstAt: number | null;
  lastAt: number | null;
  embeddingProvider: string;
  embeddingDim: number;
}

export interface GraphNode {
  id: string;
  label: string;
  source: string;
  tags: string[];
}

export interface GraphLink {
  source: string;
  target: string;
  weight: number;
}

export interface MemoryGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

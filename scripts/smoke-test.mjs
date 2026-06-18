// Quick smoke test for the memory core (run with: node scripts/smoke-test.mjs)
import Database from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";
import { pipeline } from "@huggingface/transformers";

console.log("[1/4] Loading sqlite-vec...");
const db = new Database(":memory:");
sqliteVec.load(db);
const { v } = db.prepare("select vec_version() as v").get();
console.log("    sqlite-vec version:", v);

console.log("[2/4] Loading embedding model (first run downloads ~90MB)...");
const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

const texts = [
  "The user prefers dark mode and Poppins font.",
  "My favourite programming language is TypeScript.",
  "I live in Berlin and love specialty coffee.",
];
const out = await extractor(texts, { pooling: "mean", normalize: true });
const vecs = out.tolist();
console.log("    embedding dim:", vecs[0].length);

console.log("[3/4] Inserting vectors...");
db.exec(
  "create virtual table vm using vec0(embedding float[384] distance_metric=cosine)",
);
const ins = db.prepare("insert into vm(rowid, embedding) values (?, ?)");
vecs.forEach((vec, i) => {
  ins.run(BigInt(i + 1), Buffer.from(Float32Array.from(vec).buffer));
});

console.log("[4/4] Querying: 'what UI theme do I like?'");
const q = await extractor(["what UI theme do I like?"], {
  pooling: "mean",
  normalize: true,
});
const qvec = Buffer.from(Float32Array.from(q.tolist()[0]).buffer);
const rows = db
  .prepare(
    "select rowid, distance from vm where embedding match ? order by distance limit 3",
  )
  .all(qvec);
for (const r of rows) {
  console.log(
    `    -> "${texts[r.rowid - 1]}"  (similarity ${(1 - r.distance).toFixed(3)})`,
  );
}
console.log("\nOK: memory core works.");

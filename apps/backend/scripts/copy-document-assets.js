// `tsc` no copia archivos no-.ts a `dist/` — este script copia a mano los
// assets que los generadores de PDF necesitan en runtime (logos, etc.), ver
// `shared/infra/documents/brand-logo.util.ts`. Se corre después de `tsc` en
// `pnpm build` (no hace falta en `pnpm dev`: ts-node lee directo de `src/`).
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "src", "shared", "infra", "documents", "assets");
const DEST = path.join(__dirname, "..", "dist", "src", "shared", "infra", "documents", "assets");

fs.mkdirSync(DEST, { recursive: true });

const archivos = fs.readdirSync(SRC);
for (const archivo of archivos) {
  fs.copyFileSync(path.join(SRC, archivo), path.join(DEST, archivo));
}

console.log(`copy-document-assets: copiados ${archivos.length} archivo(s) a dist/`);

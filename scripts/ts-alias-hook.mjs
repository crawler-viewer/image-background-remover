/**
 * Module resolve hook so the unit tests can import the real frontend TypeScript
 * modules instead of grepping their source text.
 *
 * Handles the two things Node cannot do on its own:
 * - the `@/*` path alias from tsconfig.json → `<root>/src/*`
 * - extensionless specifiers (`./canvas` → `./canvas.ts`)
 *
 * Type stripping itself is native (Node ≥ 22.18). No build step, no dependency.
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXTENSIONS = [".ts", ".tsx", ".js", ".mjs"];

function withExtension(absPath) {
  if (existsSync(absPath) && path.extname(absPath)) return absPath;
  for (const ext of EXTENSIONS) {
    if (existsSync(`${absPath}${ext}`)) return `${absPath}${ext}`;
  }
  for (const ext of EXTENSIONS) {
    const indexFile = path.join(absPath, `index${ext}`);
    if (existsSync(indexFile)) return indexFile;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const resolved = withExtension(path.join(root, "src", specifier.slice(2)));
    if (resolved) {
      return { url: pathToFileURL(resolved).href, shortCircuit: true, format: undefined };
    }
  }

  // Relative import without an extension (TS style) from a TS file
  if (specifier.startsWith(".") && !path.extname(specifier) && context.parentURL) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    const resolved = withExtension(path.resolve(parentDir, specifier));
    if (resolved) {
      return { url: pathToFileURL(resolved).href, shortCircuit: true, format: undefined };
    }
  }

  return nextResolve(specifier, context);
}

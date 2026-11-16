// esbuild strips module-level directives from bundled output, so the
// "use client" marker is added after the build instead. Without it, Next.js
// App Router consumers would have to mark their own wrapper as a client
// component.
import { readFile, writeFile } from "node:fs/promises";

const DIRECTIVE = '"use client";';
const files = ["dist/index.js", "dist/index.cjs"];

for (const file of files) {
  const code = await readFile(file, "utf8");
  if (code.startsWith(DIRECTIVE)) continue;
  await writeFile(file, `${DIRECTIVE}\n${code}`);
  console.log(`added ${DIRECTIVE} to ${file}`);
}

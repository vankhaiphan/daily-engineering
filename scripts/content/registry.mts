/** Regenerate src/content/lessons/registry.ts and content-pipeline/coverage.json from the catalog. */
import { readCatalog, writeCoverage, writeRegistry } from "./lib.mts";

writeRegistry(readCatalog());
await writeCoverage();
console.log("✔ registry.ts and coverage.json regenerated");

/**
 * TEMPORARY diagnostic — remove once `catalog.test.ts`'s CI timeout has a
 * mechanism. Times `buildCatalog()` on the runner, which is the only place
 * the failure reproduces: it is 404-406 ms locally at 1 worker AND at 12,
 * but exceeds vitest's 5,000 ms default on `ubuntu-latest`.
 */
import { buildCatalog } from './generate-catalog.js';

const runs = 5;
for (let i = 0; i < runs; i++) {
  const t = performance.now();
  const out = buildCatalog();
  const ms = performance.now() - t;
  console.log(
    `[ci-catalog-probe] run=${i} ms=${ms.toFixed(0)} chars=${out.length} ` +
      `rssMB=${(process.memoryUsage().rss / 1e6).toFixed(0)} ` +
      `heapMB=${(process.memoryUsage().heapUsed / 1e6).toFixed(0)}`,
  );
}
console.log(`[ci-catalog-probe] cpus=${(await import('node:os')).cpus().length}`);

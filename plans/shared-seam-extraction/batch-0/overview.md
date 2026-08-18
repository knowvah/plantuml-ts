# Batch 0 — Evidence harness, fitness test, baseline (serial)

Nothing in `src/` moves until the ruler exists. T0 lands the manifest script,
the layering fitness test with the measured debt, and captures the baseline
on the branch point.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | render-manifest script, layering test (ALLOWLIST + KNOWN_DEBT), baseline capture, DOT EQUAL re-measure | typescript-pro | `scripts/render-manifest.ts`, `tests/architecture/layering.test.ts`, `package.json` (script), `test-results/shared-seam-baseline-manifest.json`, `plans/shared-seam-extraction/README.md` (starting-state numbers) | — | [x] |

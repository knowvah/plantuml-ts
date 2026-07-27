# Batch 2 — Last fixtures  ✅ DONE (2026-07-27)

**Result:** T5 wired scoped `<style> <sname> { MinimumWidth }` per-element
(`resolveElementMinimumWidth`); zotiru-33's `not_nested` package is now exact
(4.583in), pin shrank 2.655→0.914 (residual = nested cluster, S1L-e). T6
diagnosed fariba-82 as a compound out-of-scope residual (awslib sprite S1L-f +
`file`-body wrap gap S1L-d), pinned 1.024479 + documented in the ledger. Gates
green: harness exit 0, dot-sync 262/262 + 90/90, full suite 10361. Commits:
T5 = `9e39f86`; T6 = `00f9f71`.


Close the two remaining S1L-b fixtures the core batch surfaced. Independent
source files (style-map vs a diagnosis), but both touch `size-backlog.json` — do
the backlog write once, at the end, to avoid a conflict.

| Task | Writes | Notes |
|------|--------|-------|
| T5 | `core/style-map-*.ts`, `description/layout.ts`, unit test | scoped `<style> MinimumWidth` → zotiru-33 |
| T6 | (per finding) `leaf-sizing.ts`/`parser.ts`, else the ledger | diagnose fariba-82's 0.034in |

**Exit bar:** zotiru-33 conformant or its pin shrunk (MinimumWidth wired) and
fariba-82 conformant or documented + pinned; `measure` exit 0; structure EQUAL;
full suite green.

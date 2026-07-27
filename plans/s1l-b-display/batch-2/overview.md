# Batch 2 — Last fixtures

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

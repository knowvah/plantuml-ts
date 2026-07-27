# Batch 1 — Core: unblock body render + size  ✅ DONE (2026-07-27)

**Result:** T1–T4 complete. The HR render crash was `USymbolCloud` (a dropped
upstream `UGraphicStencil.create` line), NOT `renderer-cluster.ts` — see the
decision journal. dexigu-24/kenece-24/zifaji-87 conformant (delta 0); backlog
re-baselined (236/351 = 67.2% conformant); fariba-82 re-pinned for Batch 2.
Gates green: size-harness exit 0, dot-sync 262/262 + 90/90, ratchet 351/351,
typecheck/lint/build/full-suite (10357) all pass. Commits: T1 = `e02b2a2`;
T2+T3+T4 = `9c86259` (combined — the size ratchet couples them, journal).


Land the parser body accumulation, creole-aware sizing, and the creole-HR render
wiring **together** so the discarded `[ … ]` body becomes the node's label
everywhere. Ordered so each commit is green: T1 (render) is output-neutral today
(no HR reaches the renderer yet), so it lands first and makes T2's body safe.

| Task | Writes | Depends on |
|------|--------|-----------|
| T1 | `description/renderer-cluster.ts` (+ leaf-label draw path) | — |
| T2 | `description/parser.ts`, `parse-state.ts`, `tests/unit/description/element-body.test.ts` | — (indep. files from T1) |
| T3 | `description/leaf-sizing.ts`, `tests/unit/description/leaf-sizing-body.test.ts` | T2 (consumes node.display) |
| T4 | `oracle/goldens/description/size-backlog.json` | T1,T2,T3 |

T1 and T2 write disjoint files and may proceed in parallel; T3 needs T2's
display semantics; T4 is the batch-end re-baseline once T1–T3 are in.

**Exit bar:** `measure-description-size-deltas.ts` exit 0; `dexigu/kenece/zifaji`
absent from the backlog (conformant, delta 0); parity ratchet 351/351 (no error
diagrams, structure EQUAL); typecheck/lint/build green.

**Measurement:** `npx tsx scripts/measure-description-size-deltas.ts` and
`npx vitest run tests/oracle/description-parity.ratchet.test.ts`.

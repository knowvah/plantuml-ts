# Batch 1 — Core: unblock body render + size

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

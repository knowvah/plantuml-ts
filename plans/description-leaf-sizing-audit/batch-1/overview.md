# Batch 1 — Instrument + audit

Three tasks, fully parallel: disjoint write-sets, no shared files, no
inter-task dependencies. T1 repairs the instrument that misled every
bucket opened last session; T2 and T3 build the two reusable tables.

**Neither audit may fill a row from our own code.** Composition comes from
`~/git/plantuml/.../decoration/symbol/` and the `svek/` drawing classes;
parity comes from reading both call sites. Inferring upstream behaviour
from our port is the exact inversion this mission exists to end — it is a
STOP condition.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T1 | Repair `CAUSE_PATTERNS` | typescript-pro | `scripts/measure-description-size-deltas.ts`, its unit test | — | [ ] |
| T2 | USymbol composition audit | general-purpose | `planning/usymbol-composition.md` | — | [ ] |
| T3 | Renderer↔sizer parity audit | general-purpose | `planning/sizer-renderer-parity.md` | — | [ ] |

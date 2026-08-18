# Batch 4 — Overlapping tail (parallel; after Batch 3)

Each intersects an earlier write-set (T10 ↔ T6/T8; T11 ↔ T9/T7), so neither
could run earlier. Disjoint from each other. May run alongside Batch 5a/5b.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T10 | F9 — G11 `--` vs `\|\|` concurrent-separator orientation | typescript-pro | `src/diagrams/state/ast.ts`, `state-commands.ts`, `state-composite-sizing.ts`, `state-composite-concurrent.ts`, `tests/unit/state/state-concurrent-composite.test.ts`, ratchet entries | T8 | [ ] |
| T11 | F10 — G13 transition-label ink-box position (diagnose first; fix only if the mechanism closes) | typescript-pro | `src/diagrams/state/layout-ink-extent.ts`, `state-composite-edge-label.ts`, `tests/unit/state/layout-ink-extent.test.ts`, ratchet entries, `plans/state-declared-size-fix/findings/G13.md` if it stays open | T9 | [ ] |

**Expected manifest moves.** T10 → `fimivu-15-vogi904` + every corpus fixture
using `||` (grep first; list). T11 → `nimana-36-veco708`, `bunade-42-fudu910`,
`nimise-04-jove070` (+ any composite with a labelled transition if the position
formula changes — list, jar-ward).

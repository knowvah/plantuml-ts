# SI14 decision journal

Appended during execution. Every non-trivial judgment call gets a row —
"non-trivial" means a reasonable developer might have chosen differently.

Also record, per `~/.claude/rules/autonomous-execution.md`:

- the execution plan for each batch, before launching it
- quality-gate results after each batch
- every stop condition triggered, with full error output
- any task that turned out simpler than specified, and why

| Date | Task | Decision | Rationale | Reversible? |
|------|------|----------|-----------|-------------|
| | | | | |

## Measured baselines (record before batch 1 starts)

| Metric | Baseline | Source |
|---|---|---|
| size-delta conformant | 320/351 | `npx jiti scripts/measure-description-size-deltas.ts` |
| size-delta widened | 0 | same |
| goldens + ratchets | 449 green | `npm test` |
| vendor verify | 34,587 files verbatim | `npx jiti scripts/vendor-stdlib.ts --verify` |
| `class-usecase-inline-sprite` pinned diffs | 10 | `tests/oracle/svg-conformance/class-usecase-actor.test.ts` |
| `class-usecase-inline-sprite` ry | 13.4846 vs jar 13.0625 | same |
| `text/@x`, `image/@x` delta | 2.003 both | same |

Fill these in from an actual run — do not copy them forward on trust. If a
baseline does not reproduce, that is itself a finding worth a row above.

## Stop-condition log

| Date | Condition | What happened | Resolution |
|------|-----------|---------------|------------|
| | | | |

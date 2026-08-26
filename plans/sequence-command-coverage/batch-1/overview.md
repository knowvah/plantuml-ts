# Batch 1 — Instruments and headroom

Five parallel tasks, disjoint write-sets, **all behavior-preserving**. Nothing
here closes a fixture; this batch builds the room and the instruments the rest
of the mission needs.

Two of the five exist because of the 500-line complexity hook, which is a
*directional* ratchet: a file already over the cap is allowed to stay, but may
not grow. `renderer.ts` is at 595 and `sequence-layout-events.ts` has 9 lines
of headroom — both must be split before the tasks that add to them.

| ID | Description | Writes | Depends On | Done |
|---|---|---|---|---|
| T1 | Split `renderer.ts` (595 → under cap) | `renderer.ts`, `renderer-message.ts` | — | [ ] |
| T2 | Split `sequence-layout-events.ts` | `sequence-layout-events.ts`, `sequence-layout-message.ts` | — | [ ] |
| T3 | Shared arrow regex fragments | `sequence-arrow-regex.ts` + test | — | [ ] |
| T4 | Ratchet adjudicator (D5 instrument) | `scripts/sequence-ratchet-adjudicate.ts` + test | — | [ ] |
| T5 | Per-family command modules + frozen registry | `sequence-command-registry.ts`, ~9 `command-*.ts`, `sequence-commands.ts`, `sequence-commands-2.ts`, `parser.ts` | — | [ ] |

All five run in parallel. Every write-set is disjoint; verify before launching.

## Batch gate

Beyond the four standard gates: **zero ratchet movement.** No fixture in
`oracle/goldens/svg-sequence/diff-baseline.json` may rise OR fall, and the
refusal and routing SLI counts must be unchanged at 163 / 195. This batch
changes structure only — any movement means a task changed behavior it should
not have.

## Batch close

```
npm run catalog && git add docs/catalog.md
git commit -m "chore(catalog): regenerate for batch 1"
```
T3, T4 and T5 all add modules; catalog drift is gated by
`tests/architecture/catalog.test.ts` inside `npm test`.

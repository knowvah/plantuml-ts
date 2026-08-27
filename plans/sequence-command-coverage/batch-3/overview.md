# Batch 3 — Parse wave

Five parallel tasks. Every write-set is a distinct command-family module from
T5, so they do not collide. **No task in this batch may edit `ast.ts`** — T6
declared every field they need.

This is the first batch that closes fixtures, and therefore the first that
moves the ratchet. Expect rises; adjudicate them with T4's instrument per D5
rather than treating them as regressions or as noise.

| ID | Description | Writes | Fixtures | Depends On | Done |
|---|---|---|---|---|---|
| T7 | `CommandArrow` rebuilt compositionally, at behavior parity | `command-arrow.ts`, `sequence-command-registry.ts`, tests | ~12 | T3, T5, T6 | [x] |
| T8 | Note factory: optional `of`, VMERGE, `&`, hnote/rnote, stereotype | `command-note-factory.ts`, tests | ~24 | T5, T6 | [x] |
| T9 | Grouping `&`, autonumber inc/stop/resume, activate family | `command-grouping.ts`, `command-autonumber.ts`, `command-lifeline.ts`, tests | ~20 | T5, T6 | [x] |
| T10 | hspace, delay, divider-empty, `hide` variant, participant-multilines | `command-misc.ts`, `command-participant.ts`, tests | ~9 | T5, T6 | [x] |
| T11 | Inline sprite, `EmbeddedDiagram` `{{ }}`, `%newline()` | `command-sprite.ts`, `parser.ts`, tests | ~6 | T5, T6 | [x] |

Write-sets were checked for collisions: T11 owns `command-sprite.ts` (inline
sprite is `CommonCommands`, not misc) and `parser.ts` (the note-body block
consumption), so it does not touch T10's `command-misc.ts` or T8's
`command-note-factory.ts`. **T11 is the one task that may need to cross into
`src/core/` — see stop condition 5 in its spec.**

## Batch gate

Four standard gates, plus:
- refusal SLI 2 falls by the sum of this batch's closed buckets;
- routing misroutes fall by the same;
- every ratchet rise carries a T4 verdict. `regression` and `inconclusive`
  verdicts must be diagnosed before the batch is marked done — a mechanism with
  `file:line`, not "two attempts failed".

## Batch close

```
npm run catalog && git add docs/catalog.md
git commit -m "chore(catalog): regenerate for batch 3"
```

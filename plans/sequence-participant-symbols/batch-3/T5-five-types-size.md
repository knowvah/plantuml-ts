# T5 — Size the five missing types

## Context

Same context as T4: five participant types are parsed and typed correctly and
then sized as a plain participant box, because
`computeParticipantWidths` (`sequence-layout-participants.ts:134-162`) has
branches only for `database` and the default.

Read `../README.md` and `../decisions.md`; **D3** governs — the same
`max(symbolW, textW)` rule T3 applied to `database` generalises here, but
**verify each type's own `getPreferredWidth` against its `ComponentRose*`
class**; do not assume they all share `ComponentRoseDatabase`'s.

## Task

1. For each of `collections`, `queue`, `entity`, `boundary`, `control`, read
   its `ComponentRose*` class's `getPreferredWidth`/`getPreferredHeight` and
   mirror it, using T1's `measureParticipantSymbol` for the glyph dimension.
2. Where several share one rule, share one code path — but only after reading
   each, not by assumption.

Do NOT change drawing — that is T4, in parallel. Do NOT touch `actor`.

## Write-set (exhaustive)

- `src/diagrams/sequence/sequence-layout-participants.ts`
- `tests/unit/sequence/layout.test.ts`

## Read-set

- `src/diagrams/sequence/sequence-layout-participants.ts:134-162`
- `src/diagrams/sequence/renderer-participant-symbol.ts` — T1's
  `measureParticipantSymbol`
- `~/git/plantuml/.../skin/rose/Rose.java:137-190`, then each
  `ComponentRose*` class it names for these five
- `planning/sizer-renderer-parity.md`

## Interface contract

Consumes T1's `measureParticipantSymbol`. Produces `ParticipantGeo.width` /
`.height` for the five types. No new exports.

## Acceptance criteria

- Given each of the five types with a label narrower than its glyph, then the
  column width equals the glyph width, cited to that type's own
  `getPreferredWidth`.
- Given a type whose upstream rule differs from `ComponentRoseDatabase`'s,
  then that difference is implemented and cited, not flattened into a shared
  branch.
- Given a `participant` or `database`, then widths are unchanged from T3.
- 90/90/90 on the changed lines.

## Observability

Moves rendered output on ~43 fixtures. Adjudicated by the orchestrator at the
batch gate.

## Rollback

**Reversible.** Layout-only.

## Quality bar

The four gates exit 0. No Prettier. Never re-pin.

## Commit

`feat(T5): size collections, queue, entity, boundary and control heads`

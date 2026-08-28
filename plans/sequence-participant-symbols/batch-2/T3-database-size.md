# T3 — Size the database head from upstream's rule

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is the spec.
**Open the method body.**

`sequence-layout-participants.ts:44` carries:

```ts
const DB_MIN_WIDTH = 40; // cylinders are narrower than plain boxes
```

used at `:155` inside `computeParticipantWidths`:

```ts
if (p.type === 'database') {
  return Math.max(DB_MIN_WIDTH, lw + theme.sequence.participantPadding);
}
```

**That constant has no upstream `file:line` and its comment is a fitted
rationale** — forbidden by `CLAUDE.md`. Upstream's rule is
`ComponentRoseDatabase.java:102-105`. Read `../README.md` and
`../decisions.md`; **D3** governs this task.

## Task

1. Replace the fitted branch with upstream's arithmetic:
   - width `= max(symbolDim.width, textWidth)`
     (`ComponentRoseDatabase.java:102-105`)
   - height `= symbolDim.height + textHeight`
     (`ComponentRoseDatabase.java:96-99`)
   using T1's `measureParticipantSymbol('database', theme)` for `symbolDim`.
2. Delete `DB_MIN_WIDTH` (`:44`). Grep first for other references.
3. Note the padding: `ComponentRoseDatabase`'s constructor passes
   `ClockwiseTopRightBottomLeft.topRightBottomLeft(0, 3, 0, 3)` (`:62-63`) —
   3px left/right, 0 top/bottom — which is what `getTextWidth` adds
   (`AbstractTextualComponent.java:106-108`). Use that, cited, rather than
   `theme.sequence.participantPadding`.

Do NOT change drawing — that is T2, running in parallel on
`renderer-participant-shapes.ts`. Do NOT touch `actor` (D4, T6).

## Write-set (exhaustive)

- `src/diagrams/sequence/sequence-layout-participants.ts`
- `tests/unit/sequence/layout.test.ts`

## Read-set

- `src/diagrams/sequence/sequence-layout-participants.ts:40-50`, `:134-162`
- `src/diagrams/sequence/renderer-participant-symbol.ts` — T1's
  `measureParticipantSymbol`
- `~/git/plantuml/.../skin/rose/ComponentRoseDatabase.java:60-70`, `:95-105`
- `~/git/plantuml/.../skin/AbstractTextualComponent.java:100-127`
- `planning/sizer-renderer-parity.md` — the defect class this task exists to
  avoid; read it before starting

## Interface contract

Consumes T1's `measureParticipantSymbol`. Produces `ParticipantGeo.width` /
`.height` for `database` participants. No new exports.

## Acceptance criteria

- Given a `database` participant whose label is narrower than the glyph, then
  its width equals the glyph width — **not** `DB_MIN_WIDTH`.
- Given a `database` participant whose label is wider than the glyph, then its
  width equals `getTextWidth` = label + 3 + 3
  (`ComponentRoseDatabase.java:62-63`, `AbstractTextualComponent.java:106-108`).
- Given `grep -rn "DB_MIN_WIDTH" src`, then there are no remaining references.
- Given a diagram with no `database` participant, then every participant width
  is unchanged.
- 90/90/90 on the changed lines.

## Observability

This task moves rendered output on 34 corpus fixtures — widths change, which
moves every downstream x coordinate. That is expected (D3) and is adjudicated
at the batch gate. Do NOT run the adjudicator yourself; do NOT read a raw
`diffCount` as fidelity.

## Rollback

**Reversible.** Layout-only; reverting restores the prior widths exactly.

## Quality bar

The four gates exit 0. No Prettier. `npm test` is RED at baseline with
exactly three sequence-ratchet failures; never re-pin a baseline JSON.

## Commit

`feat(T3): size the sequence database head from ComponentRoseDatabase`

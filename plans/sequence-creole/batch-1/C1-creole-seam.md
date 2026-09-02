# C1 — the creole seam and the widened run

## Context

Sequence text is already a `TextRun[]` with per-run measured metrics (parent
mission D1/D8). What it lacks is a way to turn one display line into SEVERAL
runs with different fonts — which is all creole is, at the emission layer.

The jar emits creole as one sibling `<text textLength="…">` per run and never a
`<tspan>` (jar-verified, `object/linazi-45-gevo553`), so the carrier is right
and only the producer is missing.

This task builds that producer. It changes no call site and no output.

## Task

1. Create `src/diagrams/sequence/sequence-creole.ts` exporting one function
   that takes a display string plus a font spec and returns placed, measured
   `TextRun[]` — routing through `classifyStripeLine` + `buildLineAtoms` +
   `creole-atoms-measure` (D1). It must NOT be called yet.
2. Widen `TextRun` with the per-run style an atom carries: bold, italic,
   colour, decoration, and an optional `url`. All optional EXCEPT where the
   existing required metrics already are.
3. Widen `SequenceTextSpec` with `fontStyle`, and have `sequenceText` wrap a
   url-bearing run in `core/svg.ts#linkWrap`.
4. Scale every new numeric run field in `scale-geo.ts#scaleRun`.
5. Unit-test the producer against the atom engine's own output.

Do **not** change any layout producer or renderer. That is C2–C6.

## Write-set

- `src/diagrams/sequence/sequence-creole.ts` (create)
- `src/diagrams/sequence/text-block-geo.ts` (modify — `TextRun` only)
- `src/diagrams/sequence/sequence-text.ts` (modify — spec + `linkWrap`)
- `src/diagrams/sequence/scale-geo.ts` (modify — scale new fields)
- `tests/unit/sequence/sequence-creole.test.ts` (create)
- `docs/catalog.md` (generated — `npm run catalog`, drift-gated)

## Read-set

- `decisions.md#d1` and `#d3` — the path, and one-atom-one-run.
- `src/diagrams/class/class-member-creole.ts:1-60` — the precedent, and its
  charter. Read this before designing anything.
- `src/diagrams/class/renderer-classifier-rows.ts:265-282` — how an atom's
  font, style, `textLength` and `url` reach the emitted `<text>`.
- `src/core/creole-atoms-measure.ts` — `measureLineWithAtoms`,
  `lineAtomHeightExcess`.
- `src/core/klimt/creole/legacy/StripeSimple.ts` — `buildLineAtoms`.
- `src/core/svg.ts#linkWrap` — the existing, jar-verified `<a>` emitter. Do not
  write a second one.
- `src/diagrams/sequence/text-block-geo.ts:23-58` — `TextRun` as it stands.

## Architecture decisions in force

- **D1** — the shared atom engine. Do not call `create0`/`TextBlock`, and do
  not use `parseCreole`.
- **D3** — one atom, one run. Do not introduce `<tspan>`.
- **D5** — measurement happens here, in layout. The renderer stays a formatter.

## Interface contract (consumed by C2–C6)

`TextRun` gains, all optional:

```ts
readonly bold?: boolean;
readonly italic?: boolean;
readonly color?: string;
readonly decoration?: string;
readonly url?: { readonly url: string; readonly tooltip: string };
```

`SequenceTextSpec` gains `readonly fontStyle?: 'italic'`.

The producer's shape is C1's to choose, but it must return runs whose `x` are
already advanced by preceding runs' widths, so a caller places a BLOCK and not
each run.

## Acceptance criteria

- Given `a <b>bold</b> label` at 13pt, when the producer runs, then it returns
  three runs — `a `, `bold`, ` label` — of which only the middle is `bold`,
  and their `x` advance by each preceding run's `textWidth`.
- Given `""mono""`, when the producer runs, then one run whose text is `mono`
  with no quotes and whose font is the monospace family.
- Given a run carrying a url, when `sequenceText` emits it, then the `<text>`
  is wrapped in an `<a>` whose attributes match `linkWrap`'s.
- Given a `TextRun` with the new fields, when `scaleSequenceGeometry` runs with
  `k`, then every numeric field is multiplied and the style fields are not.
- Given the whole corpus, when rendered, then `descended` is still **797** and
  the element census is unchanged — because no call site moved.

## Observability

N/A — no new observable operations. The task's own gate is the cohort line
reporting no change.

## Rollback

**Reversible.** One new module plus type widening; no golden or baseline is
touched.

## Quality bar

All four gates: `npm test`, `npm run typecheck`, `npm run lint`,
`npm run build`. `git diff --name-only` must list exactly the write-set.

## Commit

`feat(C1): add the sequence creole seam and widen the text run`

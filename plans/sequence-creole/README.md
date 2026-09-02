# Mission: sequence-creole

**Branch**: `feat/sequence-creole`, cut from `main` once
`feat/sequence-text-and-y-convergence` has merged. Merge commit back; never
squash.

## Objective

Wire the sequence engine to the creole engine this port already has. Upstream
gives every sequence text ONE creole seam and this port calls it from nowhere;
the whole mission is wiring, not implementation.

## The finding this is built on

`AbstractTextualComponent`'s constructor ends with

```java
textBlock = display.create0(fc, horizontalAlignment, skinParam, maxMessageSize,
        CreoleMode.FULL, fontForStereotype, htmlColorForStereotype,
        padding.getLeft(), padding.getRight());
```
(`skin/AbstractTextualComponent.java:86-92`)

Every `ComponentRose*` the sequence engine draws — arrow, participant, note,
divider, grouping header, grouping else, reference — inherits that constructor.
One seam, seven components.

This port has the machinery: `create0` at `DisplayCreole.ts:211-230` (including
its `createMessageNumber` and `isStereotype` arms), `Display`, `SheetBuilder`,
`Sheet`, `Stripe`, `CreoleMode.FULL`, `DisplayNewlines` and the whole atom
tree. **Nothing calls any of it.** The only mention outside `core/klimt/creole/`
is a doc comment in `class-map-sizing.ts:80`.

Proof the seam is the only gap: on one diagram,
`title A <b>bold</b> title` emits three `<text>` runs (chrome goes through
`annotations/blocks.ts#parseCreole`) while `Alice -> Bob : a <b>bold</b> label`
emits one `<text>` reading `a &lt;b>bold&lt;/b> label`. Chrome has creole; the
engine body does not.

## Why the carrier already exists

Phase A of `sequence-text-and-y-convergence` replaced every sequence `<text>`
with a **`TextRun` array**, each run carrying its own measured width, ascent and
line height (D1/D8 there). A creole atom is exactly a run with its own font and
width — and the jar emits creole as **one sibling `<text textLength="…">` per
run, never a `<tspan>`** (jar-verified, `object/linazi-45-gevo553`). Do not
design a new carrier.

## Starting condition (measured 2026-09-02 at `984da6fe`)

```
cohort   1141 fixtures · 1124 measured · 797 descended · 327 short-circuited · 17 errored
```

`descended = 797` is the gated quantity. **Total distance is NOT quotable** —
concentration is 24.9% on `vitevu-99-rali549` after B2 opened it, above the 20%
alarm.

Creole content mismatches, over the 1123 fixtures whose `<text>` count already
matches (so the pairing is meaningful): **440 across 71 fixtures**. See
[`findings/starting-census.md`](findings/starting-census.md) for the breakdown
and its concentration warnings.

Separately, and larger: escaped `\n` is not split in message labels or
participant names — 514 occurrences across 118 fixtures, and the largest
closable element family (75 fixtures whose only root-child difference is
`text`).

## Batches

| batch | tasks | what | status |
|---|---|---|---|
| [1](batch-1/overview.md) | C1 | the creole seam; gate is that NOTHING moves | [x] |
| [2](batch-2/overview.md) | C2 | split every display on `\n` | [x] |
| [3](batch-3/overview.md) | C3 C4 C5 C6 | the four text kinds, in parallel | [x] |
| [4](batch-4/overview.md) | C7 | sweep, adjudicate, measure | [ ] |

## Quality gates

All four at every task close — **`npm test`, not `npx vitest run tests/unit`**;
the narrow gate misses catalog drift.

```
npm test          # vitest + 90/90/90 coverage
npm run typecheck # both tsconfigs
npm run lint
npm run build
```

Per task, additionally, and reporting the COHORT line rather than the total:

```
npx jiti scripts/sequence-geometry-distance.ts
```

## The ratchet is not this mission's

`sequence.diff-baseline.ratchet.test.ts` arrives red (93 failures) from
`sequence-text-and-y-convergence`, which owns re-pinning it. Run it as an
instrument; never act on it, and never re-pin it here.

## Stop conditions

1. A file outside the write-set needs changing and no task owns it.
2. Two consecutive gate failures on the same check. The cap bounds EDITS, not
   investigation — diagnose until you can state the mechanism, then stop with
   the artefact `~/.claude/rules/diagnosis.md` defines.
3. An edit contradicts [`decisions.md`](decisions.md) D1–D5.
4. A constant arrives without an upstream `file:line`.
5. **`descended` falls below 797.** Every task here should raise it or hold it.
6. **C1 moves any golden.** Its gate is that nothing moves.
7. A new run-carrying field does not reach `scale-geo.ts#scaleRun` in the same
   commit — see the hazards below; this is a stop, not a follow-up.
8. Re-porting anything under `core/klimt/creole/` or `core/creole*.ts`. The
   charter is REUSE; if the engine genuinely cannot express something, stop and
   say so rather than forking it.

## Push forward

- **A red ratchet.** It is inherited and expected.
- A test constant that moves for a stated, measured reason.
- A content mismatch whose mechanism is already on record in
  `findings/starting-census.md`.
- Naming or file placement where the codebase has no precedent.

## Non-goals

- **Document draw ORDER.** 353 text mismatches across 84 fixtures are not
  creole at all: 71 of those fixtures emit the same text multiset in a
  different order. Real, separate, and filed — not folded in.
- **Message-level `[[url]]`.** `A -> B [[url]] : label` emits no `<a>` in the
  jar (`fajixi-56-dete708`). Participant-DECLARATION urls are already done
  (B3, 42 of 89). Only creole `[[url]]` inside label TEXT is in scope.
- **Atoms with no measured reach.** The atom engine supplies
  `<img>`/`<$sprite>`/openiconic; no sequence fixture was measured as needing
  them. If one turns up, record it — do not build against zero reach.
- Re-pinning the sequence ratchet.
- The `SELF_LOOP_HEIGHT` and vertical-margin work: that is the parent mission's
  Phase C.

## Hazards, all three hit during the parent mission

1. **Scale every new run field.** `labelRuns`/`tabRuns`/`refBody` all reached
   `scale-geo.ts` unscaled once; total distance ROSE 639.3 before it was
   caught, and every `scale`d diagram was drawing text at unscaled coordinates.
2. **Check a style bucket's `FontSize` before trusting a measurement.** Three
   sequence text kinds were measured at the ambient 14 when their buckets say
   12, 13-bold and 13. A wrong font is invisible until a `textLength` is
   emitted, at which point it distorts glyphs rather than displacing them.
3. **Never chain the diff-census CLI into the same shell as `npm test`.** It
   races the stdlib build and produces seven unrelated failing files.

## Index

- [`decisions.md`](decisions.md) — D1–D5
- [`decision-journal.md`](decision-journal.md) — appended during execution
- [`findings/starting-census.md`](findings/starting-census.md) — the measured
  starting state, with its concentration warnings
- [`diagrams/component-map.md`](diagrams/component-map.md)
- [`diagrams/data-flow.md`](diagrams/data-flow.md)
- Parent mission: [`../sequence-text-and-y-convergence/README.md`](../sequence-text-and-y-convergence/README.md)

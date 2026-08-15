# Batch 1 — find the 0.998. No code changes.

The mission's whole risk is here. Everything else is already measured.

| ID | Description | Agent | Writes | Depends on | Done |
|----|-------------|-------|--------|-----------|------|
| T1 | Identify the second contributor | debugger | `.agent-notes/transition-label-ink.md` | — | [ ] |

## What is known

Our composite ink extent is +0.527 against jar. Two mechanisms:

- the label fold uses the reserved box (113) where upstream folds the drawn
  text (111.475) — **−1.525** when corrected
- something unidentified — **+0.998**

## Where to look first

1. **jar's own `minX`.** This port measures `minX = 0` and the arithmetic
   above ASSUMES jar's is 0 too. That was never checked. If jar's leftmost
   ink sits at −0.998, the entire second contributor is explained and there
   is only one bug, not two.
2. `LimitFinder`'s per-shape insets on whatever sets `minX` — the `-1`
   corner rules, the `HACK_X_FOR_POLYGON` 10, the `drawText` `1.5` baseline.
3. Whether the self-loop branch of `computeReservedLabelBox` is in play.

## Method

Instrument, do not reason. `buildInkBox` can report which SHAPE set each
extreme; get that for the three named fixtures and compare against jar's
drawn SVG element by element. Jar's `in.svg` carries the ground truth —
this is how the label question was settled (its `textLength="111.475"`
matched ours exactly, killing the text-measurement hypothesis in one step).

Revert every probe before finishing.

## Batch exit bar

1. The 0.998 has a named mechanism with a `file:line`, or a stated reason it
   cannot be established and what would establish it.
2. A one-line statement of what Batch 2 must change, and whether the two
   fixes are independent or coupled.
3. No `src/` changes. Rendered output byte-identical.

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


---

## Progress, 2026-08-15 (diagnosis session, no code changed)

Narrowed hard. Two hypotheses killed, the residual pinned to exactly 1.000,
and the remaining candidate named.

### jar's drawn inner extent, measured from its own SVG

Parsing `bemena-23-zebu249`'s `in.svg`, bounded to the `Configuring`
composite box (`x=7 y=87 w=392.335 h=256`) and excluding the composite's own
outline and title divider:

```
leftmost  x = 18.000    a transition spline  M57.37,223.48 C46.77,… 18,…
rightmost x = 374.335   the label text       x="262.86" textLength="111.475"
drawn extent            = 356.335
```

`18.000` corroborates our own raw `minX = 0`: the composite's inner image
sits at absolute 12 and `moveDelta` shifts ink to start at 6, so raw 0 IS
absolute 18. Our label placement matches jar's identically by the same
mapping (raw 244.86168 + 6 + 12 = 262.86168 against jar's 262.86).

### The residual is exactly 1.000, and it is jar's, not ours

```
jar drawn extent   356.335    (its own SVG, measured)
jar IMPLIED extent 357.335    (392.335 composite − delta 15 − margins 20)
                   ------
                   +1.000     jar's ink exceeds its own rightmost drawn element
```

Our corrected fold (drawn text instead of reserved box) gives **356.337** —
matching jar's DRAWN extent to 0.002. So the fold fix is right and the
open question is entirely: **why is jar's ink 1.000 wider than anything it
draws?**

### Ruled out, with evidence

- **Arrowhead ink.** `computeSvekResultGeometry` passes
  `includeArrowheadInk: false`, a documented workaround, so this was the
  leading candidate. Enabling it changes this fixture's extent **not at
  all** (357.86168 either way). Dead.
- **A formula-level `+1`** (e.g. the margin layer being 21 rather than 20).
  Ruled out by distribution: across the corpus the composite width deltas
  vary widely — `-36.000`, `-10.000`, `-3.000`, `+0.191`, `+2.550`,
  `+5.788` — so no constant is being missed. The 0.527 family is
  fixture-specific, not systemic.
- **Text measurement.** jar's own `textLength="111.475"` equals our
  measurement exactly.
- **The reserved box.** jar's DOT declares `WIDTH="113"`, same as ours.

### The remaining candidate

Something ink-contributing that is NOT visibly drawn. Two shapes to check,
in the Java, for how the inner pass draws a transition label:

1. `label.x + measuredWidth + marginLabel` would give 357.33668 — matching
   jar's implied extent to 0.002. That would mean jar folds the text plus
   ONE margin, not the bare text.
2. An invisible `UEmpty` reserving the label's box. `LimitFinder` folds
   `UEmpty` like any other shape, and the class engine already models this
   (`class-ink-shapes.ts#addRectInkEmptyShownBody`).

Read `SvekEdge`'s label drawing and `EntityImageTransitionLabel` to
distinguish them. Do NOT pick between them by arithmetic — 1.000 and
0.998 are within float noise of each other here, and fitting is what this
repo's rules forbid.

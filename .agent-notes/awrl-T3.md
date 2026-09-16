# awrl-T3 — close-out observations (`activity-while-repeat-left-alignment`, 2026-09-16)

## Observation: the comparator can report zero movers on a real geometry change

- **Context**: T1 moved five `while` fixtures' headers by up to 6 px and
  turned five slanted edges vertical; `activity-probe.ts` reported aggregate
  49647 -> 49647 with ZERO score movers.
- **Finding**: every moved attribute already mismatched the golden before
  the fix, and `compareSvg` charges one unit per mismatching attribute
  regardless of magnitude, so a wrong-by-6 becoming wrong-by-0.009 (or
  right) costs the same. A byte-level diff of the rendered SVGs (render all
  268 at the stashed tree, then at the edited tree, `cmp` each) found the
  five movers in seconds and proved every other fixture byte-identical.
- **Impact**: for a placement mission, "score unchanged" proves nothing
  either way; render-and-`cmp` is the instrument for both "did it move" and
  "did nothing else move" (stop 13's real test). Corroborates
  `oracle-score-blind-to-magnitude`.
- **Confidence**: High.

## Observation: raw-float census pins record evaluation order, not geometry

- **Context**: T2's gate went red on `katopo-68-xajo866` (swimlane lane width
  `91.35000000000002 -> 91.35000000000001`) whose SVG was byte-identical
  across the whole mission, and on `felega-00-saxi785` whose divider x
  printed `67.213 -> 67.212`.
- **Finding**: the old placement evaluated `(x + width/2) - child.width/2`,
  the new one `x + offset`; algebraically equal, 3.6e-15 apart in IEEE
  doubles (`24.418999999999997` vs `24.419` on felega's body rect). The
  swimlane census pins OUR lane geometry as a raw double
  (`censusOf(svg, lanes)`), so a 1-ulp change fails an equality pin; and a
  3-decimal printer flips on a `.xxx5` tie.
- **Impact**: expect ulp-level census reds on any arithmetic-order change
  even when no fixture moves; attribute them by dumping the tile numbers
  (`tile-dump.ts`: width/left/hooks bit-identical) and the two evaluation
  orders on the actual coordinates, not by re-measuring the score.
- **Confidence**: High.

## Observation: the diagonal-segment scan needs a tolerance and a glyph filter

- **Context**: rebuilding `diag-scan.ts` (the aitp copy was never committed).
- **Finding**: at a 1e-6 tolerance the corpus shows 20 fixtures, not the
  brief's 19: `firibi-00-puki721` has a 0.001 px dx from rounding. The
  `kill`/`end` cross is two 45-degree `<line>`s sharing one bounding box and
  must be paired out. At 0.01 px with the pair filter the set equals the
  brief's 19 exactly.
- **Impact**: calibrate any new detector against the brief's own count
  before trusting its first number; a scanner that disagrees by one is
  usually the scanner.
- **Confidence**: High.

## Observation: the jar's `FtileRepeat` hangs `backward` off the right edge, ours stacks it

- **Context**: deciding whether the backward body joins T2's left/right merge.
- **Finding**: `FtileRepeat.java:750-757` places `backward` at
  `(width - backward.w, (h - backward.h) / 2)` and `:709-710` adds its width
  to the total; `getLeft`/`getRight` (`:767-786`) never see it. Ours puts it
  in the vertical column (`backwardOffsetY`) with straight vertical
  connectors, so it must join the merge to keep those connectors vertical.
- **Impact**: the structural divergence (side vs column) is the deferred
  `activity-repeat-connector-draw-order` work; when that lands, remove the
  backward terms from the merge in the same commit.
- **Confidence**: High.

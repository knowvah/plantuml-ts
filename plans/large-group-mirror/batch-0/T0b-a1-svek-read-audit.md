# T0b — A1: every dot-engine read mirrors the jar's `-Tsvg` parse

**Agent:** typescript-pro (sonnet, high). Prompt = `common-rules.md` + this file.
**Worktree:** `measurements/mkwt.sh T0b`.

## Why
`DIVERGENCES.md` "Edge geometry carries more precision than the jar's, because
the jar reads graphviz as text" (filed "accepted, permanent", 2026-08-13).
cdd3-T-D3 (2026-09-26) since ported the jar's read:
`src/core/graph-layout-svek-read.ts` (`svgDouble` = `gvprintdouble`
`%.02f` ties-to-even + the `|v| < 0.005 → 0` band, `svekFrame`/`svekY` =
`YDelta(fullHeight)`, `svekNodeCorner`, `svekEdge`, `svekCluster`), defaulted
for every caller at `src/core/graph-layout.ts:368`. Under D1/D2 the entry must be
retired with evidence or narrowed to a proven library-forced remainder.

## Do
1. **Enumerate the jar side.** Every value Svek takes from the SVG text:
   `DotStringFactory.java:377-437` (node corners: polygon min, ellipse
   `cx-rx`/`cy-ry`; clusters; `fullHeight`), `SvekEdge.java:618-637` (path `d=`,
   arrow polygons, label/tail/head label positions — find where each is read),
   and any other `SvgResult` consumer (`grep -rn "SvgResult\|extractList\|getPointsWithThisColor" src/main/java/net/`).
   Check `gvrender_core_svg.c` for which numbers go through `gvprintdouble` vs
   `gvprintnum`/`%d` (e.g. `<svg height="%dpt">`, text x/y).
2. **Enumerate our side.** Every consumer of `@knowvah/dot-engine` output in
   `src/` (`grep -rn "@knowvah/dot-engine" src`): `graph-layout*.ts`,
   `svek-dot-lines0.ts`, `graph-layout-build-borderpoint.ts`,
   `diagrams/dot/layout.ts`, `diagrams/json/layout.ts` (exact = Smetana,
   expected). For each value in step 1, show the code path that quantizes it
   exactly as the jar does, or mark it unquantized.
3. **Fix** every unquantized value the jar reads through text, at the seam
   (one function per jar read; no per-engine rounding). `@startdot`: read what
   `PSystemDot` does with the graphviz output (does it pass the SVG through
   verbatim?) and mirror that.
4. **Prove.** Render `bipudo-23-xavu432` and two authored fixtures with
   exact-tie values (odd multiples of 1/8 in a coordinate) through jar and
   ours; feed the jar's cached `svek-N.dot` to dot-engine and to real `dot
   -Tsvg` (memory dot-engine-blame-needs-real-dot) to show the remaining
   difference, if any, is the engine's layout, not the read.
5. Survey before/after: class, object, state, component, usecase, unknown, dot,
   c4 (rule 11 applies if `src/core/**` changes).

## Report (beyond rule 13)
A table: jar value read (file:line) | gvprint fn | our read path (file:line) |
status (mirrored / fixed in <commit> / library-forced with experiment). And the
exact DIVERGENCES.md text: retire the entry, or narrow it with the D2 experiment.

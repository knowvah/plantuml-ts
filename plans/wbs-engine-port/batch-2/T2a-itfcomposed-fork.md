# T2a: `ITFComposed` + `Fork` (D2)

Prepend [../task-preamble.md](../task-preamble.md).

## Task (TDD)
Port `wbs/ITFComposed.java` and `wbs/Fork.java` verbatim onto T1b's `WBSTextBlock`/`ITF`:
1. `ITFComposed.ts`: private ctor `(skinParam, idea, left: ITF[], right: ITF[])`, `main =
   buildMain(idea)`, `delta1x = 10`, `marginBottom = idea.getShape() === PSEUDO ? 0 :
   style.getMargin().getBottom()` (java:8-15); `build2(skinParam, idea)` recursion (java:41-51:
   leaf → `new ITFLeaf(idea, idea.withBackColor(skinParam))`); `getMainBoxWidth`,
   `setForcedMinWidth` (only when `main` is an `FtileBoxOld`, java:21-24); `applyAutoWidth`
   once, when `isAutoWidth()`: every child forced to the widest `getMainBoxWidth`, then
   `invalidateDimensionCache()` (java:25-40 — `TextBlockMemoized` must expose that; if the port's
   memoizer lacks it, stop 10); `getw1` = `max(mainWidth/2, delta1x + collWidth(left))`
   (java:52-56); T1/T2/F1/F2 (java:57-79); `calculateDimensionSlow` (java:81-90); `drawU`
   (java:99-133) in the Java's exact order: geometry via `getTranslate()`, main at `wx`, left
   children top-down with `marginBottom` gaps and a horizontal line from `x - childWidth -
   delta1x + F2.x` to `x`, right children with the line from `x` to `x + delta1x + F1.x`, the
   vertical trunk from `mainDim.height` to `max(lastY1, lastY2)`; `getLinkColor` from the
   idea's style signature `withTOBECHANGED(stereotype)` (java:134-138).
2. `Fork.ts`: ctor over `idea.withBackColor(skinParam)` (java:5-12; non-root throws),
   `delta1x = 20`, `deltay = 40`, `applyAutoWidth` over `right` (java:13-25), `drawU`
   (java:36-71: no children → main + a stub line; else children at `x += width + 20` with
   vertical stubs from `y1` to `y2`, the bar from `firstX` to `lastX` when they differ,
   otherwise the single-child centring branch `posMain = (fullWidth - mainWidth) / 2` with the
   bar from `firstX` to the main centre), `calculateDimensionSlow` (java:73-89).
3. Jar-pinned tests: choose three cached rows — a root with ≥2 children and grandchildren on
   both sides, a single-child root (the else-branch), one with `Width auto` in `<style>` or
   a detached `_` node — and pin the `<rect x y width height>` of every box and the `<line>`
   endpoints from the jar's `in.svg` under `DeterministicMeasurer`, driving the tree through
   a hand-built `WElement` and a recording UGraphic (as the mindmap tests do).

## Write-set
`src/diagrams/wbs/{ITFComposed,Fork}.ts`, `tests/unit/wbs/{ITFComposed,Fork}.test.ts`,
`docs/catalog.md`, `.agent-notes/wep-T2a.md`. Any OTHER file is a stop.

## Interface contract (→ T2b)
`new Fork(skinParam, root): WBSTextBlock`; `ITFComposed.build2(skinParam, idea): ITF`.

## Acceptance
- Given the ≥2-children row, then every box rect and line endpoint equals the jar's.
- Given the single-child row, then `posMain` centres on the full width and the bar reaches
  the main centre (java:62-68).
- Given `Width auto`, then every sibling's main box is forced to the widest and the cache is
  invalidated once.
- Given `marginBottom` from a style with `Margin`, then left/right children stack by it; a
  PSEUDO node uses 0.

**Observability:** N/A. **Rollback:** Reversible.

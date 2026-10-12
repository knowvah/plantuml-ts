# T1c: `WBSLink`

Prepend [../task-preamble.md](../task-preamble.md).

## Task (TDD)
Port `wbs/WBSLink.java` (41 non-comment lines) to `src/diagrams/wbs/WBSLink.ts` against the
`WElement` geometry getters (`overview.md` contract; a test double until T1a merges):
1. Constructor `(element1, element2, color: HColor)`; a missing colour throws
   `IllegalArgumentException` → `throw new Error(...)` (java:9-10).
2. `drawU(ug)` (java:18-40): when both elements have geometry, build the two
   `XRectangle2D`s from position + dimension, the centre-to-centre `XLine2D`, clip it with
   `rect1.intersect(line)` / `rect2.intersect(line)` (`src/core/klimt/geom/XRectangle2D.ts`),
   draw the clipped `XLine2D` under `ug.apply(color)` (the HColor itself — sep T5c's seam), then
   `new ExtremityArrow(c2, line.getAngle()).drawU(ug)` (`src/core/svek/extremity/ExtremityArrow.ts`);
   when either element has no geometry, draw nothing.
3. Tests: pick a cached row with a link (68 exist; `grep -lE '^\s*\w+\s*[.-]+>\s*\w+'
   test-results/dot-cache/wbs/*/in.puml`), read the jar's link `<line>`/`<path>` endpoints and
   arrow from its `in.svg`, and pin the clipped endpoints from hand-placed rectangles; pin the
   no-geometry case and the null-colour throw.

## Write-set
`src/diagrams/wbs/WBSLink.ts`, `tests/unit/wbs/WBSLink.test.ts`, `docs/catalog.md`,
`.agent-notes/wep-T1c.md`. Any OTHER file is a stop (`XRectangle2D.intersect` or `XLine2D`
behaving unlike `XRectangle2D.java`/`XLine2D.java` is stop 10).

## Acceptance
- Given two rectangles 100 apart horizontally, then the drawn line runs from rect1's right
  edge centre to rect2's left edge centre and the arrow sits at the second point.
- Given an element without geometry, then `drawU` draws nothing.
- Given the chosen cached row's two nodes at the jar's positions, then endpoints match the jar.

**Observability:** N/A. **Rollback:** Reversible.

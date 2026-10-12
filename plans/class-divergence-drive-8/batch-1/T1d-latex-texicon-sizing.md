# T1d: latex sizing from JLaTeXMath's TeXIcon rule (D6)

Prepend [task-preamble.md](task-preamble.md).

## Mechanism
- **Upstream.** `TeXIconBuilder.java:47-56` builds the icon with
  `setStyle(0)` (`STYLE_DISPLAY`), `setSize(20)`, then
  `setInsets(new Insets(1,1,1,1))`. `LatexBuilder.java:72-110` scales it into the
  `<image>`.
- **Ours.** `measureLatex` (`src/core/latex.ts:290-330`) uses this port's own heuristic
  constants (`latex.ts:274-289`: 120 px minimum width, 40 px base height). They have
  no upstream counterpart.
- **The oracle.** The jar's oracle images for `unknown/sapofa-97-gizu737` are now real
  JLaTeXMath output (Batik SVG, base64): `\theta` is 18×22 and `\nu` is 18×17.
- **Why we can match.** KaTeX ships the same Computer Modern metrics
  (`node_modules/katex/src/fontMetricsData.js`: height, depth, italic, skew and width
  per glyph, in em).

## Task (TDD)
1. Read `TeXIconBuilder.java`, `LatexBuilder.java` and `ScientificEquationSafe.java`,
   and quote the size path. For the TeXIcon width/height formula (box width/height/depth
   × size, + insets, and any int truncation), use the JLaTeXMath sources: unzip the
   `jlatexmath` jar from `oracle/dist/plantuml-oracle.jar`'s dependencies, or Maven
   Central's sources jar for the version pinned in `~/git/plantuml/gradle/libs.versions.toml`.
   **Cite every constant.**
2. Write failing tests first. `\theta` must give 18×22 and `\nu` 18×17: take the jar
   values from sapofa's `in.svg`, decoded.
3. Replace the heuristic with box metrics:
   - build the formula's box from KaTeX's parse tree and font metrics, with display
     style, at size 20
   - apply the TeXIcon rule
   - add the image scale from `LatexBuilder`

   Delete the heuristic constants.
4. Survey: count how many latex fixtures across `test-results/dot-cache/*/*` now carry
   JLaTeXMath (Batik) payloads rather than monospace rollbacks. Decode the base64
   `<image>` payloads and journal the counts; T3c rewrites DIVERGENCES from them.
5. Measure every latex fixture in every engine. For each:
   - an exact match is a mover and gets journaled
   - a formula where KaTeX's box layout differs from JLaTeXMath's (fractions,
     big operators) is a **D11.3 candidate**: report the formula and its measured
     delta. Sign nothing; the orchestrator signs at close.

## Rows
`unknown/sapofa-97-gizu737` (0/11), plus every latex mover found in step 5.

## Write-set
`src/core/latex.ts`, `src/core/latex-metrics.ts` (new, if `latex.ts` would exceed its
cap), tests under `tests/unit/core/`, `docs/catalog.md`.

## Read-set
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/math/{TeXIconBuilder,LatexBuilder,ScientificEquationSafe}.java`;
`src/core/latex.ts` (whole file, 391 lines); KaTeX `src/fontMetrics.js`/`fontMetricsData.js`;
DIVERGENCES.md "LaTeX rendering engine" (:192-240).

## Acceptance
- Given `<latex>\theta</latex>`, when measured, then 18×22. Given `\nu`, then 18×17.
  If either is not exact within 2 fixes, that is stop 16.
- Given sapofa, then render-diff reports 0/0.
- Given `latex.ts`, then no heuristic constant remains, and every constant cites
  JLaTeXMath, PlantUML or KaTeX metrics by `file:line`.
- Given the all-engine latex sweep, then every mover is journaled with its exact or
  D11.3-candidate status.

## Architecture decisions (locked)
D6, D11.3.

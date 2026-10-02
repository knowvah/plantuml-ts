# T3i — swimlane residuals

Agent: typescript-pro, worktree `add1-T3i`. Commit per mechanism: `fix(activity): <mechanism>`.

## Context
Row 30: lane rows carry a uniform +1..2 y (sikino +1 at `SwimlaneTitleFontSize 8`; 1.5-2 at FontSize 18) — localised to the swimlane TITLE text height (`measureSwimlaneTitlesHeight`/`swimlaneTitleFontSize`), `Swimlanes.java:304-306` `getTitleHeightTranslate` (`titlesHeight + 5`). Also later dividers too far right on gesogi/nesozi/vodobe (lane width model, `Swimlanes.java:413-436` `getHalfMissingSpace`). And the unexplained +14 canvas width on fonabu/ziboco (row 29(e)) if it is a canvas-origin input.

## Rows (b2)
- **swimlane title band height (+1..2 y, title text metrics)**: `jakuco-69-dari135`, `pakema-21-xema183`, `patagi-39-jone354`, `povoju-50-raxi136`, `sikino-19-vuca111`, `sopape-11-laxo488`, `tefuga-86-xefe850`

## Write-set
`src/diagrams/activity/layout/{swimlane-placement,swimlane-lanes,swimlane-lane-origins,swimlane-context,canvas-origin}.ts`, `src/diagrams/activity/{activity-renderer-swimlanes,activity-style-defaults-swimlane}.ts`, the tests exercising them, new tests (names unique to T3i).

## Acceptance
- Each mechanism quoted from the Java (file:line), ported at its origin, applied to every fixture it governs, pinned by a test.
- Assigned rows' diffs from it go to 0, or the row is re-slotted with mechanism + owning file.
- 0 unexplained risers (shown from the diff); 55 pinned goldens byte-equal.

Rules: see `overview.md`.

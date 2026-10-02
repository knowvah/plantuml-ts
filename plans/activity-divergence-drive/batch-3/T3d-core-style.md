# T3d — shared-core style handlers and theme fields

Agent: typescript-pro, worktree `add1-T3d`. Commit per mechanism: `fix(activity): <mechanism>`.

## Context
Row 26/31: (1) `skinparam ArrowHeadColor` -> `PName.HeadColor` on `SName.arrow` (`FromSkinparamToStyle.java:153`), read by `Rainbow.build` (`Rainbow.java:84-92`) and painted by `Worm.java:146-154` as the arrowhead fill/stroke, separate from the line colour; (2) `activityDiamondFontSize` etc. via `addConFont("activityDiamond", SName.diamond)` (`FromSkinparamToStyle.java:147`); (3) `ActivityStopColor` -> `LineColor,circle,stop` (`:137-139`); (4) note background `#FEFFDD` (`plantuml.skin` note BackGroundColor) vs our theme `#FEFECE`; (5) gradient `BackgroundColor red-green` (`dakesa`): the activity background field is typed `string`, not `Paint`. These are SHARED handlers: every engine is surveyed at the close; a conformant loss in another engine is a mission stop — check how class/state/sequence read the same keys before adding. `src/core/klimt/**` stays forbidden.

## Rows (b2)
- **ArrowHeadColor skinparam -> PName.HeadColor (Worm.java:146-154, FromSkinparamToStyle.java:153)**: `farexi-86-xanu521`, `fofele-65-lozo631`, `naroji-40-nuke022`, `zanudo-86-seco241`
- **activityDiamondFontSize handler (FromSkinparamToStyle.java:147)**: `dulezi-77-sana210`
- **note BackGroundColor #FEFFDD (plantuml.skin note SName)**: `jipapo-14-kevu587`, `mifejo-31-sovi184`, `nijipa-25-pede639`, `volefo-41-tolo996`
- **gradient BackgroundColor (theme field typed string, not Paint)**: `dakesa-98-mano758`

## Write-set
`src/core/skinparam-key-handlers-table-{a,b}.ts`, the `src/core/theme*.ts` field/default modules the handlers need, `src/diagrams/activity/{activity-style-defaults,activity-text-style}.ts`, the tests exercising them, new tests (names unique to T3d).

## Acceptance
- Each mechanism quoted from the Java (file:line), ported at its origin, applied to every fixture it governs, pinned by a test.
- Assigned rows' diffs from it go to 0, or the row is re-slotted with mechanism + owning file.
- 0 unexplained risers (shown from the diff); 55 pinned goldens byte-equal.

Rules: see `overview.md`.

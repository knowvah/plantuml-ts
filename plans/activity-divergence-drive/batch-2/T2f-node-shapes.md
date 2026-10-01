# T2f — node shapes (push-forward)

Agent: typescript-pro, worktree `add1-T2f`. Commit: `fix(activity): <mechanism>`.

## Context
Named at the b1b close (journal row 21) from `--dump` of the cohort:
1. **Closed polygons.** The jar's if/merge diamond and hexagon `points`
   repeat the first point at the end (`daxare`: ours `...,68.725,119`, jar
   `...,68.725,119,80.725,107`); ours do not. Find the Java that builds
   these `UPolygon`s (diamond/hexagon builders under
   `activitydiagram3/ftile/vcompact/cond/` and `klimt/shape`) and quote
   where the closing point is added. Fix on the ACTIVITY side (the points
   list the activity renderer passes) — `src/core/svg-shapes.ts#polygon`
   is shared by every engine and is read-only here.
2. **End cross.** `FtileCircleEndCross.java:115` draws the 2nd diagonal
   from `(delta, SIZE-delta)` with `ULine(size2, -size2)`; ours has x1/x2
   and y1/y2 reversed (`fabexi`: ours x1 49.175 x2 61.55, jar 61.55/49.175).
   Check how `ULine` with a negative dx serialises (`SvgGraphics` line()).
3. **Notes.** Note path geometry + fill (`volefo`: ours
   `M15,15 L75.113,15 L83.113,23 ...` fill `#FEFECE`, jar
   `M15,15 L15,38 L64.113,38 L64.113,25 L54.113,15 L15,15` fill `#FEFFDD`):
   the Opale/note shape and the note fill default (`plantuml.skin`).
4. `garuga`: rect stroke `#F00` width 1 missing; `dakesa`: gradient fill
   (`url(#...)` + `<defs>` gradient) — the style/paint path on node rects.
5. `saxeku`: `skinparam ConditionEndStyle hline` merge shape.
6. Partitions (`caciva`, plus non-cohort `jogami`, `sifite`): partition
   frame fill `none` vs ours `#F1F1F1`, structure.
7. `poraji`: `ActivityStartColor` is fill-only (start stroke stays #222);
   `stop` does not inherit `ActivityEndColor` — quote the Java.

## Rows (b1b)
`daxare-39-buci637`, `feceme-58-xodo415`, `calenu-74-vigo098`,
`xigelo-67-sipi599`, `ciceto-21-zanu057`, `sokafe-69-jita472`,
`fivama-51-cusa142`, `fabexi-81-dife869`, `lubapi-40-siji634`,
`molexa-46-redi999`, `barada-07-veca157`, `volefo-41-tolo996`,
`cubida-55-meku256`, `vimoxa-78-zucu656`, `norire-15-taka956`,
`jipapo-14-kevu587`, `nijipa-25-pede639`, `mifejo-31-sovi184`,
`garuga-34-debe901`, `dakesa-98-mano758`, `saxeku-17-gume203`,
`caciva-80-kene990`, `poraji-17-goke817`.

Mechanisms 1 and 2 cross-cut many rows outside this list — do them first.

## Write-set
`src/diagrams/activity/activity-renderer-{shapes,if-shapes,signal-shapes,
terminals}.ts`, `src/diagrams/activity/tiles/{gtile-note,gtile-partition}.ts`,
`src/diagrams/activity/group-dispatch.ts`, the tests exercising them, new
tests. Style defaults (`activity-style-defaults.ts`) belong to T2c: if a
mechanism needs a new default there, report it (re-slot), do not edit.

## Acceptance
- Each assigned row's named diffs are 0, with the Java quoted per commit.
- 0 unexplained risers; pinned goldens byte-equal.

Rules: see `overview.md`. Quality bar: targeted vitest + typecheck + eslint.

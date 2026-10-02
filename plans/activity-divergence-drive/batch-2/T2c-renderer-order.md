# T2c — renderer element order and count

Agent: typescript-pro, worktree `add1-T2c`. Commit: `fix(activity): <mechanism>`.

## Context
Three filed renderer-side mechanisms: `activity-emphasize-tip-order`
(`renderer.ts#renderEdge` emits segments, terminal tip, then the emphasize
tip; `Worm.java:133-143,179-183` emits the emphasize polygon inline BEFORE its
segment's `ULine`, end decoration last — `kudedo`, `mafete`);
`activity-multiline-condition-text-count` (jar: one `<text>` per wrapped line
of a condition/branch label, ours one element with `tspan`s — `copisa`,
`vimako`, `pekefu`; T1b's `activity-renderer-text.ts` is where a line becomes
a `<text>`); and the unread `line/@stroke-width 1.5 => 2.5` family (47
fixtures, `barada-07-veca157`; 1 => 1.5 on 7; 1 => 2.5 on 3) — diagnose
which line it is (swimlane divider? fork bar? `end` cross?) with `--dump` and
the jar's stroke source before touching any thickness.

## Task
For each assigned row: dump, name the element, read the Java emission order
or stroke source, fix, pin. Element-order fixes change only the concatenation
order in `renderer.ts`. The 2.5 family's mechanism must be quoted
(`plantuml.skin` line or the `UStroke` call) — never a constant.

## Write-set
`src/diagrams/activity/{renderer,activity-renderer-text,activity-renderer-
bars,activity-renderer-swimlanes}.ts`, `tests/unit/activity/renderer*.test.ts`.

## Read-set
`decisions.md#D6`, `#D9`; assigned rows; `renderer.ts:180-260`; `activity-
renderer-bars.ts` (68), `activity-renderer-swimlanes.ts:85-110`; Java
`ftile/Worm.java:120-190`, `Snake.java` (`drawInternal`), `plantuml.skin`
`activityDiagram` block, `LaneDivider.java:80-100`.

## Acceptance
- Given `kudedo-31-pafi082`, then the emphasize polygon precedes its segment.
- Given `copisa-69-xisi273`, then `text` count equals the jar's.
- Given `barada-07-veca157`, then `line/@stroke-width` diffs are 0 with a
  quoted source; 0 unexplained rises across the 311.

Quality bar: targeted vitest + typecheck + eslint. Boundaries: shapes.ts
(T2d may need tiles only — but shapes.ts is NOT in any batch-2 write-set;
re-slot if needed), layout files read-only. Observability: N/A. Rollback:
Reversible.


## Assigned at the b1b close (2026-10-01, journal row 21) — supersedes the write-set above

Rows by named next mechanism:
- **arrowhead fill/stroke from arrow colour skinparam**: `farexi-86-xanu521`, `zanudo-86-seco241`, `fofele-65-lozo631`, `naroji-40-nuke022`
- **arrow font colour on edge label text**: `suzuci-53-biku826`
- **arrow thickness on line stroke-width**: `fonebe-54-save009`
- **svg root preserveAspectRatio option**: `setecu-78-cuko533`
- **activityDiamond FontSize style on diamond label**: `dulezi-77-sana210`
- **creole [[url{tip}label]] link label in action text**: `laxibe-66-teme800`, `zamagu-75-vape137`, `gaxezi-48-zesa921`, `nisexe-68-vabu320`, `pekuxe-00-bovi270`
- **creole table / %n() / ____ separator in action text**: `activity-creole-table`, `niletu-83-lego826`, `fabule-54-pili300`
- **multiline condition/branch label: one <text> per line**: `bazuma-86-metu353`

Source write-set: `src/diagrams/activity/{renderer,activity-renderer-text,activity-renderer-bars,activity-style-defaults,activity-text-style,activity-text-placement,arrows-regular,parser}.ts` (`activity-renderer-swimlanes.ts` moved to T2e), plus the tests exercising those files and new tests. Rules: see `overview.md` (no Serena edits, no baseline writes, risers shown from the diff).

The emphasize-tip order and `line/@stroke-width 2.5` families have no cohort row at b1b — only if an assigned row's dump lands on them.

# T1 — Emit one `<line>` per edge segment

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/activity-element-granularity`. A faithful TypeScript port of PlantUML;
the Java at `~/git/plantuml` is the **canonical specification**. Read the
Java method, not a filename.

**This is the mission's highest-value change and it is one call site.**
`svg/g[][childCount]` carries 91.6% of all remaining activity diff weight;
this task closes the bulk of it.

## Task
`src/diagrams/activity/renderer.ts:104` builds the whole edge path as a
single element:

```ts
const polyline = polylineEl(pts, { fill: 'none', stroke: edgeColor, strokeWidth: 1.5 });
```

Replace it with one `<line>` per segment — for `pts` of length N, emit N−1
`line()` calls with the same stroke styling, in source order.

**Upstream mechanism, already verified — cite it in the code comment:**
`net/sourceforge/plantuml/activitydiagram3/ftile/Worm.java:134` is
`for (int i = 0; i < size() - 1; i++)`, and `:183` is
`ug.draw(new ULine(x2 - x1, y2 - y1))`. One `ULine` per segment. Upstream
ships **no** `DriverPolylineSvg` — `klimt/drawing/svg/` has `DriverLineSvg`,
`DriverPolygonSvg`, `DriverEllipseSvg`, `DriverPathSvg` and no polyline
driver at all. Confirm both facts yourself before writing the comment.

**Do not** reach for `<path>`. `DriverPathSvg` exists but `Worm` does not use
it ([D1]).

**Do not refactor while porting.** Touch the edge-emission path; leave the
arrowhead, mid-arrow and label code beside it alone.

## Write-set
- `src/diagrams/activity/renderer.ts`
- `tests/unit/activity/renderer.test.ts` (the existing suite for this file)

**Not** `src/core/svg-shapes.ts` ([D2] — `line()` already exists and is
correct). **Not** `activity-renderer-shapes.ts` (that is T2/T3). **Not** any
baseline JSON ([D6] — T4 re-pins).

## Read-set
- `plans/activity-element-granularity/decisions.md` — D1, D6, D9
- `src/diagrams/activity/renderer.ts:95-140` — `renderEdge`, what you change
- `src/core/svg-shapes.ts:53-75` — `line()`, the primitive you call
- `oracle/goldens/svg-activity/element-baseline.json` — T0's pin
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/Worm.java:130-190`

## Architecture decisions
[D1] N lines, never a path · [D6] do not re-pin here · [D9] SVG output
growth is accepted, not mitigated — do not add an optimisation back.

## Interface contracts
None consumed downstream. `renderEdge` keeps its signature.

## Acceptance criteria
- Given an edge with N points, when rendered, then N−1 `<line>` elements are
  emitted and **zero** `<polyline>`.
- Given a 2-point edge, then exactly one `<line>`, with geometry byte-identical
  to the polyline's two endpoints.
- Given the whole activity corpus, then zero `<polyline>` remains anywhere in
  activity output.
- Given T2's ratchet, then no fixture's `weightedScore` rises. If one does,
  report it with the slug — do NOT re-pin to make it pass.
- Given `git diff --name-only`, then only the write-set changed.

## Observability
N/A — no new observable operations.

## Rollback
**Reversible.** One call site in one file.

## Quality bar
All four gates green. `npm test` must report `Test Files` **683** — an
orphaned `coverage/.tmp` makes vitest silently skip files while exiting 0
(`.agent-notes/aoh-coverage-tmp-undercollect.md`); `rm -rf coverage/.tmp`
before any run that follows a killed or backgrounded one. Complexity hook
enforced: 500-line file / 30-NLOC function / 10 CCN / 5 params.

## Commit
`feat(aeg-T1): draw activity edges as one line per segment`

Body: that upstream has no polyline driver, the `Worm.java:134-183` citation,
and that SVG output grows deliberately ([D9]).

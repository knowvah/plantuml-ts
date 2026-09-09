# T4 — Per-lane content extents and content-fitted widths

**Agent:** `typescript-pro` · **Depends on:** T3

## Context

Read [`../README.md`](../README.md) and
[`../decisions.md#d1`](../decisions.md); [D1] governs this task and is
locked, including its amendment: the work is two-phase and this is phase
one. Lane widths today are `max(SWIMLANE_MIN_WIDTH, root.width / n)` —
equal division with an unsourced 120px floor. The jar content-fits: on
`pakema-21-xema183` lane A is 38.338 and lane B is 310.9.

## Read-set

- `~/git/plantuml/.../ftile/Swimlanes.java:379-395` — `computeDrawingWidths`,
  the pass we are diverging from; `:396-410` — how the resulting min/max is
  combined with `getWidthWithoutTitle`
- `~/git/plantuml/.../ftile/Swimlanes.java:285-315` — `getTitle` and
  `getTitlesHeight` ([D2])
- `src/diagrams/activity/layout/swimlane-context.ts` — the whole file (12 lines)
- `src/diagrams/activity/activity-layout-types.ts` — `SwimlaneGeo`
- `src/diagrams/activity/layout/tile-coordinates.ts:328-395` — read-only;
  T5 owns it

## Task

1. Compute, per lane, the extent of the content assigned to it — in
   lane-LOCAL coordinates, so the result does not depend on lane origins
   that do not exist yet.
2. Compute each lane's width as `max(title width, content width)` plus the
   sourced padding. **Locate the padding upstream before writing it.**
3. Widen `SwimlaneGeo` with what T5 and T6 need.

## Interface contract (consumed by T5, T6)

```ts
interface SwimlaneGeo {
  readonly name: string;
  readonly x: number;        // assigned by T5, not here
  readonly width: number;
  readonly contentWidth: number;
  readonly titleWidth: number;
}
```

## Boundaries

**Always:** every constant carries its upstream `file:line`.
**Never** fit the padding to the goldens' ~5px — stop condition 4.
**Never** touch `tile-coordinates.ts` (T5 owns it) or the superseded engine.

## Acceptance criteria

- Given a lane whose title is wider than its body, then the title drives
  the width
- Given a lane whose body is wider than its title, then the body drives it
- Given a diagram with no swimlanes, then nothing is computed and no
  geometry moves
- Given the padding constant, then it carries an upstream `file:line` — or
  the task HALTS and journals rather than fitting the observed value

## Observability

N/A.

## Rollback

**Reversible.**

## Quality bar

All four gates green; full `npm test`. The ratchet may move — if any
fixture rises, name it with a mechanism in the journal BEFORE committing.

## Commit

`feat(asr-T4): compute content-fitted swimlane widths`

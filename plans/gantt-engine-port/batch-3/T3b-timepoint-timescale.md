# T3b — TimePoint/TimePointFormat, Moment, base timescales

Agent: `typescript-pro` (sonnet), worktree `gep-T3b`. Commit:
`feat(gantt): port timepoint timescale (T3b)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D2, D5, D6.
Upstream layer L02–L05 (761 Java lines); everything these files reference
is in batches 1–2 or in this task (`diagnosis/upstream-batch-groups.txt`).

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java` (229 lines) → `src/diagrams/gantt/time/TimePoint.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePointFormat.java` (109 lines) → `src/diagrams/gantt/time/TimePointFormat.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Moment.java` (50 lines) → `src/diagrams/gantt/core/Moment.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/MomentImpl.java` (59 lines) → `src/diagrams/gantt/core/MomentImpl.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/PixelInstant.java` (58 lines) → `src/diagrams/gantt/timescale/PixelInstant.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScale.java` (48 lines) → `src/diagrams/gantt/timescale/TimeScale.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/PiecewiseTimeProjection.java` (64 lines) → `src/diagrams/gantt/timescale/PiecewiseTimeProjection.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleWink.java` (71 lines) → `src/diagrams/gantt/timescale/TimeScaleWink.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleDaily.java` (73 lines) → `src/diagrams/gantt/timescale/TimeScaleDaily.ts`

## Write-set
`src/diagrams/gantt/time/TimePoint.ts`, `src/diagrams/gantt/time/TimePointFormat.ts`, `src/diagrams/gantt/core/Moment.ts`, `src/diagrams/gantt/core/MomentImpl.ts`, `src/diagrams/gantt/timescale/PixelInstant.ts`, `src/diagrams/gantt/timescale/TimeScale.ts`, `src/diagrams/gantt/timescale/PiecewiseTimeProjection.ts`, `src/diagrams/gantt/timescale/TimeScaleWink.ts`, `src/diagrams/gantt/timescale/TimeScaleDaily.ts`;
`tests/unit/gantt/time/TimePoint.test.ts`, `tests/unit/gantt/time/TimePointFormat.test.ts`, `tests/unit/gantt/core/Moment.test.ts`, `tests/unit/gantt/core/MomentImpl.test.ts`, `tests/unit/gantt/timescale/PixelInstant.test.ts`, `tests/unit/gantt/timescale/TimeScale.test.ts`, `tests/unit/gantt/timescale/PiecewiseTimeProjection.test.ts`, `tests/unit/gantt/timescale/TimeScaleWink.test.ts`, `tests/unit/gantt/timescale/TimeScaleDaily.test.ts`.

## Read-set
The Java files above; for each type they import, its already-ported TS file
(`docs/catalog.md` → path). Do not read the rest of the gantt package.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its test cites `file:line` for every
  expected value.
- Given `TimePointFormat` for every enum value × locales en/de/fr/ja (via `I18nTimeData`), then the strings equal the Java (`TimePointFormat.java:47-107`); given `TimePoint.todayAtMidnight()` with the clock seam at a fixed instant/zone, then the local date equals `LocalDate.now(zone)` semantics (D3); given `TimeScaleDaily` positions for 3 days, then pixel x equals the Java.
- Given the task, then `npm run typecheck` and eslint are clean and coverage
  of the new files is ≥ 90/90/90.

Observability: N/A — no new observable operations. Rollback: Reversible.

# T4c — DayCalendarData and the timescale variants

Agent: `typescript-pro` (sonnet), worktree `gep-T4c`. Commit:
`feat(gantt): port calendar timescale variants (T4c)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D2, D5, D6.
Upstream layer L06–L09 (401 Java lines); everything these files reference
is in batches 1–3 or in this task (`diagnosis/upstream-batch-groups.txt`).

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java` (157 lines) → `src/diagrams/gantt/data/DayCalendarData.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleDailyHideClosed.java` (97 lines) → `src/diagrams/gantt/timescale/TimeScaleDailyHideClosed.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/VariantTimeScale.java` (81 lines) → `src/diagrams/gantt/timescale/VariantTimeScale.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleCompressed.java` (66 lines) → `src/diagrams/gantt/timescale/TimeScaleCompressed.ts`

## Write-set
`src/diagrams/gantt/data/DayCalendarData.ts`, `src/diagrams/gantt/timescale/TimeScaleDailyHideClosed.ts`, `src/diagrams/gantt/timescale/VariantTimeScale.ts`, `src/diagrams/gantt/timescale/TimeScaleCompressed.ts`;
`tests/unit/gantt/data/DayCalendarData.test.ts`, `tests/unit/gantt/timescale/TimeScaleDailyHideClosed.test.ts`, `tests/unit/gantt/timescale/VariantTimeScale.test.ts`, `tests/unit/gantt/timescale/TimeScaleCompressed.test.ts`.

## Read-set
The Java files above; for each type they import, its already-ported TS file
(`docs/catalog.md` → path). Do not read the rest of the gantt package.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its test cites `file:line` for every
  expected value.
- Given `hide closed` with weekends closed, then `TimeScaleDailyHideClosed` skips them exactly as the Java (pixel x per day); given `TimeScaleCompressed` at weekly/monthly print scale, then the same projections.
- Given the task, then `npm run typecheck` and eslint are clean and coverage
  of the new files is ≥ 90/90/90.

Observability: N/A — no new observable operations. Rollback: Reversible.

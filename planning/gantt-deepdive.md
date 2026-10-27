# Gantt Charts — Deep Dive

This document supplements the mission-guide entry for Phase 4d (Gantt Charts).
Read it before drafting any agent prompt that touches the gantt engine.

**Status: ported.** Mission `gantt-engine-port` (gep) landed the engine; the
brief, decisions (D1–D12), fixture ledger and decision journal live in
`plans/gantt-engine-port/`. Gantt went from 1/265 conformant at b0 to 263/265 at
the b7 capture (final, batch 8): 1 structural, 1 diverged, 0 errored, 252
byte-exact goldens, and the 10 jar-error rows conformant by the 2026-10-10
error-page rule (`fixtures.md` counts rows b0…b7, journal row 85).
`@startgantt` and `{{gantt}}` render. The open divergence families are owned in
`planning/next-missions.md` (gep section); nothing below is a to-do list.

## Prerequisite (done): `src/core/time`, not `datetime.ts`

The old plan blocked gantt on a hand-rolled `src/core/datetime.ts` (Track SI-2).
That was dropped. Upstream gantt is written against `java.time`
(`time/TimePoint.java:55` wraps a UTC `LocalDateTime`), so D2 ports exactly the
methods gantt calls as a `java.time` subset in `src/core/time/`: `LocalDate`,
`LocalTime`, `LocalDateTime`, `ZonedDateTime`, `ZoneOffset`, `Instant`,
`DayOfWeek`, `Month`, `YearMonth`, `WeekFields`, `ChronoUnit`, `Duration`,
`DateTimeException`. It is pure integer arithmetic over the proleptic Gregorian
calendar (epoch-day / second-of-day), UTC only — never JS `Date`, which has
timezone traps and no `WeekFields`/`YearMonth`. This is the shared date module
Timing (D1) will reuse.

## Package layout

`src/diagrams/gantt/` mirrors upstream `net/sourceforge/plantuml/gantt/`
file-for-file (D1): 167 Java files, 20,082 lines, MIT edition, each ported file
carrying a `@see` to its Java origin and keeping the Java name.

| Directory | Contents |
|-----------|----------|
| `./` | `GanttDiagram`, `GanttDiagramMainBlock`, `GanttLayout`, `GanttTaskTable`, `GanttArrow`, `GanttConstraint`, `GanttDiagramFactory`, `GanttStyle`, `GanttI18n`, `Today`, `PValue`, `GArrows`, … |
| `command/` | `NaturalGanttCommand`, `CommandPrintScale`, `CommandLanguage`, `CommandHideShowColumns`, `CommandGanttArrow(2)`, `CommandGroupStart/End`, `CommandSeparator`, `CommandColorTask`, `CommandNoteBottom`, … |
| `lang/` | the subject/verb/complement grammar: `Subject*`, `Complement*`, `Words`, `Verbs`, `Something`, `DayPattern`, `TimeResolution` |
| `ulang/` | `VerbPhraseMatcher`, `VerbPhraseAction`, `ParsedSentence` |
| `core/` | `Task`, `TaskGroup`, `TaskSeparator`, `TaskInstant`, `Resource`, `TaskImpl`, `Moment`, `TimeRange(s)`, `GSide`, `GArrowType` |
| `data/` | `GanttModelData`, `TaskDrawRegistryData`, `WorkingHours`, `TimeScaleConfigData`, `WeekConfigData`, `TimelineStyleData`, `DisplayConfigData` |
| `draw/`, `draw/header/` | `TaskDraw*`, `AbstractTaskDraw`, `RectangleTask`, `ResourceDraw*`, `TimeHeader*` (Daily/Weekly/Monthly/Quarterly/Yearly/Calendar/Simple) |
| `timescale/` | `TimeScale`, `TimeScaleDaily`, `TimeScaleDailyHideClosed`, `TimeScaleCompressed`, `TimeScaleWink`, `PixelInstant`, `PiecewiseTimeProjection` |
| `time/` | `TimePoint`, `TimePointFormat`, `DayOfWeekUtils`, `MonthUtils`, `WeekNumberStrategy`, `Instant` |
| `ngm/`, `ngm/math/` | the effort/allocation model: `NGMAllocation`, `Load`, `Fraction`, `Segment`, `PiecewiseConstant*`, `LoadIntegrator` |
| `solver/` | `Solver`, `ImpossibleSolvingException` |
| `index.ts`, `gantt-skin-param.ts` | the plugin and the gantt slice of `skin/SkinParam.java` (not upstream files; see Seams) |

Two things the old brief got wrong. The real solver is not a short worklist
over a constraint network: task dates come from the `real` constraint package
(`data/TaskDrawRegistryData.java:60-62,70,113,151` builds the layout on
`Real.addFixed`/`addAtLeast`) plus the `ngm` allocation model for effort
syntax (`ngm/NEW-SYNTAX.md`). And the grammar is not a hand-written parser per
form: it is `UBrexPart` trees composed in `lang/` and read back through
`UMatcher.findFirstValueByKey` (`lang/SubjectDayAsDate.java:107-142`).

## Build order: the SCC layers

Upstream's file-level dependency graph was layered into strongly connected
components (`plans/gantt-engine-port/diagnosis/upstream-scc-layers.txt`, 136
components, L00–L16). Same-batch tasks never depend on each other (D6; grouping
in `diagnosis/upstream-batch-groups.txt`).

| Layers | What | Batch |
|--------|------|-------|
| — | `src/core/time`, clock seam, `I18nTimeData` | 1 |
| — | `com.plantuml.ubrex` + `RegexResult`, `CommandControl`, `UBrexSingleLineCommand2`, `UbrexUrlBuilder` (D11) | 1b |
| L00–L01 | enums, value types, `Fraction`, `Segment`, `Load`, `TimeRange(s)`, config data (44 files, 3,563 lines) | 2 |
| L02–L05 | `TimePoint`, piecewise constants, `Moment`, timescales, `RectangleTask`, `WorkingHours` (2,779 lines) | 3 |
| L06–L09 | `AbstractTask`, `Task`, `TaskGroup`, `Resource`, `GanttI18n`, `TaskDraw` family (2,606 lines) | 4 |
| — | `net.sourceforge.plantuml.real` → `src/core/real` (D12) | 4b |
| L10 | the single 25-file cycle (`GanttDiagram`, `GanttLayout`, `GanttConstraint`, `TaskImpl`, `GanttModelData`, `TaskDrawRegistryData`, …; 5,670 lines), one serial chain in one worktree | 5 |
| L11 | the `Complement*` grammar and 20-odd commands (2,824 lines) | 6 |
| L12–L16 | `Subject*`, `NaturalGanttCommand`, `GanttDiagramFactory`, plugin, turn-on and capture | 7 |
| — | first conformance pass: T8a `%date` week-year letter, T8b constraint colour | 8 |

The cycle in L10 means batch 5 may not typecheck until its last task; gates run
at the chain's end.

## Seams (where gantt reaches outside `src/diagrams/gantt/`)

- **`src/core/time`** — the `java.time` subset above (D2). `long` maths in
  `ngm/math/Fraction.java:66-67` is ported as `number` and bounded by a test
  (D5; no `BigInt`).
- **`src/core/clock.ts`** — one injected clock (D3) for gantt `today`
  (`GanttDiagram.java:456-466`, `time/TimePoint.java:88-95`) and TIM
  `%now`/`%date`. Default `nowMillis = 0`, UTC. The only setter is the internal
  `InternalRenderOptions.clock`; no public `RenderOptions` field, `.d.ts`
  unchanged. Conformance feeds each golden's recorded clock from the sidecar
  `oracle/capture-clock.json`; `capture-clock.test.ts` fails when a
  clock-dependent source has no record.
- **`src/core/ubrex`** (D11) — the ubrex library, 47 of the 167 gantt files
  import it. Existing engines were not migrated onto it.
- **`src/core/real`** (D12) — `net.sourceforge.plantuml.real` whole, 16 files.
  Sequence keeps its own `sequence-real-line.ts`; the layering test forbids
  gantt importing it.
- **`Opale` class** in `src/core/svek/image/Opale.ts` (+ `OpalePolygons.ts`
  split at the 500-line cap) — notes draw through it
  (`draw/AbstractTaskDraw.java:174-189`); the file previously held only
  constants and polygon helpers (journal row 47).
- **`Style.eventuallyOverride` overloads** in `src/core/style/Style.ts` —
  `GanttConstraint.java:101-103` needs the `(PName, double)` and
  `(PName, String)` forms (`Style.java:185-193,288-296`; journal row 50).
- **Plugin wiring** — `ganttPlugin` registered after charlie, before flow, at
  `PSystemBuilder.java:183` order (D7); `ParseOptions.clock` carries the clock
  into the factory; `{{gantt}}` re-enters the registry through
  `EmbeddedDiagram.ts:292`; document shell `diagramType 'GANTT'` (D4,
  `assemble-svg.ts:342`). `gantt-skin-param.ts` carries the members of
  `skin/SkinParam.java` the gantt package reaches, as wbs does (journal row 53).

## Watch-outs

- **Clock-dependent rows.** A source with `today` and no date, `%now`, or
  `%date` without a fixed argument compares only against its recorded capture
  clock. Record it at capture (`scripts/oracle-render.sh`); the gantt entries in
  the sidecar are `gantt/lituri-55-caju105`, `gantt/sakibi-88-zuci243` and
  `fixtures/gantt/today-implicit`.
- **Authored fixtures vs the jar.** The jar matches a shorter `pauses` phrase
  rather than a `to the` interval and tolerates trailing text after a matched
  phrase; the `quirk-*` fixtures in `fixtures.md` pin these. Mirror the jar.
- **Gantt vs chronology.** `@startgantt` is `gantt/`; `@startchronology` is a
  separate, simpler diagram. Do not confuse them.
- **No graph engine.** Upstream gantt never calls graphviz or Smetana (D10), so
  the jar's geometry is the target throughout; text goes through
  `DeterministicMeasurer`.
- **Constraint cycles / impossible solves** raise `ImpossibleSolvingException`
  and render as an error page, as the jar does. The 10 jar-error corpus rows
  are conformant when ours is the same class of page.
- **Front-matter error lines.** `error/error-diagrams.ts:91` clamps a
  document-absolute refusal line into a trace without the YAML header; the
  authored `vega-gantt2` error page differs until that core defect is fixed
  (open family, `next-missions.md`).
- **500-line cap.** Helper splits forced by the hook are journaled; a private
  Java helper or inner class becomes its own module beside its owner.

## Where to look

- Brief: `plans/gantt-engine-port/README.md`; decisions `decisions.md`
  (D1–D12, two amendments); ledger `fixtures.md`; history
  `decision-journal.md`.
- Oracles: `scripts/oracle-render.sh <ABSOLUTE out-dir> <puml>` only; survey
  with `npm run svg:survey -- gantt --out <path>` (never positional).
- Ratchets: `oracle/goldens/svg-gantt/` (byte-exact, 251 pins) and the
  gantt diff-baseline for the rows that are conformant by rule or still open.

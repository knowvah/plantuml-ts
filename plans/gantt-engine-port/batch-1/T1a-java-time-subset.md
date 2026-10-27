# T1a — the java.time subset (D2)

Agent: `typescript-pro` (sonnet), worktree `gep-T1a`. Commit:
`feat(core): java.time subset for gantt date arithmetic`.
Read [../task-contract.md](../task-contract.md) and decisions D2.

## Task
Inventory every `java.time` use in upstream gantt and `utils/I18nTimeData`:
`grep -rhoE "(LocalDate|LocalDateTime|Duration|DayOfWeek|Month|YearMonth|
WeekFields|ChronoUnit|TemporalAdjusters|IsoFields|ZoneOffset|Instant)\.?[a-zA-Z]*\("
~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt | sort | uniq -c`.
Port exactly those classes/methods to `src/core/time/<JavaName>.ts`
(immutable classes; epoch-day and second-of-day integers; proleptic Gregorian;
UTC only — `ZoneOffset.UTC` and a fixed-offset/IANA zone only where
`LocalDate.now(zone)` semantics need it for D3). Semantics follow the JDK
javadoc (cite the method's javadoc URL or the OpenJDK source line in each
`@see`). Enums (`DayOfWeek`, `Month`, `ChronoUnit`) keep Java ordinals.
Commit the inventory as `src/core/time/README.md` (one line per method: Java
signature → TS member).

## Write-set
`src/core/time/**`, `tests/unit/core/time/**`.

## Acceptance
- Given 1900-02-28 + 1 day, 2000-02-28 + 1 day, 2024-02-28 + 1 day, then
  1900-03-01, 2000-02-29, 2024-02-29 (Gregorian leap rules).
- Given `WeekFields.ISO` and `WeekFields.SUNDAY_START` (the two gantt uses),
  when asking week-of-week-based-year for 2020-12-31, 2021-01-01, 2021-01-03,
  2021-01-04, then the values equal the JDK's (53/53/53/1 ISO; list the US
  values from the JDK javadoc example or a jar oracle fixture).
- Given `LocalDate.toEpochDay()` round-trips for every day of 1970–2100, then
  identity holds.
- Given `src/core/time`, then no file references `Date`, `Intl` or a Node
  built-in (a test greps the directory).

Observability: N/A. Rollback: Reversible.

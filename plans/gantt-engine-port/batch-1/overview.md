# Batch 1 — foundations: java.time subset, clock seam, I18nTimeData

Three parallel worktrees off the batch-0 close; disjoint write-sets. T1b is a
core change (`src/index.ts` path, TIM clock): its merge is followed by the
28-engine chain; expected movers 0 (default clock stays 0). Standard close as
`b1`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-java-time-subset.md) | `src/core/time/` LocalDate, LocalDateTime, Duration, DayOfWeek, Month, YearMonth, WeekFields | typescript-pro (sonnet) | `src/core/time/**`, `tests/unit/core/time/**` | B0 | [x] |
| [T1b](T1b-clock-seam.md) | `src/core/clock.ts`; TIM clock rewired; internal clock setter; harness passes capture clock | typescript-pro (sonnet) | see spec | B0 | [x] |
| [T1c](T1c-i18n-time-data.md) | `src/core/utils/I18nTimeData.ts` | typescript-pro (sonnet) | `src/core/utils/I18nTimeData.ts` + test | B0 | [x] |
| close | merge ×3, gates, chain vs b0 (0 movers) | orchestrator | per close-procedure | T1a–T1c | [x] |

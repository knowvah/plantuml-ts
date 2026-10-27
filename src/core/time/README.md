# src/core/time -- the `java.time` subset (gep D2)

Exactly the `java.time` members upstream gantt (`net/sourceforge/plantuml/gantt/**`)
and `utils/I18nTimeData.java` call. Proleptic Gregorian, fixed offsets only, no `Date`, no
`Intl`, no Node built-in (a test greps the directory). Zone -> offset conversion and every
read of the wall clock live in `src/core/clock.ts` (T1b), not here.

Representation: `LocalDate` = year/month/day (epoch-day on demand); `LocalTime` =
nano-of-day; `LocalDateTime` = date + time (NOT epoch seconds -- `LocalDateTime.MIN/MAX`
span ~6.3e16 s, beyond 2^53); `Duration` = seconds + nanos (D5: `number`).

Not here (clock): `LocalDate.now()` (`time/TimePoint.java:93`, `GanttDiagram`),
`LocalDateTime.now(ZoneOffset.UTC)` (`time/TimePoint.java:88`) -> via `src/core/clock.ts`.
Not used by gantt, so not ported: `ZoneId`, `Locale`, `TextStyle`, `TemporalAdjusters`,
`IsoFields`, `ChronoField`, `getDisplayName`. Locale names come from `I18nTimeData`
(which only takes `DayOfWeek` / `Month`).

## Java signature -> TS member (gantt call site)

### DayOfWeek.ts (class, singleton instances, Java ordinals)
- `DayOfWeek.MONDAY..SUNDAY` -> same (`data/WeekConfigData.java:52`, `timescale/TimeScaleCompressed.java:63`)
- `DayOfWeek.values()` -> `values()` (`time/DayOfWeekUtils.java:50,60,62,81`)
- `Enum#name()` / `ordinal()` -> `name()` / `ordinal()` (`time/DayOfWeekUtils.java`)
- `DayOfWeek#getValue()` -> `getValue()` (needed by `WeekFields`); `of(int)`, `plus(long)`, `minus(long)`, `compareTo` (JDK API surface `LocalDate#getDayOfWeek` and `WeekFields` need)
- `Enum` identity (`==`, `EnumMap` keys, `core/TaskImpl.java:156`) -> singleton identity / `Map<DayOfWeek,_>`

### Month.ts (class, singleton instances, Java ordinals)
- `Month.values()` -> `values()` (`time/MonthUtils.java:51,61,63,82`)
- `Enum#name()` / `ordinal()` -> `name()` / `ordinal()` (`time/MonthUtils.java`, `time/TimePoint.java:131`)
- `Month#getValue()`, `of(int)`, `length(boolean)`, `plus(long)`, `compareTo` -> same (needed by `LocalDate`)

### ChronoUnit.ts (DAYS only, ordinal 7)
- `ChronoUnit.DAYS.getDuration()` -> `ChronoUnit.DAYS.getDuration()` (`GanttTaskTableColumn.java:116`)
- `ChronoUnit.DAYS.between(LocalDate, LocalDate)` -> `between(start, end)` (`data/TimeBoundsData.java:155`)

### LocalDate.ts
- `LocalDate.of(int, int, int)` / `of(int, Month, int)` -> `of(y, m: number|Month, d)` (`lang/DayPattern.java:93,100,107`, `lang/SubjectDayAsDate.java:110`)
- `LocalDate.ofEpochDay(long)` -> `ofEpochDay(n)` (integer seam for `src/core/clock.ts`)
- `LocalDate#toEpochDay()` -> `toEpochDay()`
- `plusDays(long)` / `minusDays(long)` -> same (68 + 4 call sites; `ngm/math/PiecewiseConstantHours.java:114`)
- `getYear()`, `getMonth()`, `getDayOfMonth()`, `getDayOfWeek()` -> same (`draw/header/*`, `OpenClose.java:108`); plus `getMonthValue()`, `getDayOfYear()`, `isLeapYear()`, `lengthOfYear()` (WeekFields / validation)
- `atStartOfDay()` -> same -> `LocalDateTime` (16 sites)
- `get(TemporalField)` -> `get(field)` (`time/TimePoint.java:105`)
- `isBefore`, `isAfter`, `compareTo`, `equals`, `hashCode` (HashMap/HashSet key order: `OpenClose.java:59`, `data/DayCalendarData.java:66`), `toString`
- `LocalDate.now()` -> NOT HERE, via `src/core/clock.ts`

### LocalTime.ts
- `LocalTime.of(int,int)` / `of(int,int,int)` -> `of(h, m, s = 0, nano = 0)` (`core/TimeRange.java:63`, `lang/ComplementTimePoint.java:99`)
- `LocalTime.MIDNIGHT`, `LocalTime.MAX` (and `MIN`) -> same (`ngm/math/PiecewiseConstantHours.java`, `data/WorkingHours.java:77,110`)
- `getHour/getMinute/getSecond` -> same (`GanttTaskTableColumn.java:163-165,186-187`); `getNano()`, `toNanoOfDay()`, `toSecondOfDay()`, `ofNanoOfDay(long)`
- `isBefore`, `isAfter`, `compareTo` (TreeMap key, `PiecewiseConstantHours.java:52`), `equals`, `hashCode`, `toString`

### LocalDateTime.ts
- `LocalDateTime.of(int,int|Month,int,int,int)` / `of(LocalDate, LocalTime)` -> overloaded `of` (`time/TimePoint.java:62,74`, `lang/ComplementTimePoint.java:92`)
- `LocalDateTime.ofInstant(Instant, ZoneOffset)` -> `ofInstant` (`time/TimePoint.java:86`); `ofEpochSecond(epochSecond, nano, offsetSeconds)` (T1b seam)
- `LocalDateTime.MIN` / `MAX` -> lazy getters (`OpenClose.java:204,210`, `ngm/math/PiecewiseConstantTimeWindow.java:127,149`)
- `toLocalDate()`, `toLocalTime()`, `getYear()`, `getMonth()`, `getDayOfMonth()`, `getDayOfWeek()`, `getHour/Minute/Second()` -> same
- `plusDays`, `plusSeconds`, `minusSeconds` (`ngm/math/TimeDirection.java:46,48`, `time/TimePoint.java`) -> same
- `plus(Duration)` / `minus(Duration)` -> same (`ngm/NGMTaskFixedDuration.java:84,89`)
- `with(TemporalAdjuster)` -> `with(time: LocalTime)` (`ngm/math/PiecewiseConstantHours.java:103,104,132,133`)
- `toInstant(ZoneOffset)` -> same (`time/TimePoint.java:134`); `toEpochSecond(ZoneOffset)`
- `isBefore`, `isAfter`, `compareTo`, `equals`, `hashCode`, `toString` (`time/TimePoint.java` toString/equals/hashCode)
- `LocalDateTime.now(ZoneOffset.UTC)` -> NOT HERE, via `src/core/clock.ts`

### Duration.ts
- `Duration.ZERO`, `ofDays`, `ofHours` -> same (`ngm/Load.java:98`, `data/WorkingHours.java:66`)
- `Duration.between(LocalTime, LocalTime)` / `(LocalDateTime, LocalDateTime)` -> overloaded `between`
- `plus`, `minus`, `plusHours`, `plusMinutes`, `plusSeconds`, `multipliedBy` -> same (`GanttDiagram.java:581-589`, `core/TimeRanges.java:80`)
- `isNegative()`, `getSeconds()`, `toMillis()` -> same (`ngm/Load.java:79,102`, `ngm/math/LoadIntegrator.java:109`); `getNano()`, `isZero()`, `negated()`
- `equals`, `hashCode`, `toString` (ISO `PT8H6M12.345S`, `ngm/Load.java:112,117`)
- `ofSeconds(long, long)` -> same (internal construction + `ChronoUnit`)

### Instant.ts (java.time.Instant, NOT gantt's own `time/Instant`)
- `Instant.EPOCH` -> `Instant.EPOCH` (`time/TimePoint.java:50`)
- `Instant.ofEpochMilli(long)` -> same (`time/TimePoint.java:86`); `ofEpochSecond(long, long)`
- `Instant#toEpochMilli()` -> same (`time/TimePoint.java:134`); `getEpochSecond()`, `getNano()`, `compareTo`, `equals`
- `Instant#atZone(ZoneOffset)` -> `atZone` -> `ZonedDateTime` (`ZonedDateTime.ts`: `toLocalDate()`, `toLocalDateTime()`, `getOffset()`)

### ZoneOffset.ts
- `ZoneOffset.UTC` -> `ZoneOffset.UTC` (`time/TimePoint.java:50,86,88,134`)
- `ZoneOffset.ofTotalSeconds(int)`, `getTotalSeconds()` -> same (clock seam)

### YearMonth.ts
- `YearMonth.from(LocalDateTime)` -> `from` (`time/TimePoint.java:178`); `getYear()` (`:136`)

### WeekFields.ts (+ TemporalField.ts)
- `WeekFields.of(DayOfWeek, int)` -> `of` (`time/TimePoint.java:104`); `WeekFields.ISO` (Monday,4), `SUNDAY_START` (Sunday,1)
- `WeekFields#weekOfYear()` -> `weekOfYear()` (the only field gantt reads: `time/TimePoint.java:105` -- NOTE returns 0 for days before the first week, e.g. ISO 2021-01-01 = 0)
- `weekOfWeekBasedYear()`, `weekBasedYear()`, `dayOfWeek()` ported with it (same algorithm); `weekOfMonth()` not ported (not called)
- `getFirstDayOfWeek()`, `getMinimalDaysInFirstWeek()`

### DateTimeException.ts
- `java.time.DateTimeException` thrown with the JDK messages for invalid fields/dates.

### time-math.ts (internal)
- `Math.floorDiv` / `Math.floorMod`, `ChronoField.checkValidValue`, unit constants.

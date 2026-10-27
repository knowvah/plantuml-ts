# T8a — `%date` pattern letter `Y` (week year) — core TIM, with diagnosis artifact

Agent: `typescript-pro` (sonnet), worktree `gep-T8a`. Commit:
`fix(tim): format the week-year letter Y in %date (T8a)`. Journal row 81.

## Diagnosis artifact (stop 16 — a file outside the gantt tree)
- **Symptom:** corpus row `gantt/fecaru-84-gofi396` refuses with "Syntax Error?"
  at `Project starts $today` where `!$today = %date("YYYY-MM-dd", 200 * 20000)`;
  the jar renders a gantt starting 16 February 1970.
- **Mechanism:** `src/core/tim/builtin/date-format.ts:133` `formatDate` knows
  `yyyy`/`yy` but no `Y`; the letters pass through literally, so the variable
  is `YYYY-02-16` (probe: `title X$today X` renders `XYYYY-02-16 X`) and
  `ComplementDate` cannot parse it.
- **Origin:** `date-format.ts` (the pattern-letter switch) — no `Y` case.
- **Causal chain:** `%date` → `formatDate` leaves `Y` → `$today = "YYYY-02-16"`
  → gantt `Project starts YYYY-02-16` → `SubjectGantt`/`ComplementDate` reject
  → execution refusal → error page.
- **Ruled out:** the gantt grammar (`Project starts 1970-02-16` parses — verify
  in your test); the clock (the two-argument form ignores it,
  `DateFunction.ts:44`).

## Port
`java.text.SimpleDateFormat` letter `Y` = week year (`GregorianCalendar.getWeekYear()`),
count 4 → full year, 2 → two digits, like `y`. The jar's default locale on the
capture box is `en_US` (first day Sunday, minimal days in first week 1), the
same rules `date-format.ts` must already encode if it formats `w`/`W` — read it;
otherwise cite the `java.util.GregorianCalendar` week-year rules (`getWeekYear`:
the year that owns the week containing the date; a date in the last days of
December belongs to the next year's week 1 when that week's first day falls in
it, per `firstDayOfWeek`/`minimalDaysInFirstWeek`). Keep every other letter
untouched.

## Write-set
`src/core/tim/builtin/date-format.ts`, its test under `tests/unit/core/tim/`
(cases: `YYYY-MM-dd` for 4,000,000 s → `1970-02-16`; `YY` → `70`; a December
31 and a January 1 that cross a week-year boundary, values traced from the
Java rules — cite them).

## Acceptance
Typecheck/eslint/prettier clean; `tests/unit/core/tim` green; the fecaru source
rendered through `renderSync` is no longer an error page (assert the SVG has no
"Syntax Error" text and contains the month label the jar draws, `February 1970`).

Observability: N/A. Rollback: Reversible.

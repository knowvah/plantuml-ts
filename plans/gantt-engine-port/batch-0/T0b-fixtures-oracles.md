# T0b — gantt fixtures and jar oracles

Agent: `typescript-pro` (sonnet), worktree `gep-T0b`. Commit:
`test(gantt): upstream and authored gantt fixtures with jar oracles`.
Read [../task-contract.md](../task-contract.md) and decisions D3, D8 first.
No `src/` change.

## Task
1. Copy every `~/git/plantuml/src/test/resources/vega/xgantt/gantt*.puml` to
   `tests/fixtures/gantt/vega-<name>.puml` (keep upstream's text byte-for-byte;
   do NOT copy upstream's `.svg` — a different build).
2. Author fixtures `tests/fixtures/gantt/<construct>.puml`, tiny (≤ 15 lines),
   for every construct below that neither a vega fixture nor ≥ 3 corpus rows
   (`grep -il <construct> test-results/dot-cache/gantt/*/in.puml`) covers:
   working hours, hour-scale tasks, ngm effort syntax (`~/git/plantuml/src/
   main/java/net/sourceforge/plantuml/gantt/ngm/NEW-SYNTAX.md`), every
   `printscale` value (daily, weekly, monthly, quarterly, yearly) × `zoom`,
   `projectscale`, each `language` in `utils/I18nTimeData.java` (one fixture
   per locale, a month boundary visible), separators, resources with
   percentages, notes, links/urls, `hide` variants, `pauses`, open/closed
   days, `today is <date>`, `today is N days after start`, milestones
   (`happens`), groups, arrows (`->`), `is colored`, `complete`, `label on`
   columns, week numbering strategies.
3. Render every fixture: `scripts/oracle-render.sh <ABSOLUTE scratch dir>
   <puml…>`; copy only the `.svg` beside each `.puml` (the jar also dumps
   svek files). Never a hand-typed `java -jar`.
4. Clock-dependent sources (`today` without a date): author exactly one
   (`today-implicit.puml`) and record its render instant + zone in your
   hand-back (T0c writes the sidecar; you do not).

## Write-set
`tests/fixtures/gantt/**`.

## Acceptance
- Given every fixture, then its `.svg` exists and is not a jar error page
  (`<text>` with "Syntax Error" / "[From string") — a jar error on an authored
  fixture: fix it once; a second error on the same construct is stop 15.
- Given the construct list, then the hand-back maps each construct to a
  fixture (vega or authored) or to "≥ 3 corpus rows: <slugs>".
- Given `today-implicit.puml`, then the hand-back carries its capture
  `{ epochMillis, zone }`.

Observability: N/A. Rollback: Reversible.

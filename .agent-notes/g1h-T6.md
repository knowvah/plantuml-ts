# G1H T6 — close-out

## Observation: a third distinct wall-clock confound on this machine — an IDE, not Spotlight or a sibling agent
- **Context**: measuring `npm test`'s wall-clock for the close-out, on a tree
  with no sibling agents running (T6 is the sole task in Batch 3; no other
  git worktree or JVM render was active).
- **Finding**: first timed run read `Duration 58.49s` / wrapped `real 59.53s`
  — 0.8s inside the 60.3s ceiling. `uptime` immediately after showed
  **load average 51.82**, and `ps -Aceo pcpu,comm | sort -rn` showed
  `webstorm` at **534.8% CPU** — a JetBrains IDE indexing pass, unrelated to
  this repo's build/test tooling and not caused by anything in this task's
  write-set (docs only). Polled every 15-20s until load1 settled to ~8-9
  (webstorm's CPU share dropped out of the top of `ps` entirely), then
  re-ran: `Duration 55.15s` / wrapped `real 56.16s`, matching Batch 2's own
  clean gate reading almost exactly.
- **Impact**: this mission has now hit three independently-caused wall-clock
  confounds on the same machine: T0/T2 hit Spotlight reindexing a large new
  corpus; T3/T5 hit sibling `npm test` invocations racing on
  `coverage/.tmp`; this task hit a third-party IDE CPU spike with no
  relationship to this repo at all. None of the three is `npm test` itself
  getting slower — polling `ps`/`uptime` before trusting a reading, already
  the established practice this mission, caught this one too. Worth a
  standing habit for any future session on this machine, not just this
  mission.
- **Confidence**: High (both readings captured with `/usr/bin/time -p`
  wrapping `npm test`; load and the offending process captured at the
  moment of the confounded reading).

## Observation: a combined-file vitest run undercounts one file's total by double-counting across files in a naive `grep`
- **Context**: verifying the four DOT-parity ratchet counts (`state 270`,
  `class 721`, `description 357`, `object 80`) the brief's own quality-gate
  block reports as a SINGLE combined `npx vitest run` invocation over 6
  files.
- **Finding**: extracting per-file test counts from a combined run's output
  via `grep -oE "tests/oracle/\S+\.test\.ts" | sort | uniq -c` on the raw
  reporter text produced `class-dot-parity.test.ts: 724` — 3 more than the
  270/721/357/80 figures every prior close-out in this mission (and SI31,
  SI32) reports. Re-running each file **in isolation** with
  `--reporter=verbose` and reading vitest's own `Tests N passed (N)` summary
  line gave exactly `state 270`, `class 721`, `description 357`,
  `object 80` — matching history precisely. The discrepancy was in the
  extraction method (a naive grep over combined multi-file reporter output),
  not in the suite itself; the combined run's own summary line (`1439
  passed`) was correct and matches `270+721+357+80+9+2`.
- **Impact**: trust vitest's own per-file `Tests N passed (N)` line from an
  isolated single-file run, not a grep tally over a multi-file combined run's
  verbose output, when a number needs to be exact. Recorded so the next
  close-out doesn't waste a cycle chasing a phantom 1-3 count drift that is
  actually a measurement-tooling artifact, not a suite change.
- **Confidence**: High (isolated-file totals reproduced exactly against six
  prior close-outs' recorded figures; combined-run summary total also
  reconciles exactly against the isolated sum).

## Re-measurement summary (all figures independently reproduced this session)
Corpus 1141 admitted / 1427 classified / 1426 rendered / 285 rejected;
singleton `svek-*.dot` pair at `dasutu-58-saje713`; diff-baseline 1 error /
1140 measurable / min10-max139-sum16486 / 1012-at-12 (88.8%); census six
buckets summing to 16486, matching the baseline exactly; `ratchet.json`
`{"fixtures": []}`; `git diff --name-only main..HEAD -- src/` empty; four
gates green, `npm test` 55.15s Duration / 56.16s wrapped real (ceiling
60.3s). No figure disagreed with the decision journal's final (post-fix)
state — the journal's own two earlier, superseded readings were already
corrected in-journal before this task started.

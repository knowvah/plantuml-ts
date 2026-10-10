# activity-error-page-parity (aepp)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
[decisions.md](decisions.md), then the current batch's `overview.md`. Tail
[decision-journal.md](decision-journal.md) for where you stopped.

## Objective

Drive the activity survey's non-conformant rows to **0, except bozido** (D4).
The committed dashboard's 37 is stale (pre-isw); a fresh survey on main
`191253829` reads **433 conformant / 1 structural / 17 diverged** — the 18
rows are in [fixtures.md](fixtures.md). 14 are jar error pages, all verified
to error identically on the **stock** jar (D5). The lever is the user's new
conformance rule (D7): *where the jar errors, we are conformant iff we render
our own error page* — no replication of the jar's message, line or layout.
The mission builds the stock-jar record that decides "the jar errors", the
render-path signal that decides "we error", the survey verdict over both (all
engines), two activity refusals + one crash fix, the tidoda group style, and
moves the two misfiled SEQUENCE fixtures out of activity.

**Exit bar (D6):** activity non-conformant = {bozido}; 0 conformant losses in
any engine; 0 census attributes away from the jar; every non-activity
error-conformant gain listed by name; four gates green.

## Branch

`feat/activity-error-page-parity` off main `191253829`. Merge commit at close.
**Never push.** `plans/` is tracked (project convention) — commit the brief in T0.

## Quality gates (all four before any commit lands on the branch)

```sh
npm test -- --maxWorkers=6 --reporter=default --reporter=json --outputFile.json=<path>
npm run typecheck
npm run lint
npm run build
```
Collected (JSON reporter) must equal `find tests -name '*.test.ts' | wc -l`
(memory: a vitest filter can collect nothing). While agents run, gate sets at
`--maxWorkers=4`; grep "timed out" before calling a red ratchet real.

Measurement (`$M` = `plans/activity-error-page-parity/measurements/`):
- All engines: `$M/survey-all.sh <dir>` (sequential); `python3 $M/engdiff.py <prev> <next>`.
- Activity only: `npm run svg:survey -- activity --out <path>` — **always `--out`**
  (memory: the positional form clobbers `parity.json`).
- Re-pin: `npx tsx scripts/repin-activity-baselines.ts --write`, then
  `python3 $M/census-away.py <pre-pin-dir>` (D6).
- Oracle renders: `scripts/oracle-render.sh` only. Stock renders: T1a's script only.
- Task worktrees: `$M/mkwt.sh <ID>`. Batch closes: [close-procedure.md](close-procedure.md).
- Every agent prompt starts with [common-rules.md](common-rules.md).

## Stop conditions (halt, journal with the diagnosis artifact, ask)

1. A task needs a file outside its write-set.
2. The same gate check fails on 2 consecutive fix attempts, or one location changes 3 times.
3. A finding contradicts D1–D7 or the error-conformance rule (e.g. the stock jar
   draws one of the 14, or `Run.java` offers no reliable stock error signal).
4. Any engine loses a conformant row b0 → now, unless the stock record
   reclassified an oracle artifact (then it is listed, never silent).
5. A census attribute moves AWAY from the jar on a drawn fixture.
6. A non-activity bucket gains > 10 error-conformant rows, or a fixture the jar
   draws starts producing our error page.
7. T1c's refusal changes the bytes of any pinned activity fixture.
8. tidoda's mechanism needs more than the `CommandPartition3` USymbol keying
   (e.g. a `src/core` style-engine change).
9. Oracle and stock jar disagree on whether a fixture errors — list them all.
10. An agent reports "green" on a subset, or a claim measurement disproves.
11. Any push; any edit to the plantuml fork, dot-engine, or cached oracle bytes;
    a public API change; a fitted constant (no upstream `file:line`).

## Push-forward (decide, journal, continue)

Stock-jar detection mechanics (grounded in `Run.java`/`ExitStatus.java`); the
`errorPage` field shape and dashboard wording; test file names and helpers;
re-pins fully explained by an attributed fix; 1–3-line pre-existing fixes in a
write-set file (larger → `.agent-notes/`); `--maxWorkers=4` under load;
pinning routing/refusal before T1e's move commit.

## Batches

| Batch | Tasks | Mode | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | T0 branch + b0 | orchestrator | [ ] |
| [1](batch-1/overview.md) | T1a stock verifier · T1b error observer · T1c refusals · T1d tidoda · T1e move (orch) | parallel worktrees | [ ] |
| [2](batch-2/overview.md) | T2a survey verdict + dashboard · T2b docs | parallel, after T1a+T1b | [ ] |
| [3](batch-3/overview.md) | T-exit · T-close | orchestrator | [ ] |

## Index

- [decisions.md](decisions.md) — D1–D7 + the user's rule
- [fixtures.md](fixtures.md) — the 18 rows, family, owner task
- [common-rules.md](common-rules.md) — paste first into every agent prompt
- [close-procedure.md](close-procedure.md) — batch close steps
- [diagrams/data-flow.md](diagrams/data-flow.md) · [diagrams/component-map.md](diagrams/component-map.md)
- [decision-journal.md](decision-journal.md)

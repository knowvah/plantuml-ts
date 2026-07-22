# G7 — Border-point rank interaction (G6 batch-4 successor)

## Objective

Unblock the ~20-fixture entrypoint/exitpoint family. G6 attempt 3
proved the full mechanism (naming fix + rankSpec + iWrapperSpec +
FrontierCalculator) byte-exact on the un-nested case (bitaxo `C`
42×101.72) but pesita/kotagu still miss. Isolate the suspected SECOND
graphviz-ts interaction (rank group coexisting with i-wrapper /
nested child / parent cluster / other ee content), adjudicate
usage-vs-library, then run the paper-gated FOURTH implementation and
the family sweep. G6's derivation (batch-4/withlabel-derivation.md)
and the unwired FrontierCalculator port (commit 60fe88a) carry over.

## Status: ACTIVE
<!-- Set to: PAUSED — waiting on graphviz-issues/09 (see Resume
     procedure) when T2 takes the library path. Set to CLOSED at
     mission end. -->

## Branch

`feat/g7-borderpoint-rank` off `main`. Merge back with a **merge
commit** (never squash). One commit per task, `feat(T5): ...` per
`~/.claude/rules/commits.md`. Orchestrator commits (shared-worktree
rule; subagents never run git mutations).

## Batches (strictly serial — every task feeds the next)

| Batch | Scope | Tasks | Status |
|-------|-------|-------|--------|
| [1](batch-1/overview.md) | Isolation matrix + adjudication | T1, T2 | [x] |
| — | **CONDITIONAL PAUSE** (library path only) | — | — |
| [2](batch-2/overview.md) | New-.tgz adoption (library path only; SKIP on usage verdict) | T3 | SKIPPED (usage verdict, T2) |
| [3](batch-3/overview.md) | Attempt 4: paper gate → implementation | T4, T5 | [ ] |
| [4](batch-4/overview.md) | Family sweep + close | T6 | [ ] |

## Resume procedure (cold-start, after external graphviz-ts fix)

1. Pull the new `.tgz` from `../graphviz-ts`; bump the
   `package.json` pin + lockfile (T3).
2. Re-run the issue-09 repro matrix — builder path must now match
   real dot on every cell.
3. Full gates on the new pin BEFORE any new work: `npm test` (DOT
   gate frozen, 57 svg-state pins byte-identical, size-backlog
   unmoved), typecheck, lint, build.
4. Proceed to batch 3. Check the issue-09 TRACKER box only in T6,
   after affected fixtures re-measure clean.

## Docs

- [decisions.md](decisions.md) — D1-D5 (locked 2026-07-22)
- [decision-journal.md](decision-journal.md) — append during execution
- [diagrams/component-map.md](diagrams/component-map.md) /
  [diagrams/data-flow.md](diagrams/data-flow.md)
- Read-only inheritance: `plans/g6-cluster-geometry/batch-4/
  withlabel-derivation.md` (Rounds 1-2 derivation),
  `docs/graphviz-issues/08-cluster-scoped-rank-subgraph-bbox.md`
  (naming rule, verified builder sequence),
  `plans/g6-cluster-geometry/decision-journal.md` (attempt 1-3
  evidence, 2026-07-22 rows)

## Quality Gates (after every task that lands code)

```
- command: npm test
  pass: exit 0 (DOT gate frozen + census floors + 57-pin ratchet + backlog)
  on_fail: fix_and_rerun
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: git diff --name-only <task-start>..HEAD
  pass: only files in the task's declared write-set
  on_fail: stop
```

## Stop conditions

1. Files outside a task's declared write-set need changes.
2. Two consecutive gate failures on one check, or 3 consecutive fix
   attempts at one code location.
3. A change contradicts D1-D5.
4. Any size-backlog entry would widen (full revert first, then stop).
5. T1 cannot produce a decisive matrix verdict within budget —
   journal ruled-out list + next instrumentation, stop.
6. T4's paper reproduction misses any target bbox — stop BEFORE code.
7. T5 misses any measured target bbox — full revert (G5 protocol),
   PERMANENT stop; a fifth attempt requires human sign-off.
8. NEVER modify `../graphviz-ts` (read-only for probes). A library
   verdict routes to issue 09 + PAUSE, not a local fix.
9. Out of scope entirely: `insideAutonomPass` relaxation, SvekEdge
   placement, side-margin re-derivation, geometric approximation
   (G6 D5 stands).

## Push-forward conditions (decide autonomously, journal it)

- Add matrix cells / fresh fixtures to any measurement sweep.
- Pin extra fixtures reaching byte-exact; tighten backlog beyond plan.
- Delete disposable probes; additive seam-type fields expressing the
  adjudicated spec; minor doc-comment corrections in touched files.
- A task turns out simpler than specced — journal why, proceed.

## Execution rules

- Subagents use Serena MCP for symbols; `npx tsx` for probes;
  `npm run typecheck` as post-edit bar; no git mutations.
- Fixture sources: `tests/corpus/class/<slug>.puml`. Jar oracles:
  `oracle/goldens/state/<slug>/` + cached svek DOT/SVG under
  `test-results/dot-cache/state/<slug>/`. Measurement =
  `data-qualified-name`-matched box extraction (G5 ledger §C8).

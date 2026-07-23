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

## Status: BLOCKED - label-placement gap (6th layer); awaiting direction
<!-- 2026-07-23. T20 ink-walk aggregation verified correct but the
     backlog bar is blocked by attachTransitionLabel's LABEL_PERP=12
     divergence from jar's spline-based SvekEdge label placement
     (~11px on vertical short-label edges). Three T20 variants failed
     the same check -> consecutive-fix stop. Options: (1) label-
     placement port as its own mission, then T19->T14b->T15; (2)
     amend D3 to descope pesita, proceed on bitaxo+kotagu; (3) close.
     bitaxo/kotagu derive EXACT on paper today. -->
<!-- 2026-07-23. Edge-label sizing fix is jar-exact per label but
     widens 15 backlog entries through the fifth pre-existing gap:
     state-composite-autonom.ts#buildPlainAutonomSpec never folds
     edge-label ink into geometry.width (same gap that forced the
     G5/C1 revert; TDD suites preserved as describe.skip). The
     autonom pass borders mission-excluded territory (stop cond. 9).
     Human decision needed: extend scope to the autonom fix, or
     accept pesita cannot reach exactness in this mission. -->
<!-- 2026-07-22. Fourth pre-existing gap: real-layout edge-label
     sizing (addEdges lacks the FIXEDSIZE HTML-table label wiring;
     edgeLabelAttrs under-measures heights). Probe-verified fix
     lands pesita 126x104.72 exactly. Proposed: T18 (edge-label
     sizing) -> paper gate v5 -> T14b -> T15. -->
<!-- 2026-07-22. T11+T12 landed and hold. Third pre-existing gap:
     port declares all nodes before edges; jar's svek emission order
     differs, and graphviz cycle-breaking DFS is order-sensitive for
     cyclic passes (pesita AA). Fix = port jar's svek emission order
     (pin-risk: 57 byte-exact pins depend on current order), then
     paper gate v4, then T14. -->
<!-- 2026-07-22. T9 wiring verified structurally correct (nesting
     isomorphic to jar DOT). Two remaining pre-existing gaps, journal
     T9 row: (1) titleTableWidth lacks jar's max(title, attributes)
     (ClusterHeader.java titleAndAttributeWidth); (2) addLevelEdges
     ignores Transition.direction (jar reverses -up-> edges before
     graphviz). Recommended attempt-6 shape: fix both as standalone
     jar-faithful tasks, paper gate v3, then re-apply T9. -->
<!-- 2026-07-22. Fifth attempt requires human sign-off. Root cause
     identified (journal T5 row): pre-existing addClusters
     parent-resolution gap + unported jar "a"/"p0" ancestor-wrapper
     mechanism (graph-layout-build.ts:154-159). Any attempt 5 must
     port that FIRST and re-run the paper gate against the PORT's
     emitted DOT, not the jar's cached DOT. -->

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
| [3](batch-3/overview.md) | Attempt 4: paper gate → implementation | T4, T5 | T4 [x]; T5 MISS — permanent stop |
| [4](batch-4/overview.md) | Family sweep + close | T6 | NOT RUN (T5 stop) |
| [5](batch-5/overview.md) | Attempt 5: a/p0 port → paper gate v2 → wiring → sweep | T7, T8, T9, T10 | T7-T8 [x]; T9 MISS; T10 not run |
| [6](batch-6/overview.md) | Attempt 6: two gap fixes → paper gate v3 → wiring → sweep | T11-T15 | [ ] |

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

## Mission summary (2026-07-22, session end)

- **Tasks:** T1 [x], T2 [x] (usage verdict — no issue 09), T3 skipped
  (library path not taken), T4 [x] (paper gate PASS), T5 **MISS →
  full revert → permanent stop**, T6 not run.
- **Outcome:** graphviz-ts fully exonerated (7-cell isolation matrix
  + end-anchors, all byte-exact three-way). Attempt 4 implemented the
  gated spec; bitaxo exact, pesita/kotagu missed identically to
  attempt 3. Root cause found and journaled (T5 row): pre-existing
  `addClusters` parent-resolution at `graph-layout-build.ts:154-159`
  never nests a child cluster inside an active protection wrapper,
  and jar's "a"/"p0" ancestor-wrapper mechanism
  (`ClusterDotString.java` protection0/thereALinkFromOrToGroup1) is
  unimplemented repo-wide. Out of T5's write-set → hard bar honored.
- **Paper-gate blind spot (process lesson):** T4 derived `initial`
  from the JAR's cached DOT — which already contains the a/p0
  wrappers — so it validated frontier math but not the port's own
  DOT emission. A future gate must derive from the PORT's DOT.
- **Decisions:** 4 journal rows; T5 row flagged for review.
- **Gates:** all green at every commit; final state: 10192 tests
  pass, typecheck/lint/build clean, working tree byte-identical to
  the docs-only commits (no production code landed).
- **Follow-ups for a human-approved attempt 5:** (1) port the a/p0
  ancestor-wrapper mechanism; (2) fix parent-resolution to nest into
  the active wrapper handle; (3) re-run the paper gate on port-emitted
  DOT; (4) then re-attempt border-point wiring (T5 spec unchanged).
- **Branch:** left unmerged pending human review (docs-only commits).

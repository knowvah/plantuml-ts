# G7 — Border-point rank interaction (G6 batch-4 successor)

## Objective

Unblock the ~20-fixture entrypoint/exitpoint family. G6 attempt 3
proved the full mechanism (naming fix + rankSpec + iWrapperSpec +
FrontierCalculator) byte-exact on the un-nested case (bitaxo `C`
42×101.72) but pesita/kotagu still miss. Isolate the suspected SECOND
dot-engine interaction (rank group coexisting with i-wrapper /
nested child / parent cluster / other ee content), adjudicate
usage-vs-library, then run the paper-gated FOURTH implementation and
the family sweep. G6's derivation (batch-4/withlabel-derivation.md)
and the unwired FrontierCalculator port (commit 60fe88a) carry over.

## Status: COMPLETE
<!-- 2026-07-23. Unblocked by G8 close (T3): the label-placement port
     landed (attachTransitionLabel now consumes graphviz-returned
     labelX/labelY; LABEL_PERP=12 retired as fallback only), the
     autonom edge-label ink gap is closed, and the size-backlog is
     re-tightened (widened=0). Resume at T19 → paper gate v5 → T14b →
     T15 per the batch-6 plan. History below retained for context. -->
<!-- (prior) PAUSED - waiting on the label-placement mission (option 1, 2026-07-23) -->

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
| [6](batch-6/overview.md) | Attempt 6: two gap fixes → paper gate v3 → wiring → sweep | T11-T15 | [x] `d74cfde` `aa5f6961` |

## Resume procedure (cold-start, after external dot-engine fix)

1. Pull the new `.tgz` from `../dot-engine`; bump the
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
8. NEVER modify `../dot-engine` (read-only for probes). A library
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
- **Outcome:** dot-engine fully exonerated (7-cell isolation matrix
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

## G7 mission summary (2026-07-24, COMPLETE)

**Objective met.** The ~20-fixture entrypoint/exitpoint (border-point)
family is unblocked: the border-point→composite wiring landed (T14b) and
the family re-measures clean. G7 took six adjudicated attempts across three
human sign-offs; the decisive unblock came from a *separate* mission (G8
label-placement), not from more wiring iterations.

### Task arc (T1–T20b, then T16–T19, T14b–T15)

- **Batch 1 (T1–T2):** 7-cell isolation matrix → **usage-defect** verdict;
  dot-engine exonerated byte-exact three-way, no issue-09 filed.
- **Batch 3 (T4–T5):** paper gate v1 PASS; attempt 4 **MISS** (pesita/
  kotagu) → permanent stop. Root cause: unported a/p0 ancestor wrappers +
  `addClusters` parent-resolution gap.
- **Batch 5 (T7–T9):** a/p0 port + paper gate v2 PASS; attempt 5 **MISS** →
  stop. Two pre-existing gaps found (titleAndAttributeWidth,
  Transition.direction).
- **Batch 6 (T11–T20b):** titleAndAttributeWidth (T11) + edge reversal
  (T12) landed; paper gate v3 **MISS** (emission order) → T16 jar svek
  emission order landed → paper gate v4 **MISS** (edge-label sizing, +2.5px
  on pesita) → T18/T20/T20b edge-label + ink-walk fixes all **reverted**
  (backlog-widening; sixth gap = LABEL_PERP placement). Each miss was caught
  by the paper gate *before* code (T4 lesson applied), peeling one
  pre-existing gap at a time.
- **Unblock (G8):** the label-placement mission landed on this branch
  (merge commit `7ef0134`): `attachTransitionLabel` now consumes
  graphviz-returned `labelX/labelY` (LABEL_PERP retired to fallback), T18
  FIXEDSIZE edge-labels + T20b ink walk in, `insideAutonomPass` relaxed,
  size-backlog re-tightened (33 improved, pesita-10 → 0.000519). The
  +2.5px edge-label gap is closed on this tree.
- **Engine rename (mid-resume):** layout dependency
  `graphviz-ts@0.1.26072117` → `@knowvah/dot-engine@1.0.0` (commit
  `6db6548`) — verified byte-identical layout, a true drop-in.
- **T19 (paper gate v5):** PASS — all 3 targets exact on the post-G8 tree.
- **T14b:** border-point ee/i-wrapped cluster wiring landed (commit
  `d74cfde`); bitaxo C 42×101.72, pesita AA 126×104.72, kotagu 289×358
  exact.
- **T15 (this task):** family sweep + close-out — measure-only, no code.

### Family sweep outcome

Border-point family enumerated by stereotype grep = **22 state fixtures**
(corpus/class sources using `<<entrypoint>>`/`<<exitpoint>>`/
`<<expansionInput>>` into composites; the 4 stereotype-word matches with
no state golden are class diagrams, excluded). The mission's definition
also covers `[*]`-into-composite members (e.g. `gojuja-90-pune699`,
`kotagu-43-miza629`) which the stereotype grep does not capture but which
measure size-exact all the same. Fresh measurement
(`measure-state-size-deltas.ts`, current tree):

- **18 / 22 size-exact** (DOT node-size delta 0), plus every T14b named +
  spot-checked member that is a `[*]` case: **kotagu** (a fully-realized
  T14b win, absent from backlog = 0), **gojuja**, and the other spot-checks
  (fukexa, jucori, lulozu) all size-exact.
- **4 / 22 with a residual fixture-max delta** — all *pre-existing pinned*
  backlog entries, unchanged by T15 (the border-point boxes themselves are
  exact per T19/T14b; the residual comes from a non-border-point node in
  another svek graph of the same fixture): `bitaxo-18-tamo974` 0.138888,
  `resido-15-reza040` 0.138889, `nijugi-19-jazi166` 0.5,
  `pesita-10-dene726` 0.000519 (sub-pixel).

### Backlog / pins / census (T15 measured results)

- **Backlog** (`size-backlog.json`, 91 entries): harness reports
  `improved:0, widened:0` — **nothing to tighten, nothing to remove**; the
  T14b/G8 wins were already folded in by the G8 re-tighten. `nimana-36-
  veco708` (G8 skin-rose exception) left byte-identical. File unchanged.
- **Pins** (`ratchet.json`, 57): **none qualified.** No size-exact family
  fixture has a committed `golden.svg` (pin prerequisite; golden creation
  is out of close-out scope). Pin count stays **57**. Follow-up below.
- **Census** (`docs/svg-conformance.md`): unmoved — the sweep added 0 pins
  and moved 0 floors; no state pin counts are tracked there. Left as-is.

### Final gate results (T15)

- `measure-state-size-deltas.ts`: 148 measurements, **widened 0**,
  improved 0, unchanged 148.
- `npm test`: **10250 passed** (386 files); state DOT-parity **268/268**;
  57 svg-state pins hold.
- `npm run typecheck` / `lint` / `build`: all clean.

### Follow-ups (out of T15 scope)

1. **Generate svg-state goldens** for the 18 size-exact family fixtures,
   confirm SVG byte-exact + stable, then pin them (they are DOT-EQUAL in
   `parity-state.json`, so eligible once a golden exists).
2. **Residual fixture-max deltas** on bitaxo/resido/nijugi (material) trace
   to non-border-point nodes, not the border-point interaction — a
   separate size-parity task, not a G7 defect.
3. **Reversed-edge SVG path text** (T12 documented divergence) matters only
   when the 17 re-ranked fixtures become pin candidates.

### Branch

Left unmerged — the G7→main merge (merge commit, never squash) is the
orchestrator/human's call.

<!-- Merged since: d74cfde, 7ef0134 and aa5f6961 are all ancestors of main
     as of 2026-08-15. -->

---

## Follow-up outcomes (2026-08-15)

Worked the three follow-ups above. **Follow-up 1's premise is false**;
follow-up 2 is confirmed still real; one unrelated fixture was pinnable.

### 1. Pin the 18 size-exact family fixtures — NOT POSSIBLE, premise falsified

The follow-up says they "are DOT-EQUAL in `parity-state.json`, so eligible
once a golden exists". DOT-EQUAL is only **one** of the two add-rule
conditions (`oracle/goldens/svg-state/README.md#add-rule`). The other is
zero-diff SVG under `DeterministicMeasurer`, and **none of the 24 family
fixtures meets it** — measured, not assumed:

```
npx tsx scripts/svg-conformance-census.ts state --per-fixture
```
17 of 24 report exactly 1 diff, 6 report 3, one reports 5. Zero report 0.

**The "1 diff" is not near-conformance.** It is
`svg/g[1][childCount]` — a mismatch on the ROOT content `<g>`, where
`compareSvg` stops recursing, so everything below it is UNCOMPARED. bitaxo
emits 4 children against jar's 6, kotagu 13 against 14, jucori 13 against
21. Their true distance is unmeasured, not small.

**Mechanism** (bitaxo-18-tamo974, children of the root `<g>`): jar emits a
FLAT mix — `g.cluster`, bare `text`, bare `ellipse`, bare `rect`, `text`,
`g.entity` — while this port wraps every entity in its own
`<g class="entity">` and emits 4 such wrappers. So the gap is element
GROUPING, not missing content. That is the known corpus-wide G-phase
defect #2 ("`g[childCount]` mismatch — 215 fixtures … missing/extra
elements, not geometry", `planning/mission-index.md` Phase G), and it is
in no way border-point-specific.

The conflation to avoid repeating: G7's sweep measured **DOT node-size**
exactness (`measure-state-size-deltas.ts`). Pin eligibility is **SVG
byte** exactness. The follow-up read the first as implying the second.
They are different axes, and on this family the second is nowhere near met.

### 2. bitaxo/resido/nijugi size residuals — CONFIRMED, still open

Re-measured on the current tree; unchanged from close-out, still pinned
backlog entries: `bitaxo-18-tamo974` 0.138888, `resido-15-reza040`
0.138889, `nijugi-19-jazi166` 0.5, `pesita-10-dene726` 0.000519. Still a
separate size-parity task, still not a G7 defect.

### 3. Reversed-edge SVG path text — untouched

Gated on those 17 fixtures becoming pin candidates, which per (1) they are
not. Unchanged.

### What DID land

`pevene-26-kebo361` pinned (state ratchet **58 → 59**) — the only state
fixture meeting both add-rule conditions but missing from `ratchet.json`.
Not a family member; found while enumerating eligibility. Golden copied
verbatim from the dot-cache, ratchet test green at 61.

### One pre-existing defect noticed, not fixed

`measure-state-size-deltas.ts` exits **2** on `tumaba-64-tosu281`
(`widened`): measured 0.229168 against a stored allowance of 0.229167, a
1e-6-inch float wobble. Verified pre-existing — the identical summary
(`widened:1, improved:2, unchanged:146`) reproduces on `main` with no
local changes. Outside this work's scope and the backlog is
tighten-only/maintainer-ruled, so it is recorded rather than silently
re-pinned. See `.agent-notes/g7-followup-pin-eligibility.md`.

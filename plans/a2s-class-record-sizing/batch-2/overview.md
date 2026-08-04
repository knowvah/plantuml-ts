# Batch 2 — Fix per mechanism, grouped by file ownership

Fix tasks are INSTANTIATED from Batch-1 mechanism reports: the orchestrator
assigns each diagnosed mechanism to the F-task that owns its file, writes
the concrete fix list into that task's prompt (mechanism JSON verbatim),
and drops any F-task that received no mechanisms. If two mechanisms land in
one file, they go to the same task. If a mechanism's fix crosses two
F-tasks' write-sets, merge those tasks for this batch.

File ownership (one writer per file — hard rule):

| ID | Owns (write-set) | Covers | Depends On | Done |
|----|------------------|--------|------------|------|
| F1 | src/diagrams/class/class-layout-header-geo.ts, class-badge.ts, class-stereotype.ts + their colocated *.test.ts | header/name/stereotype/badge mechanisms (likely D1/D2/D4) | D1–D4 | [ ] |
| F2 | src/diagrams/class/class-member-rows.ts, class-layout-generic-classifier.ts + colocated tests | body rows, width/height composition, floors (MinimumWidth/SameClassWidth/kalWidth) | D1–D4 | [ ] |
| F3 | src/diagrams/class/class-namespace-shape.ts, class-geo-builders.ts + colocated tests | package/cluster geometry (D3) | D1–D4 | [ ] |
| F4 | src/diagrams/class/class-layout-leaf-shapes.ts, class-layout-helpers.ts + colocated tests | mixed-type leaves, dispatch-level (D4) | D1–D4 | [ ] |

Shared additional write-set, partitioned by slug at instantiation time (the
orchestrator lists each task's exact slugs; no two tasks touch the same
entry): `oracle/goldens/class/size-backlog.json` — delete ONLY entries your
fixes closed, in the same commit. New authored fixtures + jar oracles
(ADR-4) go under `oracle/goldens/class/<new-slug>/` — slug named in the
task prompt, unique per task.

## Common task template (applies to every F task)

- **Architecture decisions (locked):** ADR-1 — fix INSIDE the existing
  pipeline; if the mechanism turns out to need the SI1 body layer, STOP
  and report. ADR-2 — implement exactly the diagnosed mechanism; the
  upstream expression IS the spec; no fitted constants, no speculative
  extras. Cite the Java file:line in a `@see` JSDoc comment on every
  changed expression.
- **TDD:** write the pinning test first (from the mechanism's testPlan),
  see it fail, fix, see it pass.
- **Quality bar (before returning):** `npm test`, `npm run typecheck`,
  `npm run lint`, `npm run build` all green;
  `npx tsx scripts/measure-class-size-deltas.ts` shows widened 0 and your
  predicted slugs conformant (report predicted-vs-actual closure —
  a shortfall is reportable, not silently acceptable);
  `npx tsx scripts/dot-sync-report.ts class` 708 EQUAL;
  `npx tsx scripts/measure-description-size-deltas.ts` held.
- **Boundaries:** Never run state-mutating git (orchestrator commits).
  Never touch files outside your write-set — if a fix needs it, STOP and
  report. Never move a parity-guard entry to quiet a failure. Updating a
  colocated class test that asserts an old (wrong) size is allowed —
  list each such change in your report.
- **Report (interface contract):** per mechanism — slugs closed
  (predicted vs actual), files touched, tests added, any expectation
  updates, any journal-worthy judgment calls. ≤1.5k tokens, raw data.

Commit format (orchestrator, after gates): one commit per F task,
`fix(FN): <mechanism summary>` per `~/.claude/rules/commits.md`, body
citing mechanism + Java expression; backlog deletions in the same commit.

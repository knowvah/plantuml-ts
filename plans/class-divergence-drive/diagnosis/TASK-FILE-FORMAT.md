# Task-file format for this brief (writers' contract)

House style: `plans/activity-loop-lane-translate/batch-0/overview.md` and
`batch-0/T0-classify.md` — terse, front-loaded, `file:line` on both the Java
and the TS side, read-sets as line ranges, no padding. Task file ≤ 150
lines, overview ≤ 60 lines.

`overview.md`: batch description, dependency summary, then
`| ID | Description | Agent | Writes | Depends On | Done |` (Depends On =
task ids or `—`; `—`/prior-batch-only deps run in parallel, in worktrees).

Task file sections, in order:
1. `# Tn — <name>` then `**Agent:** <type> (model) · **Depends on:** …`
2. `## Context` — 2–6 sentences: what upstream does (Java cite), what we do
   (TS cite), quoting the diagnosis report; end with "the report is a lead:
   re-read the cited bodies before editing".
3. `## Task` — numbered steps, TDD (tests first), instrument-first where the
   report's confidence is MEDIUM/LOW (journal the artifact: mechanism,
   origin, causal chain, ruled out).
4. `## Read-set` — `file:line` ranges, Java and TS, plus the diagnosis section.
5. `## Write-set` — exact files incl. test files, `.agent-notes/cdd-Tn.md`,
   `plans/class-divergence-drive/decision-journal.md` (append-only).
6. `## Interface out` / `## Interface in` — only when produced/consumed by
   another task: field names + types, minimal.
7. `## Acceptance criteria` — Given/When/Then, 2–5, naming real slugs.
8. `## Observability` — "N/A — no new observable operations" unless real.
9. `## Rollback` — "Reversible — revert the task's commits; pins are
   committed with the code".
10. `## Quality bar` — four gates (`npm test`, `npm run typecheck`,
    `npm run lint`, `npm run build`); `npx tsx tools/render-diff.mts` on every
    named fixture with structural/numeric counts before and after; hooks:
    ≤500-line files, ≤30 NLOC functions, CCN ≤10, ≤5 params.
11. `## Boundaries` — always / ask-first / never (never rebuild the oracle
    cache (D12); never edit outside the write-set (stop 1); never fit a
    constant without an upstream citation; never run state-mutating git in
    a worktree beyond the task's own commits).
12. `## Commit` — Conventional Commits `fix(cdd-Tn): …` / `feat(cdd-Tn): …`,
    ≤72-char subject, body says why, no attribution lines.

`close.md` (every batch, parameterised by N): four gates; `npm run
svg:survey class`; `npx jiti scripts/svg-conformance-census.ts class`;
`npx tsx tools/render-all.mts measurements/bN.json`; `npx tsx
tools/pin-diff.mts measurements/b<N-1>.json measurements/bN.json` (b0 =
base.json); journal one row per riser / `dotEqual` flip / conformant-loss
with its mechanism (stop 5 if none); pin every fixture that is
survey-conformant AND census 0-diff into `oracle/goldens/svg-class/
ratchet.json` + `<slug>/golden.svg` (copy `in.svg` verbatim, verify with
`cmp`); commit the re-surveyed `tests/oracle/svg-conformance/parity-class.json`;
`npm run parity:dashboard`; fill the `after Bn` column in `fixtures.md` for
the batch's fixtures; tick the batch row in README; JSON-reporter collected
count = on-disk test-file count (stop 7); commit
`chore(cdd-bN): close batch N — <counts>`.

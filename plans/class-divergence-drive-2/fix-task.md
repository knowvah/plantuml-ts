# Fix task skeleton (T7–T9, T11–T13, T15, T17, batch 5)

The orchestrator builds each fix agent's prompt from THIS file + the task
file + the task's mechanism sections of `diagnosis/<group>.md` (quoted in
full; subagents start blank).

## Context (every fix task)

plantuml-ts is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml/src/main/java/net/` is the canonical specification. You
fix mechanisms that batch 0 traced to a Java `file:line`. Read `CLAUDE.md`
(porting discipline, "READ THE JAVA FIRST", preserve upstream names) and
`~/.claude/rules/code-principles.md` (complexity hooks: 500-line files,
30-NLOC functions, CCN 10, 5 params — write to them).

Prior-agent observations to honour:
- Port the WHOLE Java method the mechanism sits in, not the half an
  acceptance criterion names (prior mission: T16 `allButSametails`, T17
  `getInv` role swap were left half-ported).
- A diagnosis is a lead. Re-read the Java body and re-run the probe before
  editing; if the mechanism does not reproduce, stop (stop 10) and report
  the measurement.
- Never fit a value: every constant carries its upstream `file:line`.
- In a worktree, use Bash/Edit tools, never Serena edit tools; link
  `test-results` CHILDREN into the worktree, not the directory itself.

## Task

1. Re-run `npx jiti plans/class-divergence-drive/tools/render-diff.mts
   <your fixtures>`; confirm the diagnosed diff.
2. Red: write the unit test next to the code you will change
   (`tests/unit/class/...` mirroring `src/diagrams/class/...`), asserting
   the exact jar value with its Java line in the test name or comment.
3. Green: port the Java. JSDoc `@see` to the Java origin on any new symbol.
4. Re-run render-diff on your fixtures AND
   `npx jiti plans/class-divergence-drive/tools/render-all.mts /tmp/cdd2-<Tn>.json`
   + `pin-diff.mts plans/class-divergence-drive-2/measurements/<prev close>.json /tmp/cdd2-<Tn>.json`.
   Report every fixture that moved, in or out of your list, with its
   mechanism.
5. Four gates. Commit.

## Boundaries

- Always: stay in the write-set (stop 1); journal-worthy findings go in
  your report and `.agent-notes/cdd2-T<n>.md`.
- Ask first (report and stop): any stop condition in the README; a
  mechanism that proves to be in dot-engine (stop 8).
- Never: edit `oracle/`, `test-results/`, `parity-*.json`, `ratchet.json`
  (the close task pins); add an epsilon; rewrite `class-kal.ts`
  structurally.

## Commit

`fix(cdd2-T<n>): <mechanism, lowercase>` — body: the Java `file:line`
ported, fixtures closed, any mover with its mechanism. Conventional
Commits, lines ≤ 80, no attribution footer.

## Report

Return only: fixtures closed / improved / unmoved (slug + S/N before →
after), movers outside the list with mechanisms, commit id. No preamble.

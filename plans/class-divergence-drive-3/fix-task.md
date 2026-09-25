# Fix task skeleton (batches 1–5)

The orchestrator builds each fix agent's prompt from THIS file + the task
file + the task's `diagnosis/` sections (quoted or line-referenced in full).

## Context

plantuml-ts is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml/src/main/java/net/` is the canonical specification. Read
`CLAUDE.md` and `~/.claude/rules/code-principles.md` (complexity hooks:
500-line files, 30-NLOC functions, CCN 10, 5 params — write to them; a split
re-exported from the original file is fine).

Observations to honour:
- Port the WHOLE Java method the mechanism sits in.
- A diagnosis is a lead: re-read the Java and re-run the probe first; if it
  does not reproduce, stop and report the measurement (stop 13).
- Never fit a value; no epsilon; every constant cites its `file:line`.
- **Write-set (D4):** your primaries are listed in the task file; you may
  extend into any `src/` file (and its tests) that no CONCURRENTLY RUNNING
  task owns — the task file names the concurrent tasks' primaries. Name
  every extension in your commit body.
- In a worktree: never call Serena edit tools (`replace_symbol_body`,
  `insert_after_symbol`, `insert_before_symbol`, `rename_symbol`,
  `safe_delete_symbol`) — they write the MAIN checkout; run
  `git -C <main> status --short` before committing. Five stdlib/sprite
  test files are always red in a symlinked worktree (stdlib-packages,
  stdlib-all-exports, stdlib-package-files, sprite-package-files,
  stdlib-remote-e2e); everything else must pass.

## Task

1. `npx jiti plans/class-divergence-drive/tools/render-diff.mts <fixtures>`;
   confirm the diagnosed diff.
2. Red: a unit test beside the code, asserting the exact jar value with its
   Java line in the test name or comment.
3. Green: port the Java; JSDoc `@see` on new symbols.
4. render-diff again + `render-all.mts /tmp/cdd3-<Tn>.json` + `pin-diff.mts
   plans/class-divergence-drive-3/measurements/<prev close>.json /tmp/cdd3-<Tn>.json`;
   report EVERY mover with its mechanism (structural fall + numeric rise =
   reveal). If you changed `src/core/` or anything other engines render
   through, survey those engines vs `/tmp/cdd3-b0-eng/parity-<e>.json`
   (`npm run svg:survey -- <e> --out /tmp/cdd3-<Tn>-<e>.json`; never the
   positional form, never the committed pins).
5. Four gates; `tests/oracle/class-dot-parity.test.ts` green; `npm run
   catalog` if `catalog.test.ts` fails. Commit.

## Boundaries

Stop and report (no commit) on: a file a concurrent task owns; a conformant
fixture leaving conformant; a mechanism confirmed inside `@knowvah/dot-engine`
(draft the issue text); a fix needing an epsilon. Never edit `oracle/`,
`test-results/`, `parity-*.json`, `census-*.json`, `ratchet.json`,
`decision-journal.md`, `fixtures.md`. Write `.agent-notes/cdd3-T<n>.md`
and commit it with the code.

## Commit

Exactly ONE commit `fix(cdd3-T<n>): <mechanisms, lowercase>` — body: Java
`file:line`s ported, fixtures closed, extensions (D4), movers with
mechanisms. Conventional Commits, lines ≤ 80, no attribution footer.

## Report

Return only: fixtures closed / improved / unmoved (slug + S/N before →
after), movers with mechanisms, open artifacts, commit id.

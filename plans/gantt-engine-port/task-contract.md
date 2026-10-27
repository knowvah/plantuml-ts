# Task contract (every gep task)

Every task spec includes this file by reference. Read it first.

## Context shared by every task
plantuml-ts is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml/src/main/java/net/` is the spec. Gantt lives at
`net/sourceforge/plantuml/gantt/` (NOT `project/` — the planning docs that say
so are stale). Read each method body you port and the constructor that built
its inputs; quote `file:line` for every constant. Never fit a number.

Translation (CLAUDE.md): `int/long/double` → `number` (D5 for long maths);
`String` → `string`; plain-data class → `interface`, behavioural class →
`class`; `static final` → module-level `UPPER_SNAKE`; `Optional<T>` → `T |
undefined`; checked exception → thrown `Error` subclass or a `Failable`
(`src/core/gantt/Failable.ts`). Enums → `as const` object + type (the
`LengthAdjust` pattern in `src/core/klimt/drawing/svg/svg-option.ts`).
`java.time` → `src/core/time/` (D2, batch 1) — never JS `Date`.

## Porting rules
- Whole files only, same path and name under `src/diagrams/gantt/` (D1), each
  exported symbol with a JSDoc `@see` to its Java origin.
- Do not refactor while porting: redundant-looking branches stay.
- A class your file needs from a LATER batch does not exist yet: stop 1 —
  report it; never stub it.
- Before porting, `grep -n "::remove\|::comment\|::uncomment" <file>`; an
  `__MIT__` marker is stop 13 (`__HAXE__` markers are ignored).
- Check `docs/catalog.md` before writing a helper: klimt (`UGraphic`,
  `TextBlock`, `Opale`, `HColor`), style (`StyleSignature`, `SName`), creole
  and `Failable` already exist.

## Tests (TDD)
- One test file per ported file: `tests/unit/gantt/<same path>.test.ts`
  (`tests/unit/core/time/…` for D2). Expected values cite the Java
  (`file:line`) or a jar oracle; assert specific values, never truthiness.
- Coverage 90/90/90 on what you add.

## Boundaries
- Write only your write-set. A needed file outside it is stop 1 (exception:
  a 500-line split of a file in your write-set — journal it in the hand-back).
- Never dot-engine, the plantuml fork, the oracle jar, cached oracle bytes,
  `oracle/accepted-divergences.json`, or any pin/baseline/parity file (the
  orchestrator owns those).
- No Serena edit tools (they write the MAIN checkout); no `git stash`; never
  push; never leave a background process running when you finish.
- No new runtime dependency; `src/` never imports a Node built-in,
  `process.env`, DOM, network, `Date`, `Math.random()`.
- Load is often high: run vitest with `--maxWorkers=2`; "Test timed out" with
  no diff is load — rerun.
- Quality bar: your tests green, `npm run typecheck`, eslint +
  `npx prettier --write` on your files (worktrees skip git hooks).
- Observability: N/A — no new observable operations. Rollback: Reversible
  (revert the task commit).

## Commit
One commit, Conventional Commits (`feat(gantt): …`), ≤72-char subject, body
says what was ported and lists the Java files read; no attribution lines.
Unsigned, in the worktree.

## Hand-back (one block, no prose)
commit SHA · files changed (line counts) · Java files ported (path → TS path)
· tests (count, all green?) · typecheck/lint result · anything stubbed,
skipped or moved (must be none without a stop) · open questions. Return only
the structured result — no preamble, no trailing summary.

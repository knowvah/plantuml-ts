# T10 — F9: `--` vs `||` concurrent-region orientation (G11)

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `fix/state-declared-size`.
SI28 `findings/concurrent-region.md#fimivu-15-vogi904` (resolved, exact
arithmetic): the parser/composite pass never distinguishes `--` (vertical
stack) from `||` (horizontal stack); `stackConcurrentRegions`
(`state-composite-sizing.ts:121-128`) always applies the `--` formula. Jar:
`svek/ConcurrentStates.java:63-89` (`Separator.fromChar`, `.add`). Read the
record, `decisions.md`, CLAUDE.md, and the Java (`ConcurrentStates.java`
whole, `statediagram/command/CommandConcurrentState.java`).

## Task
1. Record the separator kind at parse time (`state-commands.ts`, AST field in
   `ast.ts`, name preserved from upstream: `Separator`) and stack horizontally
   for `||` in `state-composite-sizing.ts` / `state-composite-concurrent.ts`,
   mirroring `ConcurrentStates.java:63-89` arithmetic (cite lines).
2. `grep -l '^\s*||' test-results/dot-cache/*/*/in.puml` first — every user
   of `||` is in scope; list them and confirm each moves jar-ward.
3. Ratchet for fimivu-15 (and any other `||` fixture that goes exact).
TDD: extend `tests/unit/state/state-concurrent-composite.test.ts` with fimivu's
`in.puml`, asserting the composite declared width/height (66/65 px closure).

## Write-set
`src/diagrams/state/ast.ts`, `state-commands.ts`, `state-composite-sizing.ts`,
`state-composite-concurrent.ts`, `tests/unit/state/state-concurrent-composite.test.ts`,
ratchet entries.

## Read-set
Record; `state-composite-sizing.ts:100-140`; `state-composite-concurrent.ts`
(whole); `state-commands.ts` (the `--` handler); `ast.ts` composite/region
types; Java `svek/ConcurrentStates.java`, `statediagram/command/CommandConcurrentState.java`.

## Acceptance
- Given `||`, then regions stack horizontally per `ConcurrentStates.java:63-89`; given `--`, unchanged.
- Given fimivu-15, then rows exact (−66.000 w / +65.000 h close); `harness-diff.py` clean.
- Given `render-manifest --diff`, then only `||` fixtures move (listed, jar-ward).

## Observability / Rollback
Harness. Reversible.

## Report (≤400 tokens)
`||` fixture list with results; ratchets removed.

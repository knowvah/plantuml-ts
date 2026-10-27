# T1e — ubrex challenges, composites, parser, expression + upstream tests

Agent: `typescript-pro` (sonnet), worktree `gep-T1d` (chain, second; T1d's
commit is on the branch — read its files, do not change them). Commit:
`feat(core): port ubrex challenges, parser and expression (T1e)`.
Read [../task-contract.md](../task-contract.md), decisions D1, D11 +
Amendment 1, and [overview.md](overview.md) "Chain rules".

## Port (whole files, upstream names)
From `~/git/plantuml/src/main/java/com/plantuml/ubrex/` → `src/core/ubrex/`:
`ChallengeAlternative` (64), `ChallengeCharClass` (60), `ChallengeCharSet`
(106), `ChallengeEndOfText` (46), `ChallengeLazzyOneOrMore` (71),
`ChallengeLookAhead` (69), `ChallengeLookBehind` (65), `ChallengeOneOrMore`
(70), `ChallengeOneOrMoreUpToOldVersion` (69), `ChallengeOptional` (59),
`ChallengeRepetition` (72), `ChallengeSingleChar` (86), `ChallengeUpTo` (58),
`ChallengeZeroOrMore` (66), `CompositeList` (121), `CompositeNamed` (82),
`AtomicParser` (298), `UnicodeBracketedExpression` (115).

## Write-set
`src/core/ubrex/<the 18 names>.ts`; `tests/unit/core/ubrex/<same>.test.ts`;
`tests/unit/core/ubrex/upstream/<Name>.test.ts` for EVERY file in
`~/git/plantuml/src/test/java/com/plantuml/ubrex/` except `SafeListTest`
(T1d) and `UrlUbrexTest` (T1f); `docs/catalog.md`.

## Notes
- `AtomicParser` parses the bracketed syntax (`「…」`, `〇+`, `〴d`, …):
  read the whole file and the upstream tests first; the tests ARE the spec of
  the notation. Keep every branch (do not refactor while porting).
- `UnicodeBracketedExpression.build(String)` (or its factory) must give the
  same `UMatcher` captures as the Java for every upstream test.

## Acceptance
- Given every upstream ubrex test file in this write-set, every assertion
  passes in its vitest port (assert the same values; no assertion dropped).
- Given each ported file, every public member exists with the same name and
  behaviour.
- Given the task, `npm run typecheck` clean (stop 14), eslint clean, coverage
  ≥ 90/90/90 on the new files.

Observability: N/A. Rollback: Reversible.

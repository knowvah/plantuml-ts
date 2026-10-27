# T1f — ubrex builder, RegexResult, CommandControl, UBrexSingleLineCommand2, UbrexUrlBuilder

Agent: `typescript-pro` (sonnet), worktree `gep-T1d` (chain, last; T1d + T1e
on the branch). Commit:
`feat(core): port ubrex builder and its command and url adapters (T1f)`.
Read [../task-contract.md](../task-contract.md), decisions D1, D11 +
Amendment 1 (the `UBrexSingleLineCommand2` adaptation), and
[overview.md](overview.md) "Chain rules".

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/{UBrexConcat,UBrexLeaf,UBrexNamed,UBrexOneOrMore,UBrexOptional,
  UBrexOr,UBrexPart,UBrexUpto,UBrexZeroOrMore}.java` → `src/core/ubrex/builder/`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/{RegexPartialMatch,
  RegexResult}.java` → `src/core/regex/`
- `…/plantuml/command/{CommandControl,UBrexSingleLineCommand2}.java` →
  `src/core/command/`
- `…/plantuml/url/UbrexUrlBuilder.java` → `src/core/url/UbrexUrlBuilder.ts`

## Write-set
the 14 TS files above; `tests/unit/core/ubrex/builder/<Name>.test.ts`,
`tests/unit/core/regex/<Name>.test.ts`, `tests/unit/core/command/{CommandControl,
UBrexSingleLineCommand2}.test.ts`, `tests/unit/core/url/UbrexUrlBuilder.test.ts`,
`tests/unit/core/ubrex/upstream/UrlUbrexTest.test.ts`,
`tests/unit/core/ubrex/upstream/builder/{ColorParserTest,CommandPartitionTest,UBrexLeafTest}.test.ts`
(from `~/git/plantuml/src/test/java/com/plantuml/ubrex/builder/`),
`tests/unit/core/ubrex/upstream/UbrexUrlBuilderTest.test.ts` (from
`~/git/plantuml/src/test/java/net/sourceforge/plantuml/url/UbrexUrlBuilderTest.java`);
`docs/catalog.md`.

## Notes
- `RegexResult` has two constructors (`Map<String, RegexPartialMatch>` and
  `UMatcher`, `RegexResult.java:53-62`): a static factory per constructor
  (e.g. `RegexResult.fromMap`, `RegexResult.fromUMatcher`) or a union
  constructor — keep `get(key)`, `get(key, num)`, `getLazzy`, `size`,
  `toString`, `getUMatcher` semantics exactly.
- `UBrexSingleLineCommand2`: abstract class, members as Java
  (`syntaxWithFinalBracket`, `isValid`, `finalVerification`, `explain`,
  `execute`, `isForbidden`, `executeArg`, `isEligibleFor`, `doTrim`),
  taking the one `StringLocated` line (`src/core/tim/StringLocated.ts`) where
  Java takes `BlocLines` (Amendment 1; document with `Command.ts`'s
  precedent). `CommandControl` as an `as const` enum. Errors:
  `NoSuchColorException` → `src/core/klimt/color/NoSuchColorException.ts`,
  `PSystemError` → `src/core/error/PSystemError.ts` (read what they export).
  Test with a toy subclass over a small `UBrexConcat` pattern.
- `UbrexUrlBuilder`: read `src/core/url/UrlBuilder.ts` and `Url.ts` and build
  the same `Url` values; port `UrlUbrexTest.java` assertions.

## Acceptance
- Given every ported file, every public member exists with the same name and
  behaviour, tests citing `file:line`.
- Given `UrlUbrexTest.java`, the three `builder/` tests and `UbrexUrlBuilderTest.java`,
  every assertion passes (one `it` per `@Test`, `// Name.java:LINE` per assertion).
- Given gantt's own uses (`lang/SubjectDayAsDate.java:132-142`: a
  `UBrexConcat` of `UBrexNamed`/`UBrexLeaf("「dDtTeE」")`), a test builds that
  exact tree and `findFirstValueByKey` returns the same values for `T+5`,
  `d-2`, `E+10` and rejects `X+1`.
- `npm run typecheck` clean, eslint clean, coverage ≥ 90/90/90; `dist/*.d.ts`
  unchanged (nothing re-exported from `src/index.ts`).

Observability: N/A. Rollback: Reversible.

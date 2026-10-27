# T1d — ubrex core: navigator, challenge/result/capture, char classes, matcher

Agent: `typescript-pro` (sonnet), worktree `gep-T1d` (chain, first). Commit:
`feat(core): port ubrex navigator, captures and char classes (T1d)`.
Read [../task-contract.md](../task-contract.md), decisions D1 (naming), D5,
D11 + Amendment 1, and [overview.md](overview.md) "Chain rules".

## Port (whole files, upstream names)
From `~/git/plantuml/src/main/java/com/plantuml/ubrex/` → `src/core/ubrex/`:
`CaseMode` (47), `CharClassType` (40), `CaptureEntry` (70),
`CaptureLookup` (45), `SafeList` (164), `LookAround` (93), `CharSet` (119),
`CharClassRaw` (134), `CharClass` (72), `Repetition` (99), `TextNavigator`
(141), `Challenge` (47), `ChallengeResult` (82), `Capture` (106), `UMatcher`
(61), `package-info` (7) — plus `readme.md` copied verbatim.

## Write-set
`src/core/ubrex/{CaseMode,CharClassType,CaptureEntry,CaptureLookup,SafeList,
LookAround,CharSet,CharClassRaw,CharClass,Repetition,TextNavigator,Challenge,
ChallengeResult,Capture,UMatcher,package-info}.ts`, `src/core/ubrex/readme.md`;
`tests/unit/core/ubrex/<same>.test.ts`, `tests/unit/core/ubrex/upstream/SafeListTest.test.ts`;
`docs/catalog.md`.

## Notes
- Java `char`/`int` code points: `TextNavigator` walks a `CharSequence`
  by UTF-16 index; keep UTF-16 indices (`charAt` / `charCodeAt`), not code
  points, unless the Java calls `codePointAt`. `Character.isLetter` /
  `isDigit` / `isWhitespace` etc. in `CharClassRaw`: implement with the
  Unicode-property regexes that match the JDK definitions (cite javadoc);
  test boundary characters (e.g. `é`, `٣`, U+00A0 — `isWhitespace` is false
  for NBSP in Java).
- `Challenge` is an interface; `ChallengeResult` / `Capture` hold the match
  tree. Cyclic imports are fine in TS when used inside bodies (`import type`
  where possible).

## Acceptance
- Given each ported file, every public member exists with the same name and
  behaviour; tests cite `file:line` for expected values.
- Given `SafeListTest.java`, every assertion passes in the vitest port.
- Given the task, `npm run typecheck` is clean at its end (stop 14), eslint
  clean, coverage ≥ 90/90/90 on the new files.

Observability: N/A. Rollback: Reversible.

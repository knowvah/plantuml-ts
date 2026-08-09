# A2s task F-C observations

## Observation: colocated src tests never run under npm test
- **Context**: F-C's write-set mandated colocated `src/diagrams/class/note-layout-measure.test.ts`.
- **Finding**: `vitest.config.ts` `include` is `['tests/**/*.test.ts']` only; a
  `src/**` test file is silently skipped (vitest 1.6 has no `--include` CLI
  override; positional filters cannot widen `include`). Verified: direct
  `npx vitest run src/.../note-layout-measure.test.ts` exits "No test files
  found". Ran it via a scratchpad config override instead.
- **Impact**: any colocated test is invisible to the `npm test` gate until it
  is moved under `tests/` (or the config include is widened). F-C's 22 tests
  currently need relocation to `tests/unit/class/` to count in CI.
- **Confidence**: High

## Observation: block-form vs single-line-form notes differ on backslash escapes
- **Context**: F-C B5-note (literal \n in notes).
- **Finding**: jar single-line notes (`note left of X : a\nb`) go through
  `Display.getWithNewlines` (split \n/\r/\l, resolve \\, \t); BLOCK notes go
  through `BlocLines#toDisplay` — all backslash escapes stay LITERAL
  (jar-probed: block body line `aaa\nbbb` measures one line; `bopusi-74`'s
  `Note \\ (foo...)` measures both backslashes). Since this port stores both
  forms as one string, `note-layout-measure.ts#splitNoteDisplayLines` gates
  the scanner on "single physical line AND contains \n/\r/\l" — exact for all
  known corpus inputs; the residual ambiguity (one-line block note containing
  literal \n, or single-line-form note with only \\/\t escapes) is unreachable
  in the corpus and keeps pre-F-C literal behavior.
- **Impact**: any future note-text refactor must preserve the origin
  distinction or thread an explicit origin flag through `ClassNote`.
- **Confidence**: High

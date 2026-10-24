# T6f — `%filename()` from `RenderOptions.filename`

Agent: `typescript-pro` (sonnet), worktree `sdd3-T6f`. Commit:
`feat(preprocessor): wire %filename from RenderOptions.filename`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism
`Defines.overrideFilename(filename)` (`Defines.java:89-94`) sets env `filename`
= the name and `filenameNoExtension` = the name up to the last `.`
(`nameNoExtension` `:149-155`; no `.` -> unchanged), only when non-null. The
CLI passes the file name (`CliOptions.java:255`; `Defines.java:116,128` from
`File#getName`). The port's `preprocessLinesOrError` builds
`new TContext({ includeStore })` (`preprocessor.ts:291-296`) and `TContext`
defaults to `createDefaultTimEnvironment()` (`TContext.ts:98`), whose
`getEnvironmentValue` returns `undefined`, so `%filename()` is `""`
(`builtin/Filename.ts:19`). Wire an environment: spread the default and
override `getEnvironmentValue` for `filename`/`filenameNoExtension` from
`options.filename` (T6a added the optional field); other names stay
`undefined` (`%dirpath()` stays environment-dependent, D4). Decision: the
value lives in `PreprocessOptions`, not `ParseOptions` — it is a preprocessor
input and the harness already forwards `PreprocessOptions` whole
(`render-fixture-sequence.ts:83` `FixtureSequenceOptions`).

## Targets
tifube-59-tezo313 (ws 21; `in.puml:4` `Alice -> Bob : filename %filename()`),
expected `in.puml`.

## Write-set
`src/core/preprocessor.ts` (env construction; the T6a type line is already
there), `src/core/BlockUmlBuilder.ts` only if `filename` is not forwarded,
`tests/oracle/svg-conformance/render-fixture-sequence.ts`
(`sequenceFixtureOptions` returns `filename: 'in.puml'`; also widen its return
type), `tests/unit/preprocessor-filename.test.ts`.

## Read-set
`Defines.java:85-155`; `preprocessor.ts:140-155,286-300`; `tim/builtin/
{TimEnvironment,Filename,FilenameNoExtension}.ts`; `tim/TContext.ts:90-105`;
`render-fixture-sequence.ts:80-130`.

## Interface contracts
`createDefaultTimEnvironment()` is unchanged; the override is built locally
in `preprocessor.ts`. The harness is the only caller that passes `in.puml`;
production passes nothing unless the caller sets `RenderOptions.filename`.

## Acceptance
- Given `preprocess('@startuml\nA -> B : %filename() %filename_no_extension()
  \n@enduml', undefined, { filename: 'a.b.puml' })`, then the text is
  `a.b.puml a.b`; with no `filename`, both are empty (unchanged).
- Given tifube-59-tezo313, then `diff-one` ws is 0 (orchestrator pins).
- Given every other sequence fixture and the 1042 pins, then byte-equal and
  no `filename`-using row in any other engine changes (all-engine survey);
  no conformant loss in any engine.

## Observability
N/A.

## Rollback
Reversible.

# T1e — run each sequence `skinparam` at its own line

Agent: `typescript-pro`, worktree `sdd1-T1e`. Added 2026-10-20 from T1b's
finding (journal row 17). Commit:
`fix(sequence): apply a skinparam from its own line onward (d2)`.

## Context
plantuml-ts ports PlantUML faithfully; the Java at `~/git/plantuml` is the
spec. Read the Java method bodies before writing anything and cite
`file:line`. D2 (decisions.md): every sequence event carries the
`StyleBuilder` current at its command line, so a mid-diagram `skinparam`
reaches only LATER events. The jar confirms it: rendering

```
@startuml
A -> B
skinparam participantBorderThickness 2
C -> D
@enduml
```

with `scripts/oracle-render.sh` gives A and B `stroke-width:0.5` and C and D
`stroke-width:2`. Upstream runs `CommandSkinParam` where it stands
(`command/CommandSkinParam.java`, `skin/SkinParam.java#setParam`).

T1b (merged) captures the builder per event through
`createSequenceStyleDispatch` / `executeDeclarationsBefore`
(`src/diagrams/sequence/sequence-skin-param.ts:60-103`). The gap: the port
collects skinparams in the PREPROCESSOR, which records only each key's place
on a declaration counter (`src/core/preprocessor-collector.ts:304-307`,
`skinparamOrder`), not its document line. `positionedDeclarationsOf`
(`src/core/style/mindmap-style-builder.ts:75-95`) therefore runs a skinparam
at the previous `<style>` block's line, or before every line. T1b pinned the
correct expectation as an `it.fails` in
`tests/unit/sequence/parser-style-capture.test.ts`.

## Task
1. Tests first: flip the `it.fails` in `parser-style-capture.test.ts` to a
   passing `it` (event 1 resolves participant thickness 0.5, event 2
   resolves 2). Add: a skinparam BLOCK (`skinparam sequence { … }`) between
   two messages positions at its opening line; a skinparam before the first
   event reaches every event; a `<style>` and a skinparam interleaved keep
   document order; a key assigned twice applies the first value to events
   between the two assignments and the second after (upstream executes each
   command — no corpus fixture does this, so assert it against an oracle
   render you make with `scripts/oracle-render.sh`).
2. Preprocessor (ADDITIVE ONLY — every existing field keeps its value and
   meaning; other engines read them): record every skinparam assignment in
   document order with its value and its document line, in the same frame
   as `stylePositions` (see the `stylePositions` doc comments in
   `preprocessor.ts` and `preprocessor-collector.ts:136-206`). A new optional
   field on `PreprocessorResult`, carried onto `UmlSource`
   (`block-extractor.ts:70-80`) by `src/index.ts#umlSourceOfBlock` and the
   harness's `sequenceBlockSource`
   (`tests/oracle/svg-conformance/render-fixture-sequence.ts`).
3. `createSequenceStyleDispatch`: when the source carries the new field,
   build `pending` from `<style>` blocks at `stylePositions` and skinparam
   assignments at their lines, ordered by position then declaration order;
   execute a skinparam with its own recorded value (`SkinParam#setParam`, as
   `executeDeclaration` does). When the field is absent (a hand-built
   source), keep today's `positionedDeclarationsOf` path. Do not edit
   `mindmap-style-builder.ts` or anything else under `src/core/style/**`.
4. Rendered output must not change: no renderer reads the builders yet. The
   orchestrator re-checks every fixture byte-for-byte.

## Write-set
`src/core/preprocessor.ts`, `src/core/preprocessor-collector.ts`,
`src/core/block-extractor.ts` (type only), `src/index.ts`
(`umlSourceOfBlock` only), `src/diagrams/sequence/sequence-skin-param.ts`,
`tests/oracle/svg-conformance/render-fixture-sequence.ts`, and tests:
`tests/unit/sequence/parser-style-capture.test.ts`,
`tests/unit/sequence/sequence-skin-param.test.ts`, the preprocessor unit test
file(s) that cover the collector (find them).

## Read-set
`decisions.md#d2`; `sequence-skin-param.ts:1-110`;
`src/core/preprocessor.ts:55-125,240-330`;
`src/core/preprocessor-collector.ts:120-310`;
`src/core/style/mindmap-style-builder.ts:40-100,240-260`;
`src/core/block-extractor.ts:40-100`; `src/index.ts:60-90`;
`tests/oracle/svg-conformance/render-fixture-sequence.ts`;
`tests/unit/sequence/parser-style-capture.test.ts`; Java:
`command/CommandSkinParam.java`, `command/CommandSkinParamMultilines.java`,
`skin/SkinParam.java` (`setParam`, `getCurrentStyleBuilder`, `muteStyle`).

## Quality bar
`npx vitest run tests/unit/sequence tests/unit/preprocessor* tests/unit/core
tests/oracle/svg-conformance/sequence.*` (adjust the preprocessor glob to the
real file names) + `npm run typecheck` + eslint on changed files. Also run
`tests/oracle/svg-conformance/*.golden.ratchet.test.ts` for mindmap, wbs and
salt: they read the preprocessor and must stay green.

## Boundaries
- No edit under `src/core/style/**`. No change to an existing field of the
  preprocessor result. No public API change (`renderSync`/`render`/
  `renderAll` signatures, exported option types); a new optional field on an
  exported type is allowed only if it is optional.
- No geo/renderer/layout file.
- No Serena edit tools (they write the MAIN checkout, not your worktree). Use
  Read/Edit/Write only. No `git stash`. No push. Work only under your
  worktree path.
- If the 500-line hook blocks a file, split a helper and list it.

## Commit
Conventional Commits, subject ≤72 chars lowercase, body lines ≤80, no
attribution / Co-Authored-By. Body quotes the oracle probe result and the
position frame used.

Return only the structured result — no preamble, no trailing summary:
commit hash; files changed; test counts; the oracle results for the probes;
any deviation with its Java citation.

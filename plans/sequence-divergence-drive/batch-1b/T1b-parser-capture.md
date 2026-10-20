# T1b — `parseSequence(UmlSource)` and per-event builder capture

Agent: `typescript-pro`, worktree `sdd1-T1b`. Commit:
`refactor(sequence): capture the style builder per event (D2, D3)`.

## Context
plantuml-ts ports PlantUML faithfully; the Java is the spec. Upstream's
`SequenceDiagram` hands every event and participant the builder CURRENT at
its command (`sequencediagram/SequenceDiagram.java:130,172,248,270,289,372,
428`; `Doll.java:83`), because `skinparam` / `<style>` commands mutate the
skin param where they are dispatched (`skin/SkinParam.java:164-167`). T1a
built `createSequenceStyleDispatch` / `executeDeclarationsBefore` /
`currentStyleBuilder` (`src/diagrams/sequence/sequence-skin-param.ts`).
`parseSequence(lines, options)` (`parser.ts:389`) receives only `lines`, so
it cannot see `UmlSource.styleSource` / `stylePositions`
(`src/core/block-extractor.ts:45-90`). wbs already does this:
`parseWbs(source, …)` and `executeDeclarationsBefore` before each command
(`src/diagrams/wbs/WBSDiagramFactory.ts:160-200,266-280`).

## Task
1. `parseSequence(source: UmlSource, options?)`. Build the dispatch once;
   in `runDispatchLoop` (`parser.ts:286`) call `executeDeclarationsBefore`
   with the command's DOCUMENT position before dispatching each command.
   Verify which index space `stylePositions` uses (preprocessor doc comment
   in `block-extractor.ts:70-80`) against the loop's `trimmedEntries[i]
   .origIndex`, and quote it in the commit body. A refusal returns as the
   parse result.
2. Every AST node a Java constructor gives a builder carries
   `styleBuilder: StyleBuilder` (readonly): `Participant`, every
   `SequenceEvent` variant, `BoxGroup` (englober). Set from
   `currentStyleBuilder(dispatch)` at creation — inside the command
   handlers in `sequence-command-registry.ts` / `command-*.ts` where the
   node is built. Multi-line commands (notes, refs, participant multilines)
   capture at their OPENING line, as upstream executes them there.
3. Callers: `src/diagrams/sequence/index.ts` (`sequencePlugin.parse`),
   `tests/oracle/svg-conformance/render-fixture-sequence.ts` (pass
   `first.source`), `src/diagrams/sequence/ast.ts` if it calls the parser,
   and every test caller (grep `parseSequence(` — ~27 files under
   `tests/unit/`) through a new `tests/helpers/sequence-source.ts#
   sequenceSource(lines: readonly string[]): UmlSource`.
4. Tests (first): a `skinparam` between two messages — the first message's
   builder lacks it, the second's has it; a multi-line note captures at its
   opener; a bad `<style>` refuses; the plugin and the harness pass the same
   `UmlSource` (assert the harness builds through `buildBlockUmls`'s source,
   not a copy).

## Write-set
`src/diagrams/sequence/{parser,sequence-command-registry,ast,index}.ts`, the
`src/diagrams/sequence/command-*.ts` files whose handlers construct AST nodes
(journal the list), `tests/oracle/svg-conformance/render-fixture-sequence.ts`,
`tests/helpers/sequence-source.ts`, every `tests/**` file calling
`parseSequence(` (grep at start; a missed caller is push-forward).

## Read-set
`decisions.md#d2`, `#d3`; `sequence-skin-param.ts` (T1a's exports);
`parser.ts:280-420`; `ast.ts:20-300`; `src/diagrams/wbs/WBSDiagramFactory.ts:
130-200,260-290`; `src/core/block-extractor.ts:40-100`;
`render-fixture-sequence.ts:60-110`; Java: `SequenceDiagram.java:100-440`
(every `getCurrentStyleBuilder()` call), `Participant.java:95-110`,
`Note.java:84-110`.

## Interface contracts
Input (T1a): `createSequenceStyleDispatch`, `executeDeclarationsBefore`,
`currentStyleBuilder`. Output (consumed by T2*, T3*): every `Participant`,
`SequenceEvent` and `BoxGroup` has `readonly styleBuilder: StyleBuilder`;
`parseSequence(source: UmlSource, options?: ParseOptions)`.

## Acceptance
- Given every corpus fixture, when rendered on the ratchet path and through
  `renderSync`, then the SVG is byte-identical to b0.
- Given `A -> B` / `skinparam participantBorderThickness 2` / `C -> D`, when
  parsed, then event 1's builder resolves participant thickness 0.5 and
  event 2's resolves 2.
- Given a malformed `<style>` block, then `parseSequence` returns a refusal.
- Given `grep -rn "parseSequence(" src tests`, then every call passes a
  `UmlSource`.

Quality bar: `npx vitest run tests/unit/sequence tests/unit/annotations-
parsers-a.test.ts tests/unit/sprite-parsers.test.ts tests/oracle/svg-
conformance/sequence.*` + typecheck + eslint. Boundaries: no geo/renderer
file (T1c, batch 2); no edit under `src/core/style/**`; no Serena edit
tools. Observability: N/A — no new observable operations. Rollback:
Reversible.

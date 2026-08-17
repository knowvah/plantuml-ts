# T9 — ONE `CommandCreateJson` / `JsonNode` in `core/command/`

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (`~/git/plantuml`
is the spec; read the Java before acting; never fit a value). Pure SVG,
vitest, 500-line cap. Upstream: `objectdiagram/command/CommandCreateJson.java`
(224) + `CommandCreateJsonSingleLine.java` (184), added by
`ClassDiagramFactory:118-119`, `StateDiagramFactory:115-116`,
`DescriptionDiagramFactory:130-131` — ONE implementation. Ours: `class/class-
json-commands.ts` (386) and `state/state-json-commands.ts` (383) are 74 %
line-identical clones; `class/class-json-ast.ts` and `state/state-json-ast.ts`
(`JsonNode`) are 100 % identical. T7 gave us `core/command/Command<S>`.
Decision D7.

## Task

1. Read both Java files whole and both TS copies whole. Three-column table
   (Java line → class copy → state copy) for every regex, branch and
   side-effect. Every difference between the copies is settled by the Java
   line (cite it); an unsettled one → STOP (README stop 5) with the table.
2. `src/core/command/JsonNode.ts`: the one `JsonNode` type (git mv the class
   copy; delete the state copy).
3. `src/core/command/CommandCreateJson.ts`: the shared parsing/state machine
   (multi-line open/close, single-line form, `JSON_MULTILINE_DECL_RE`,
   `JSON_SINGLE_LINE_RE`, `parseJsonNode`, `finalizeJsonBody`) typed over a
   minimal engine-agnostic state (`interface JsonCommandHost { sink(entity):
   void; … }` — only what both engines must supply: how to add the finished
   entity, how to hold the in-progress block). Export a factory that returns
   `Command<S>[]` for a host: `jsonCommands<S>(adapt: (s: S) => JsonCommand
   Host): Command<S>[]`. `@see` both Java files with lines.
4. Engines: `class-json-commands.ts` and `state-json-commands.ts` shrink to
   the adapter (`ParseState` → `JsonCommandHost`) + `JSON_COMMANDS =
   jsonCommands(adapt)`; rewire `class/{ast,class-classifier-ast,class-command-
   declarations,parser}.ts` and `state/{ast,state-json-sizing,parser,state-
   commands,state-parse-state}.ts` imports.
5. Tests: merge both copies' tests into `tests/unit/core/command/Command
   CreateJson.test.ts` keeping every assertion; each Java-settled difference
   gets a test citing the line. Engine adapters keep a smoke test each.
6. Manifest: EMPTY (`--only class,state,object` per task; full at batch end).

## Write-set

`src/core/command/CommandCreateJson.ts` (new), `src/core/command/JsonNode.ts`
(new), `src/diagrams/class/{class-json-commands,class-json-ast(del),ast,class-
classifier-ast,class-command-declarations,parser}.ts`, `src/diagrams/state/
{state-json-commands,state-json-ast(del),ast,state-json-sizing,parser,state-
commands,state-parse-state}.ts`, tests.

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/objectdiagram/command/CommandCreateJson.java`,
  `CommandCreateJsonSingleLine.java` (whole)
- `src/diagrams/class/class-json-commands.ts`, `src/diagrams/state/state-json-
  commands.ts` (whole), the two `*-json-ast.ts`, `src/core/command/Command.ts`
  (T7), `src/diagrams/state/state-commands.ts:1-60` (`passes` semantics)
- `decisions.md#d7`, `#d4`; README stop 5

## Architecture decisions

D1, D4, D7, D8. Description is NOT wired (follow-on).

## Interface contract

`core/command/CommandCreateJson.js#jsonCommands<S>(adapt): Command<S>[]`;
`core/command/JsonNode.js#JsonNode`.

## Acceptance criteria

- Given `src/`, then `JsonNode` and the JSON regexes/state machine each have
  exactly one definition, under `core/command/`.
- Given class/state/object fixture sets, then `0 fixtures differ`.
- Given every row of the merge table, then the chosen behaviour cites a Java
  line, and the merged test count ≥ the sum of the two former tests.

## Quality bar

4 gates + manifest + dot-sync green. Commit
`refactor(T9): one CommandCreateJson port shared by class and state` (body:
merge-table summary).

## Observability

N/A.

## Rollback

Reversible.

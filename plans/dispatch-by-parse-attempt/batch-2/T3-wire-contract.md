# T3 — widen the plugin contract, adopt the candidate set

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. This mission ([README](../README.md))
replaces regex routing with upstream's parse-attempt dispatch.

T1 built `ParseRefusal`; T2 built `findStartTypes`. This task wires both into
the core types **without changing any behaviour** — the dispatcher keeps
routing by `accepts()`, and no engine refuses anything. It is the last
zero-movement step before the atomic batch that flips dispatch.

Its value is that it isolates the type-level churn from the behavioural change,
so when batch 3 moves numbers, the cause is unambiguous.

## Task

Three changes, all mechanical:

1. `plugin.parse()` returns `AST | ParseRefusal`. Narrow at every call site.
   No plugin returns a refusal yet.
2. `UmlSource.type: DiagramType` becomes `UmlSource.types: ReadonlySet<DiagramType>`,
   populated by T2's `findStartTypes`.
3. **Delete `detectUmlType`** (`block-extractor.ts:267`). It guesses one type
   from `@startuml` content; upstream never guesses.

`resolve()` keeps its `accepts()` scan. Where it previously compared
`source.type`, it now asks whether the plugin's type is **in** `source.types`.
For every non-`@startuml` tag that set is a singleton, so the comparison is
equivalent; for `@startuml` it now names all ten candidates instead of one
guess — and the `accepts()` scan still decides among them, exactly as today.

## Write-set

- `src/core/dispatcher.ts`
- `src/core/block-extractor.ts`
- `src/core/error/error-diagrams.ts`
- `src/index.ts`
- any test asserting `detectUmlType` or `UmlSource.type` directly
- `docs/catalog.md` (regenerate: `npm run catalog`)

## Read-set

- `src/core/parse-refusal.ts` — T1's output
- `src/core/diagram-type-set.ts` — T2's output
- `src/core/dispatcher.ts:236-275` — `resolve()`'s three tiers today
- `src/core/block-extractor.ts:260-330` — `detectUmlType` and its one caller
- `src/core/error/error-diagrams.ts:131` — **read this line carefully.** It
  derives the assumed type for an empty `@startuml` from `block.source.type`.
  Its behaviour must not change; it is acceptance criterion 3

## Interface contracts

Consumed by T4–T12:

```ts
interface UmlSource { readonly types: ReadonlySet<DiagramType>; /* … */ }
parse(source: UmlSource, options?: ParseOptions): AST | ParseRefusal;
```

`source.type` is gone. Do not leave a compatibility alias — a retained alias
would let a later task read the guessed type without noticing it is stale.

## Architecture decisions in force

- [D1](../decisions.md#d1) — refusal returns, never throws
- [D5](../decisions.md#d5) — `detectUmlType` is deleted, not reduced
- **This task does not touch `accepts()` or registration order.** Both belong
  to T12, and moving either here breaks the atomicity D3' requires

## Acceptance criteria

1. *Given* the full suite, *when* it runs, *then* every gate reports the same
   numbers as before this task — routing disagreements 2, refusal coverage 0,
   no ratchet or baseline movement
2. *Given* any `@start` tag, *when* a block is extracted, *then* `source.types`
   equals `findStartTypes` of its first line
3. *Given* an empty `@startuml` block, *when* rendered, *then* the error
   diagram is byte-identical to before — the `error-diagrams.ts:131` path is
   preserved
4. *Given* a plugin's `parse()` result, *when* consumed by `renderSync`, *then*
   the `ParseRefusal` branch is reachable and typechecked, even though no
   plugin produces one yet
5. *Given* `detectUmlType`, *when* grepped for, *then* it has no definition and
   no caller

## Observability

N/A — no new observable operations. Both existing gates must stay pinned;
that pinning **is** this task's evidence.

## Rollback

Reversible — revert the commit.

## Quality bar

All four gates green; routing and refusal gates unchanged. `npm run catalog`
regenerated (drift-gated). Report in the commit body that both gates were
verified unchanged, with their numbers.

## Boundaries

- **Always:** verify both gates are unchanged before committing; that is the
  whole point of this task
- **Ask first:** any change that moves a number
- **Never:** touch `accepts()`, registration order, or any engine's parser;
  leave a `source.type` alias; run Prettier

## Commit

`refactor(T3): widen parse() to refusal, adopt candidate set`

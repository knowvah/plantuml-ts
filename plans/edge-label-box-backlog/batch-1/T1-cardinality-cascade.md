# T1 — Cardinality style cascade

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Read the Java method body and
the constructor that built its inputs before designing anything — not a
filename, not a summary. Every constant you introduce carries its upstream
`file:line` in a comment; no citation means unfinished. **Never fit a value**
to make a number match.

Pure SVG library: no DOM, no async, no Node built-ins in `src/`. Tests are
vitest, co-located conventions per `~/.claude/rules/naming-conventions.md`.

Upstream passes **two** fonts into every edge: `labelFont` for the arrow label
and `cardinalityFont` for multiplicities and roles
(`svek/GraphvizImageBuilder.java:235-241`). This port resolves only one, which
is why `camuna-58-veca254`'s head labels come out `31x13` where the oracle has
`23x10`. This task builds the missing resolution. **It wires no consumer** —
T5 and T6 do that.

## Task

Add a cardinality style cascade that resolves the style signature
`{root, element, <diagram>, arrow, cardinality}` and exposes the resolved font
on the theme, falling through to the plain `arrow` style when no `cardinality`
block is present.

`resolveStyleCascade` and the hierarchical `parseStyleBlock` already exist —
this is wiring, not building. Follow the shape of the existing `ARROW_SNAMES`
cascade in the same file.

## Write-set

- `src/core/style-cascade-class.ts`
- `src/core/theme.ts` — the new resolved field(s) only
- `tests/unit/core/style-cascade-class.test.ts`

Nothing else. If a consumer seems necessary, stop (see Boundaries).

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/GraphvizImageBuilder.java:124-130` — `getStyleArrowCardinality`, the exact signature
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/GraphvizImageBuilder.java:235-241` — both fonts resolved and passed to `SvekEdge`
- `~/git/plantuml/src/main/resources/skin/plantuml.skin` — the `arrow` block (`FontSize 13`); confirm for yourself that no `cardinality` block exists
- `src/core/style-cascade-class.ts:23-44` — the existing `*_SNAMES` cascades, including `ARROW_SNAMES` and its `SvekEdge.java:819` citation
- `src/core/style-map-element.ts#resolveStyleCascade` — the subset-match algorithm
- `test-results/dot-cache/class/camuna-58-veca254/in.puml` — the fixture that overrides `cardinality`

## Architecture decisions

**D3** applies in full — see [decisions.md](../decisions.md#d3--resolve-the-cardinality-font-through-the-existing-style-cascade).
Locked: resolve through the cascade, do not introduce another constant.

## Interface contract (consumed by T5)

```ts
// on the resolved Theme
cardinalityFontSize: number;    // arrow's size when no cardinality block
cardinalityFontFamily: string;
```

Name to match the file's existing conventions if they differ; the contract is
the shape and the fallthrough semantics, not the spelling. Record the final
names in the journal so T5 does not have to guess.

## Acceptance criteria

- **Given** a diagram with no `cardinality` block, **when** the theme
  resolves, **then** the cardinality font size equals the `arrow` style's
  (13 by `plantuml.skin`).
- **Given** `camuna-58-veca254`'s `arrow { cardinality { FontSize 10 } }`,
  **when** the theme resolves, **then** the cardinality font size is 10.
- **Given** a `<style>` block setting only `arrow { FontSize 14 }`, **when**
  the theme resolves, **then** cardinality inherits 14 — the fallthrough is
  through `arrow`, not to the skin default.
- **Given** the cascade lands, **when** `shape-match-report` runs, **then**
  **zero fixtures move** — nothing consumes it yet.

## Quality bar

All four gates before commit: `npm test` (90/90/90 coverage), `npm run
typecheck`, `npm run lint`, `npm run build`. Plus the zero-movement census
above. Log the numbers to `decision-journal.md`.

## Observability

N/A — no new observable operations. The signal is the census showing zero
movement; record it in the journal.

## Rollback

**Reversible** — single commit, no persisted state, no migration.

## Boundaries

- **Always:** cite `GraphvizImageBuilder.java:124-126` on the new cascade
  constant, as the neighbouring cascades do.
- **Ask first:** nothing here should require it.
- **Never:** wire a consumer of the new field in this task; never delete or
  change `CARDINALITY_FONT_SIZE` here (that is T6's, and doing it now moves
  geometry inside a zero-movement batch).

## Commit

`feat(T1): resolve the arrow.cardinality style cascade`

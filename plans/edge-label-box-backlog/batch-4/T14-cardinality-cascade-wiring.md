# T14 — Thread the cardinality cascade to both engines (D3 completion)

> **Added 2026-08-16 with maintainer approval**, after T6 and T7 both stopped
> on the same write-set escape and D3 was left undelivered. Placed in batch 4
> because it is disjoint from T8's write-set and unblocks nothing later.
> See `decision-journal.md`.

## Why this task exists

T1 (`38ec84fb`) built `computeCardinalityFontOverride` in
`src/core/style-cascade-class.ts` and added `cardinalityFontSize?` /
`cardinalityFontFamily?` to `Theme`. **It has zero callers.** T6 and T7 each
wired their engine's quantifier box through `computeQuantifierBox`, but both
had to use a font built from the `CARDINALITY_FONT_SIZE` constant rather than
the resolved cascade, because reaching the override needed files outside their
declared write-sets. Both stopped and logged, which was correct.

The result is that **D3 is half-delivered**: the cascade exists and is never
consulted. `camuna-58-veca254` — M1's flagship fixture, named in the brief's
own evidence table — still fails `labelSizeOk` at `31x13` against oracle
`23x10`. Its `\n`-split half is already fixed by T6; only the font size is
wrong.

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Read the Java method body and
the constructor that built its inputs. Every constant carries its upstream
`file:line`. **Never fit a value.**

Pure SVG: no DOM, no async, no Node built-ins in `src/`. Tests are vitest.

Upstream resolves `cardinalityFont` from the style signature
`{root, element, <diagram>, arrow, cardinality}` via `getStyleArrowCardinality`
(`GraphvizImageBuilder.java:124-126`) and passes it into `SvekEdge`'s
constructor **separately from** `labelFont` (`:235-241`).

## Task

Make the resolved cardinality font reach both engines' quantifier boxes.

**The seam already exists — this is wiring, not building.** `applyStyleMap`
(`src/core/style-map-theme.ts:202`) folds a `StyleMap` into a `Theme`, and T1
already put the two cardinality fields on `Theme`. So the shape is:

1. **Fold** — have the style→theme path call `computeCardinalityFontOverride`
   and merge its result into the returned `Theme`, alongside the existing
   overrides. After this, `theme.cardinalityFontSize` is authoritative.
2. **Read (class)** — `class-dot-graph.ts:371` builds
   `labelFont = { family: theme.fontFamily, size: ARROW_LABEL_FONT_SIZE }` and
   passes it as `font` into `buildDotEdges`. Add a sibling cardinality font
   from the theme and thread it to `computeMultiplicityAttrs`, which T6 left
   reading a constant.
3. **Read (description)** — the same, from `layoutDescription` (which holds
   the theme) through `runLayout` → `buildDotEdges` to
   `applyQualifierLabels` in `link-edge-attrs.ts`, which T7 left measuring at
   `ctx.fontSpec`.

**Do NOT invent a `?? 13` fallback literal.** The `Theme` fields are optional
in the type, but `defaultTheme`/`darkTheme` always set concrete values, so
anything reading through `resolveTheme()` sees a real number. A literal
fallback would be a fitted constant and a stop condition. If you find a path
where the field really can be `undefined`, STOP and report — that is a defect
in T1's contract, not something to paper over.

## Write-set

- `src/core/style-map-theme.ts` — the fold
- `src/diagrams/class/class-dot-graph.ts`
- `src/diagrams/class/class-dot-edges.ts` — parameter threading only
- `src/diagrams/class/class-layout-edge-labels.ts`
- `src/diagrams/description/layout.ts`
- `src/diagrams/description/layout-dot-tree.ts`
- `src/diagrams/description/link-edge-attrs.ts`
- `oracle/goldens/class/label-size-backlog.json`
- plus the test files your change requires

**NEVER touch `src/core/edge-label-box.ts` or
`tests/unit/core/edge-label-box.test.ts`** — T8 is editing both in parallel
with you right now. You need neither: T5's `computeQuantifierBox` already
takes the font as a parameter, which is the whole point of its contract.

The above list is larger than most tasks in this mission because the threading
crosses two engines. **If the fold needs a file not listed, stop and log it**
rather than expanding further.

## Read-set

- `~/git/plantuml/.../svek/GraphvizImageBuilder.java:124-130` —
  `getStyleArrowCardinality`, the exact signature
- `~/git/plantuml/.../svek/GraphvizImageBuilder.java:235-241` — both fonts
  resolved and passed separately into `SvekEdge`
- `src/core/style-cascade-class.ts` — T1's `computeCardinalityFontOverride`
  and `CARDINALITY_SNAMES`, with its `GraphvizImageBuilder.java:124-126`
  citation
- `src/core/style-map-theme.ts:202` — `applyStyleMap`, the fold seam
- `src/core/theme.ts` — the two optional fields and their skin citations
- `src/diagrams/class/class-dot-graph.ts:365-378` — where `labelFont` is built
- `src/diagrams/class/class-layout-edge-labels.ts` —
  `computeMultiplicityAttrs`, and the doc block T6 rewrote which explains
  precisely why the cascade is not read there yet
- `src/diagrams/description/link-edge-attrs.ts` — `applyQualifierLabels`, and
  the doc comment T7 left naming this same gap
- `test-results/dot-cache/class/camuna-58-veca254/in.puml` — the fixture
- `decisions.md#d3--resolve-the-cardinality-font-through-the-existing-style-cascade`
- `decisions.md#d4--backlog-shrink-is-the-bar-no-fixture-may-rise`

## Architecture decisions

**D3** — this task is what makes D3 true. The font comes from the cascade; the
`CARDINALITY_FONT_SIZE` constant remains only as the skin default's home, not
as the value the engines read when a diagram overrides it.
**D4** — no fixture may rise.

Both locked.

## Slugs this should clear

`class/camuna-58-veca254` and `class/nafiki-56-jixu680` — the only two fixtures
in the entire corpus that override `arrow.cardinality`. Verify that claim
yourself with a corpus grep before relying on it.

Expected for camuna: head labels `31x13` → **23x10**, and its second head
label already reads two lines from T6's `\n` split.

**camuna may still fail on its main `label`** (`oracle=29x16 ours=27x15`),
which is a different mechanism and not yours. If so, it stays in the backlog —
report it, do not chase it, and do not remove the slug.

## Acceptance criteria

- **Given** a diagram with no `cardinality` block, **when** the theme resolves,
  **then** the cardinality font is the arrow style's and **no fixture moves**.
- **Given** `camuna-58-veca254`'s `arrow { cardinality { FontSize 10 } }`,
  **when** its quantifier boxes are measured, **then** they use size 10.
- **Given** a `<style>` block setting only `arrow { FontSize 14 }`, **then**
  cardinality inherits 14 — the fallthrough is through `arrow`, not to the skin
  default. (T1 proved this needs no explicit fallback code; confirm it survives
  the fold.)
- **Given** every backlog removal, **then** the slug demonstrably passes
  `labelSizeOk` — verified with the triage instrument.
- **Given** `shape-match-report`, **then** **no fixture rises**.

## Quality bar

All four gates: `npm test` (90/90/90), `npm run typecheck`, `npm run lint`,
`npm run build`. Then:

```
npx jiti scripts/dot-sync-report.ts class state component usecase object
npx jiti scripts/shape-match-report.ts
npx jiti scripts/label-box-triage.ts
```

Baselines to hold or beat: DOT EQUAL class **681**, state **259**,
component **257**, usecase **88**, object **77**. Census
`TOTAL doc-size-exact: 779/1074`, `TOTAL matched-shapes: 25975` — no fixture
may rise. Backlogs at start: class 28, description 10, state 9, object 1.

## Observability

All five DOT EQUAL counts, the class backlog count, the census delta, and the
ratchet pin status. Journal every one.

## Rollback

**Reversible** — one commit.

## Boundaries

- **Always:** read the resolved value through the theme; never a literal.
- **Always:** verify a slug passes before removing it from a backlog.
- **Ask first:** if the fold turns out to need a file outside the write-set.
- **Never:** touch `src/core/edge-label-box.ts` — T8 owns it right now.
- **Never:** add a slug to any backlog; that is a stop condition.
- **Never:** chase camuna's main-`label` mismatch. Different mechanism.

## Commit

`fix(T14): resolve the cardinality font through the style cascade`

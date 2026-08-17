# T5 — Class engine: arrow-label font for measurement and SVG

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Every constant carries its
upstream `file:line`. **Never fit a value.** Pure SVG; tests are vitest.

T2 built `resolveArrowLabelFont(theme): FontSpec` (`src/core/arrow-label-
font.ts`, D3) mirroring `GraphvizImageBuilder.java:234-235`. The class engine
still measures the main edge label at the constant `ARROW_LABEL_FONT_SIZE`
(`class-dot-graph.ts:372`, `labelFont`) and draws it at a constant in
`renderer-edge.ts` (find the label `<text>` font attributes there — the
cardinality path at `:294,303` uses `CARDINALITY_FONT_SIZE`; the main-label
path is nearby). Two slugs:

- `camuna-58-veca254`: `<style> arrow { FontSize 14  FontStyle bold }`; oracle
  29x16, ours 27x15.
- `ticuxa-26-tixo262`: `skinparam ClassArrowFontSize 58 / ClassArrowFontName
  Courier / ClassArrowFontStyle Italic`; `toto` → 96.425 + 2 = **98** wide,
  58 + 2 = **60** tall (planning measurement with `WidthTableMeasurer`).

## Task

1. `class-dot-graph.ts:372`: `labelFont = resolveArrowLabelFont(theme)`. This
   flows into `buildDotEdges` → `computeRelLabelAttrs` → every main-label
   measurement (multi-line, magic-arrow, visibility, note-merge arms). Confirm
   the `FontSpec` `weight/style` reach the measurer calls (they take a `font`
   object — check the parameter type is `FontSpec`, not `{family,size}`; widen
   the type if needed, in files already in the write-set — else stop and log).
2. `renderer-edge.ts`: the main-label `<text>` uses the same resolved font —
   `font-size`, `font-family`, and `font-weight="bold"` / `font-style="italic"`
   when set (match how the port already emits bold/italic elsewhere; grep
   `font-weight` in `src/core/svg.ts`).
3. Verify `camuna`'s bold width against upstream's `StringBounderFromWidthTable`
   (T4 already had to — read T4's journal row; if T4 stopped on stop 10, so do
   you).
4. Remove `camuna`, `ticuxa` from the class backlog as each passes. If
   `camuna` clears on size but not on some other term, journal the residual —
   its `arrow.cardinality { FontSize 10 }` head labels were fixed by SI23's
   T14, so a residual is a new mechanism.
5. Fix the stale `class-layout-edge-labels.ts:54` comment ("builds the label
   font at `ARROW_LABEL_FONT_SIZE`") if T4 left it.

## Write-set

- `src/diagrams/class/class-dot-graph.ts`, `src/diagrams/class/renderer-edge.ts`
- `src/diagrams/class/class-layout-edge-labels.ts` (comment/type-widening only)
- existing `tests/unit/class/*.test.ts`
- `oracle/goldens/class/label-size-backlog.json`

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/GraphvizImageBuilder.java:225-245`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/StringBounderFromWidthTable.java`
- `src/core/arrow-label-font.ts` (T2's contract), `src/core/measurer.ts:12-22`
- `src/diagrams/class/class-dot-graph.ts:355-400`, `class-dot-edges.ts:80-100`, `class-layout-edge-labels.ts:40-60,290-330`, `renderer-edge.ts:240-320`
- `src/core/svg.ts` (text attribute helpers)
- `decisions.md#d3`, `#d4`, `#arrow-main-label-font-camuna-zosuje-ticuxa`
- `test-results/dot-cache/class/{camuna-58-veca254,ticuxa-26-tixo262}/in.puml`

## Architecture decisions

D3 (consume the resolver, read no field directly), D4 (both sites, one commit).

## Acceptance criteria

- **Given** `camuna`, **when** the DOT gate runs, **then** the main label is
  29x16 and the SVG `<text>` carries `font-size="14"` + `font-weight="bold"`;
  slug leaves the backlog.
- **Given** `ticuxa`, **then** 98x60 and SVG font-size 58 / Courier / italic;
  leaves the backlog.
- **Given** any class fixture with no arrow font override, **then** DOT and
  SVG are byte-identical to before (pin one in a test).
- **Given** the class SVG ratchet, **then** pins hold or move toward jar,
  journalled.

## Quality bar

Four gates; `dot-sync-report class`, `shape-match-report`, `label-box-triage`.

## Observability

Class DOT EQUAL, class backlog (7 → 5), census delta, class ratchet.

## Rollback

Reversible — one commit.

## Boundaries

- **Never** read `theme.colors.graph.arrowFont*` directly — only via the resolver.
- **Never** change the cardinality font path (T14's).
- **Stop** on stop 10.

## Commit

`fix(T5): class edge labels measure and draw at the resolved arrow font`

# T7 — State engine: arrow-label font (optional; zero movement without override)

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Every constant carries its
upstream `file:line`. **Never fit a value.** Pure SVG; tests are vitest.

No state slug is in the backlog for this mechanism; this task exists so the
three svek engines agree on where the arrow font comes from (D3/D4). The state
engine builds `{family: theme.fontFamily, size: ARROW_LABEL_FONT_SIZE}` at six
sites: `layout.ts:153`, `state-dot-graph.ts:264`,
`state-composite-autonom.ts:160`, `state-composite-pass.ts:282`,
`state-composite-pass-edges.ts:108,201`, and draws at
`state-renderer-transitions.ts:173`. **Skip this task** (push-forward, journal
it) if Batch 3 time is better spent; the sites stay named in the close-out.

## Task

1. For each site, confirm from the Java that the font upstream is the
   `FontParam.ARROW` / `arrow` style font (`GraphvizImageBuilder.java:234-235`
   for `SvekEdge`; composite/autonom paths — read
   `svek/image/EntityImageState*` / the cluster label construction and cite).
   **Stop** at any site whose upstream font is not the arrow font — do not
   swap it.
2. Replace with `resolveArrowLabelFont(theme)`; renderer draws at the same.
3. Prove zero movement: state DOT 266/268 unchanged, 59 pins byte-identical.

## Write-set

- `src/diagrams/state/layout.ts`, `state-dot-graph.ts`,
  `state-composite-autonom.ts`, `state-composite-pass.ts`,
  `state-composite-pass-edges.ts`, `state-renderer-transitions.ts`
- existing `tests/unit/state/*.test.ts`

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/GraphvizImageBuilder.java:225-245`
- The upstream file each of the six sites cites in its own comment (they name them)
- `src/core/arrow-label-font.ts`; `decisions.md#d3`, `#d4`

## Acceptance criteria

- **Given** no override, **then** state DOT + SVG byte-identical (59 pins hold, 266/268).
- **Given** `<style> arrow { FontSize 20 }` on a transition, **then** the DOT
  box and the SVG font agree (new unit test, no fixture).
- **Stop** rather than fit if any site's constant is not the arrow font upstream.

## Quality bar

Four gates; `dot-sync-report state`; `shape-match-report`.

## Observability / Rollback

State DOT EQUAL, pins. Reversible — one commit.

## Commit

`refactor(T7): state edge labels resolve the arrow font through the shared resolver`

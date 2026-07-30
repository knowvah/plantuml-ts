# T6 — `SvgNanoParser` part 1: data extraction, dispatch, `<g>` stack, `drawPath`

## Context

See [`../README.md`](../README.md) for the mission mechanism (jar-verified —
do not re-derive).

This is the class the whole mission is named for. Upstream's
`SvgNanoParser.drawU` (`svg/parser/SvgNanoParser.java:135-166`) walks the raw
SVG and draws each `<path>` / `<circle>` / `<ellipse>` as its OWN primitive.
That is what gives `Footprint.drawPath` a genuine per-path ink signal
independent of `AtomSprite.calculateDimensionSlow`'s declared box. This port
has no equivalent, which is why ink and layout share a channel.

**Note the package:** `svg/parser/SvgNanoParser.java` — NOT `klimt/sprite/`.
Reading `klimt/sprite/SpriteSvg.java` and generalising from it is exactly what
produced the second wrong correction in this mission line; that file serves
inline `sprite $name {...}` blocks these fixtures never touch.

The class is 522 lines, split across T6 (this task) and T8 to stay near the
5–15 min target. **T6 is the skeleton and the path branch; T8 adds circle,
ellipse, text, and the fill/stroke/transform mutators.** Structure the file so
T8 adds branches without restructuring what you write.

## Task

Port the following from
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgNanoParser.java`
to `src/core/klimt/sprite/SvgNanoParser.ts`:

- the element-extraction regex and `getData()` (`:167-186`)
- `drawU`'s dispatch loop and the `<g>` push/pop stack discipline
  (`:135-166`)
- `drawPath` (`:364-376`) — which delegates to T1's `SvgPath`
- constructor, `minGray`/`maxGray` fields, `extract()` helper

Leave `drawCircle`, `drawEllipse`, `drawText`, `applyFillAndStroke`,
`applyTransform` as clearly-marked stubs for T8 — but wire their dispatch
branches now so T8 only fills bodies.

## Write-set

- `src/core/klimt/sprite/SvgNanoParser.ts` (create)
- `src/core/klimt/sprite/SvgNanoParser.test.ts` (create)

## Read-set

- `~/git/plantuml/.../svg/parser/SvgNanoParser.java` — read ALL 522 lines
  before designing, even though you implement half. T8 depends on your
  structure.
- `~/git/plantuml/.../svg/parser/SvgSpriteParserFactory.java` (123) — how the
  parser is selected
- `src/core/klimt/sprite/SvgPath.ts` — T1's parser
- `src/core/klimt/UGraphicWithScale.ts` — T3's stack element
- `src/core/klimt/sprite/ColorResolver.ts` — T2's resolver
- `src/core/klimt/sprite/SpriteSvg.ts` — the existing SVG-sprite registry
  entry; read-only here

## Architecture decisions (locked)

- [ADR-1](../decisions.md#adr-1) — use T1's `SvgPath`; do NOT write a second
  path reader inside this class. Upstream's `drawPath` delegates
  (`:373`), and so must this.
- [ADR-4](../decisions.md#adr-4) — full-class port; `drawEllipse` is in scope
  in T8 despite 0 corpus reach.

## Interface contract

Consumed by T8 (same file) and T9:

```ts
export class SvgNanoParser {
  constructor(svg: string);
  drawU(ug: UGraphic, scale: number, fontColor: HColor, forcedColor: HColor): void;
}
```

T9 needs a way to obtain the decomposed primitives rather than draw them to a
live `UGraphic`. Decide that shape here and document it — a collecting
`UGraphic` implementation is the port's existing idiom (see
`src/core/klimt/drawing/LimitFinder.ts`, which already collects `UPath`
draws). **Prefer reusing that idiom over inventing a parallel collector.**

## Acceptance criteria

1. Given a bootstrap sprite's SVG, when `getData()` runs, then it yields
   exactly the `<path>` / `<g>` / `</g>` / `<circle>` / `<ellipse>` /
   `<text>` elements in document order, and silently ignores `<svg>` /
   `</svg>`.
2. Given nested `<g>` elements, when walked, then push/pop restores the
   graphic pushed at that depth and `stackG` tracks the raw group strings in
   parallel (`getFillString` needs the strings, not just the graphics).
3. Given a single-`<path>` sprite, when drawn, then exactly ONE `UPath`
   primitive is produced and its minmax equals `pathBBox` of the same `d`.
4. Given `bi-globe`, when decomposed, then the union of its primitives'
   minmax reproduces the box `svgInkBox` computes today.
5. Given an unrecognised element, then it is ignored rather than throwing —
   matching upstream's `TRACE`-only branch.

## Quality bar

All four gates exit 0. SVG goldens 310/23/57 byte-identical (nothing consumes
this class yet). TDD, coverage 90/90/90.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — new file, no production consumer until T9.

## Boundaries

**Always:** port faithfully including branches that look redundant (CLAUDE.md:
do not refactor while porting). `@see` the Java origin on every ported symbol.
Structure for T8's additions.

**Never:** write a second path parser here (ADR-1). Never implement
`drawCircle`/`drawEllipse`/`drawText` in this task — that is T8's write-set
on the same file, and doing it early collides.

## Method rules

1. **Trace two dependency levels** before ruling on scope — in particular,
   before deciding the collector shape for T9, check what `LimitFinder`
   already does and what `UGraphic` requires of an implementation.
2. **Verify any "already wired" claim against the CURRENT call graph.** If
   you conclude "this port has no X", grep for X first. That claim has been
   wrong before in this codebase.

## Commit

One commit: `feat(T6): port SvgNanoParser dispatch, group stack, and drawPath`

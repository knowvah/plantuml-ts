## Observation: ISkinSimple cannot declare a member named `getHyperlinkColor`
- **Context**: T1b (cdd6, batch-1) D3 — adding a style-cascade hyperlink
  colour accessor to `src/core/style/ISkinSimple.ts`.
- **Finding**: `src/core/abel/ISkinParam.ts` already declares a REAL,
  consumed `getHyperlinkColor(): HColor` (`abel/Entity.ts:170`, feeding
  the separate "richer" `abel/FontConfiguration.ts`).
  `src/core/cucadiagram/MethodsOrFieldsAreaConfig.ts`'s
  `MethodsOrFieldsAreaSkinParam extends ISkinParam, ISkinSimple`. Adding
  a member of the same name but a different (incompatible) return type
  to `ISkinSimple` is a confirmed `TS2320` "cannot simultaneously extend"
  error — verified with a minimal `interface C extends A, B` repro
  outside the project's tsconfig (`tsc --noEmit --strict repro.ts` from
  a directory with no tsconfig). Landed the new member as
  `getStyleHyperlinkColor` instead.
- **Impact**: any future task adding a member to `ISkinSimple` should
  first grep `abel/ISkinParam.ts` for a same-named member — the two
  interfaces are merged by `MethodsOrFieldsAreaSkinParam` and a name
  collision is a hard compile error, not a lint warning.
- **Confidence**: High (reproduced with `tsc`, not inferred).

## Observation: the hyperlink-colour and sprite-ambient-stroke producers live outside every plausible T1b write-set
- **Context**: T1b's two mechanisms (D3 hyperlink colour, sprite ambient
  stroke) both needed a "producer" site — somewhere that resolves a
  per-classifier/per-symbol value and injects it into the initial
  `FontConfiguration`/collector seed — traced during this task.
- **Finding**: 
  - Hyperlink colour, diagram title path: `src/core/annotations/
    chrome.ts#buildMainframeTitleBlock` / `blocks.ts#buildAnnotationBlock`
    build `ChromeTextPaint`/`AnnotationBoxStyle`; neither has a
    `hyperlinkColor` field, and `AnnotationBoxStyle`
    (`annotation-style-types.ts`) would need one.
  - Hyperlink colour, classifier/member path: `src/core/decoration/
    symbol/usymbol-resolve.ts#textFont` builds `FontConfiguration` from
    `Theme` (`color: textFontColor(theme, symbol)`); would need a
    `theme.colors.graph.class*HyperlinkColor`-shaped cascade field
    computed in `style-cascade-class*.ts`.
  - Sprite ambient stroke: `src/diagrams/description/renderer-entity.ts
    :252-254` already computes the exact ambient value
    (`resolveElementLineThickness(theme, node.symbol) ??
    ENTITY_STROKE_WIDTH`, stored as `paint.stroke`) but its
    `atomImageResolverFor: makeAtomImageResolverFor(sprites)` call at
    line 269 doesn't forward it.
  - `unknown/jefidu-98-gisu131`/`sprite-SVG-Fill-Stroke-Combinatory-1`
    are `card X [ ... ]` markdown-table fixtures (SALT-in-card), NOT
    class-diagram member rows — they route through the DESCRIPTION
    engine's `buildDesc`/`descAtomOps`, not `class-member-creole.ts`.
- **Impact**: a follow-on task closing these rows at the render level
  needs write access to `renderer-entity.ts` (sprite stroke, one-line
  fix) and either `chrome.ts`+`annotation-style-types.ts` (title
  hyperlink colour) or `usymbol-resolve.ts`+`theme.ts`+
  `style-cascade-class*.ts` (classifier hyperlink colour) — none of
  which were in T1b's write-set. The consumer-side infrastructure (this
  task) is fully landed and tested; only the producer wiring remains.
- **Confidence**: High (each file:line read directly, not inferred from
  a ledger).

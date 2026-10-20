## Observation: a new sequence geo kind needs geo.ts, not geo-frame.ts
- **Context**: sdd1 T3f, putting each `else` into the geo event stream.
- **Finding**: the `EventGeo` union is declared in `src/diagrams/sequence/geo.ts`
  (the aggregate module), not in `geo-frame.ts` or `ast.ts`. A new kind
  (`ElseGeo`) is defined in its renderer's geo module but must be added to the
  union in `geo.ts`; `scale-geo.ts` and `sequence-page.ts` switch on every kind
  exhaustively, `layout.ts` and `sequence-shadow.ts` have `default` arms.
- **Impact**: a brief that adds a geo kind must list `geo.ts` in the write-set.
- **Confidence**: High.

## Observation: no per-line legacy skinparam store on the sequence path
- **Context**: sdd1 T3f item 3, `sequenceGroupBodyBackgroundColor`.
- **Finding**: `SequenceDiagram#grouping` reads `getSkinParam().getHtmlColor
  (ColorParam.sequenceGroupBodyBackground, null, false)` at the command
  (`SequenceDiagram.java:418-419`), i.e. `SkinParam#getValue` over the `params`
  map `setParam` fills (`SkinParam.java:228-229,326-340,371-396`). The style
  `SkinParam` the sequence dispatch replays per command
  (`src/core/style/mindmap-style-builder.ts`) has no `params`/`getValue`; wbs
  keeps its own diagram-local one (`wbs-skin-param.ts`).
- **Impact**: any legacy `ColorParam`/`getValue` read at a sequence command
  needs that store first (core/style additive port, or a sequence-local one).
- **Confidence**: High.

## Observation: `group T [c]` keeps the title's trailing space, measured
- **Context**: sdd1 T3f item 4, jar probe `group Title [the comment]`.
- **Finding**: `CommandGrouping` takes `m.group(1)` verbatim
  (`CommandGrouping.java:143-148`), so the title is `"Title "`. The jar's tab is
  45 + 28.194 wide while the drawn `textLength` is 24.619: the space is
  measured, not drawn. `group [c]` has an empty title, a `TextBlockEmpty`
  (`AbstractTextualComponent.java:87-88`): the tab is 45 by 2.
- **Impact**: never trim the rewritten title.
- **Confidence**: High (jar probe).

## Observation: a transparent outer FontColor is not restored after `</color>`
- **Context**: sdd1 T3f, pizupi-41 residual after items 4 and 6.
- **Finding**: with `group { FontColor transparent }`, the comment
  `[<color:#0>…</color>]` draws only the inner run in the jar; the port also
  draws the closing `]` in `#000` (`sequence-creole` run colour after the
  closing tag). Separately, the jar draws the tab title `⠁⠇⠞` in `#000` under
  `!theme plain`, where the port's header paint is transparent and skips it.
- **Impact**: two open pizupi-41 mechanisms outside the frame renderer
  (creole colour stack; group header style under `!theme plain`). Neither is
  diagnosed to a line yet.
- **Confidence**: Medium (observed output only; the Java chains not traced).

# T3h — style wiring (wave 2)

Agent: typescript-pro, worktree `add2-T3h`. Rules: [overview](overview.md) +
[../batch-1p/common.md](../batch-1p/common.md).

## Context
Core fields landed but are unconsumed (journal rows 32, 37, 41):
- F hyperlinkUnderline / svgLinkTarget (`theme.hyperlinkUnderline`,
  `theme.svgLinkTarget`, T3e) -> `activity-renderer-shapes.ts#renderAction` must
  forward them into the `ActivityTextStyle` it builds (pekuxe, gaxezi, nisexe).
- K `activityFontFamily(theme, sname)` (T3e, `FromSkinparamToStyle.java:144`) ->
  call sites `activity-renderer-shapes.ts:135,155`, `activity-renderer-if-shapes.ts`
  (dozaxu).
- DARK: `activity-style-defaults.ts` never reads `theme.colors.background/
  border/text` (`TitledDiagram.java:291-294`; levuma).
- PAINT: `acc.activityBackground` string -> Paint through the core handler +
  `theme.colors.graph.activity.background` to `actColors`/`renderAction`
  (dakesa; shares of cigagu/gudute). D9: one style path.
- CSTYLE on if rows (carapo): wire `theme.conditionStyle` in
  `conditional-builder.ts` to `GtileDiamondSquare` via `DiamondConditionTile`
  (`ConditionalBuilder.getShape1` `:251-277`); repeat rows are T3f's.
Read .agent-notes/T2c-style-core.md, T3e.md, T3d.md.

## Task
Per item: quote the Java, wire the consumer, pin with a test; measure probe Σ
and elements. Shared core: survey class/state/sequence/component/usecase/
mindmap/object/activity before/after SEQUENTIALLY; any conformant loss = stop.

## Write-set
`activity-renderer-shapes.ts` EXCEPT `renderComposite` (T3g),
`activity-renderer-if-shapes.ts`, `activity-style-defaults*.ts`,
`activity-text-style.ts`, `src/core/{theme*,skinparam-*}.ts`,
`layout/conditional-builder.ts`, `tiles/{gtile-if-down,gtile-if-with-links,gtile-diamond*}.ts`,
their tests. Anything else: stop and report.

## Acceptance
- Each named row's family diffs gone, or re-slotted with mechanism.
- 0 unexplained risers; 206 pinned goldens byte-equal; harness-parity green.

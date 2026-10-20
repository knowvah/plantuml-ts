# sdd1 T2a — observations

## Observation: a transparent style colour reaches klimt as `#00000000`, not `'none'`
- **Context**: participant glyphs painted from `paintOf(style)` (`sequence-skin-param.ts#svgPaint`).
- **Finding**: `toSvgPaint(HColors.none())` spells transparent `#00000000`; the
  port's klimt layer spells it `'none'` (`ActorStickMan.ts:28-33` applies
  `new Back('none')`). `driver-path-svg.ts#paintsEqual` compares strings, so
  `Bordercolor none` drew `style="stroke:none;"` on actor/boundary paths where
  the jar's `color.equals(back)` (`DriverPathSvg.java:64-68`) draws no style.
  Rects are unaffected (svg writer maps both to `none`).
- **Impact**: every family that hands `paint.stroke`/`paint.fill` to a klimt
  `SymbolContext` must map `#00000000` to `'none'` (T2a does it in
  `renderer-participant-symbol.ts#klimtPaint`), or fix `svgPaint` once.
- **Confidence**: High (mozege-45-jatu623 measured both ways).

## Observation: `#?light:dark` FontColor throws on `asColor`
- **Context**: participant name font from the merged style.
- **Finding**: `HColorSet.ts#parseScheme` throws `unported: HColorScheme`, so
  `paintOf(style).font` throws for `root { FontColor #?black:white }`
  (duzico/gazave/solivu/zerovu went to error rows). The string-level
  `resolveConditionalColor` exists; resolving FontColor against the text's
  back and overriding it with `Style#eventuallyOverride(Colors TEXT)` mirrors
  `FontConfiguration#adjustColorForBackground` (`FontConfiguration.java:349-356`)
  without touching klimt. `automatic` (`HColorAutomagic`) needs the same, and
  the bridge (`FontConfigurationBridge.ts`) throws on any non-simple colour.
- **Impact**: every family reading `paint.font` will hit this on those fixtures.
- **Confidence**: High.

## Observation: `Stereotype.build(label)` keeps the badge spec in the style name
- **Context**: `participantStyle(..., stereotype)`.
- **Finding**: the 1-arg build uses `buildSimple`, so `<< ($Sprite, #C) Name >>`
  styles as `($Sprite, #C) Name`; upstream participants use the 4-arg build
  (`CommandParticipant.java:176-181`, `buildComplex`), which strips it. Use
  `Stereotype.build(label, 0, undefined, parseSimpleColor)`.
- **Impact**: `.Name { ShowStereotype false }` etc. silently miss otherwise
  (cexeco-21-piga007).
- **Confidence**: High.

## Observation: participant label geometry still off for glyph kinds and queue
- **Context**: classify after T2a; paint diffs gone, text diffs remain.
- **Finding**: actor/boundary/control/entity/database labels sit 3 right and
  4 off vertically: upstream draws the text block at
  `getTextMiddlePostion = (prefW - textW) / 2` with `textW` including the
  (0,3,0,3) padding but no padding translate (`ComponentRoseActor.java:73-81`),
  and the head text top is `glyphH` below the block top (tail: at the top);
  the port centres on `centerX` and uses `fontSize / 2 + 4`
  (`sequence-layout-participant-sizing.ts#participantLabelCy`). `queue` text
  is 5 left of the port's (`USymbolQueue` margin x1 = 5, not centred).
- **Impact**: geometry cohort (sdd2), present in nearly every glyph-kind fixture.
- **Confidence**: High for the measured offsets; Medium for the queue derivation.

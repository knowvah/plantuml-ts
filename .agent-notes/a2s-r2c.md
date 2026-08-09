# A2s round 2 — R2c observations

## Observation: AtomText 10px line floor is a shared mechanism
- **Context**: sovuxo-25 dummy height delta (56 vs 58) diagnosis.
- **Finding**: `AtomText.java:179-181` (`if (h < 10) h = 10;`) floors EVERY
  creole text line's height. Jar-verified on member rows
  (classAttributeFontSize 6|8|10 all advance 10px/row), header name lines
  (hide circle + classFontSize 6 → 20px header term), stereotype rows
  (classStereotypeFontSize 6 → 12 = 10+2 block), and generic-tag lines
  (4-line generic at 6pt → 44 = 4*10+4). R2c added
  `atomTextLineHeight()` (class-stereotype-layout.ts) for member rows /
  header lines / generic-tag lines; a concurrent R2f change added the
  equivalent `stereoLineHeight()` in class-stereotype.ts for stereo rows —
  two helpers, one upstream mechanism (dedupe candidate, needs a
  class-stereotype.ts owner).
- **Impact**: any sub-10pt class font path must use the floor.
- **Confidence**: High (jar probes in scratchpad R2c/ps/).

## Observation: `skinparam defaultFontSize` EXPLICIT-set differs from default 14
- **Context**: mizupo-59 (!theme aws-orange) diagnosis (STOPPED).
- **Finding**: upstream `SkinParam#getFontSize` (SkinParam.java:441-448)
  resolves per-param skinparam → `defaultfontsize` value → FontParam
  hardcoded default. So an EXPLICIT `defaultFontSize 14` changes
  CIRCLED_CHARACTER from 17 to 14 (radius 11 → 10, bare class 48 → 46px,
  jar-verified) even though 14 equals the port's `theme.fontSize` default.
  `Theme` has no field distinguishing explicit defaultFontSize from the
  14 default — one must be added before the class-side reads can be fixed.
- **Impact**: aws-orange theme fix needs core plumbing (see R2c report).
- **Confidence**: High (jar probes pm/, pm14/).

## Observation: gated USymbol-naming package stereotype is DROPPED, not stored
- **Context**: daxeno-00 (<<Database>> empty package) diagnosis (STOPPED).
- **Finding**: `setNamespaceStereotype` (class-container.ts, gated branch)
  returns without recording anything when the stereotype names a USymbol;
  upstream `CommandPackage.java:179-183` passes
  `USymbols.fromString(stereotype,...)` to `gotoGroup` as the group's
  USymbol. Storing it in `state.descriptiveContainers` would let the
  existing `closeContainer` collapse + `tryMeasureDescriptionLeaf` →
  `measureLeafNode` path size it — verified: the description engine
  reproduces daxeno's golden node byte-exact (1.575694x0.847222in) for the
  identical `database "<size:18>styled</size>\nshould be styled"` input.
- **Impact**: daxeno closes with a class-container.ts-only change (R2d's
  write-set) + a USYMBOL_NAMES→keyword mapping.
- **Confidence**: High (jar + port probes pc/).

# sep-T1c: salt element base

## Observation: `Splitter.htmlTag` / `purgeAllTag` have no port
- **Context**: porting `AbstractElementText.java:70` (`getCharNumber`, used when `manageLength` is true — every `"text   "` textfield).
- **Finding**: `klimt/creole/command/Splitter.java:84-122` assembles `htmlTag` from every `FontStyle#getRegexActivationPattern`/`getRegexDeactivationPattern` plus the font/color/size/sup/sub/qrcode/img/font-family/link/svg-attribute patterns; `purgeAllTag` (`:140-142`) is `s.replaceAll(htmlTag, "")`. The port has no `Splitter.ts`; the individual patterns exist only as source strings inside `CommandCreole*.ts`, and `FontStyle#getRegexActivationPattern` is NOT ported (`CommandCreoleStyle.ts` uses the UBREX patterns instead, by design). `src/diagrams/salt/element/AbstractElementText.ts:34` throws `unported: Splitter.purgeAllTag` until this lands.
- **Impact**: jar data for the eventual test: `"**Bold** <color:red>red</color> //it//"` reserves 152 px = 19 chars × 8 (so `purgeAllTag` strips `<color:…>`/`</color>` but keeps `**` and `//`); `"MyName   "` reserves 72 px = 9 × 8 (`vizono-80-vipa581`).
- **Confidence**: High

## Observation: `UFontFactory.byDefault`/`sansSerif` are not ported
- **Context**: 12 salt factories and `ElementPyramid.java:78` call `UFontFactory.byDefault(n)`.
- **Finding**: `src/core/klimt/font/UFontFactory.ts` ports only `build`; its doc says the shortcuts are not ported. Upstream `byDefault(size)` returns `sansSerif(12)` and IGNORES `size` (`UFontFactory.java:66-68`), so `ElementPyramid`'s `byDefault(10)` title is 12 pt.
- **Impact**: batch-2/3 callers need the shortcut in klimt, not a salt-local 12.
- **Confidence**: High

## Observation: `FontConfiguration.blackBlueTrue` has no klimt home
- **Context**: `AbstractElement.java:82`, `ElementText.java:58`, `ElementRadioCheckbox.java:69`, `ElementMenuEntry.java:58`, `ElementPyramid.java:78`.
- **Finding**: upstream is a 3-line static (`FontConfiguration.java:63-65`: `create(font, BLACK, BLUE, true)`); the T1c port composes it inside `AbstractElement.ts#blackBlueTrue` from the existing `abel/FontConfiguration.create` + `bridgeFontConfiguration`. Flagged for the maintainer: it is composition, not re-implementation, but it lives in salt rather than beside the other `FontConfiguration` statics.
- **Confidence**: High

## Observation: jar pin for `ElementText("Login")`
- **Finding**: preferred dimension 29.4 × 12 under the deterministic measurer; 29.4 is the `textLength` in `vizono-80-vipa581`, the 12 is the 14-px row pitch minus 2 (`ElementPyramid.java:146`).
- **Confidence**: High

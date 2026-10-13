# wep-T5a: creole URL grammar, hyperlink style, xlink:title crash

## Observation: the string-path `<a>` emitter has no getXlinkTitle
- **Context**: porting `SvgGraphics.java:1147-1161` `getXlinkTitle` crash semantics into `klimt/drawing/svg/svg-graphics.ts`.
- **Finding**: `src/core/svg.ts#linkWrap` (used by class/state/description string renderers) writes `url.tooltip` verbatim into `title`/`xlink:title`: no `<U+XXXX>` decode, no `\n` -> newline, and no `IllegalArgumentException` for a decoded `\` / `$`. Only the klimt `SvgGraphics.LinkData` path (wbs, mindmap, salt, activity tiles) mirrors the Java now.
- **Impact**: a `[[... {tip <U+0041>}]]` tooltip or a crash-inducing `<U+005C>` tooltip on a string-path engine diverges from the jar (draws instead of crashing). No corpus row measured for it.
- **Confidence**: High (code read); reach unmeasured

## Observation: creole links carry no `skinparam topurl`
- **Context**: re-mirroring `CommandCreoleUrl.java:73-82`, which builds `new UrlBuilder(stripe.getSkinParam().getValue("topurl"), UrlMode.STRICT)`.
- **Finding**: the port's `StripeBuilder` (`klimt/creole/command/Command.ts`) exposes no skin param, so `CommandCreoleUrl.ts` passes `topurl = null`; a relative creole link never gets the `topurl` prefix. `Theme.topurl` exists (cdd-T34) but is not reachable from the creole command.
- **Impact**: a diagram with `skinparam topurl` and a relative `[[link]]` in creole text diverges in `href`. Fix needs `Command.ts`/`StripeSimple.ts` to carry the value.
- **Confidence**: High

## Observation: the DriverTextSvg underline gate also NPEs upstream
- **Context**: `DriverTextSvg.java:133-134` `getUnderlineStroke().getThickness() > 0`.
- **Finding**: `getUnderlineStroke()` returns `hyperlinkUnderlineStroke` (FontConfiguration.java:386-388), which `SkinParam.useUnderlineForHyperlink()` sets to `null` under `skinparam hyperlinkUnderline false` (SkinParam.java:1057-1061). Any `<u>`/`__` text there NPEs in the jar. The port now throws the same (`driver-text-svg.ts#underlineGate`); the activity engine is the only one that sets the stroke to `null` (`activity-text-sheet.ts:114`, `activity-creole-sheet.ts:159`). No corpus row combines the two (4 activity rows set `hyperlinkUnderline false`, none uses `<u>`).
- **Confidence**: High

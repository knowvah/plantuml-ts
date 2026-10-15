## Observation: bare `skinparam borderColor` has no upstream meaning
- **Context**: diduxa-76-zimu664 drew orange strokes where the jar draws #181818.
- **Finding**: `FromSkinparamToStyle.knowledge` has no un-prefixed `bordercolor` (only `<sname>BorderColor`, :273) and `skin/ColorParam.java` has no `border` member. The port's `bordercolor` handler set `colors.border`, which `resolveElementPaint` uses as the border fallback. `build-theme.ts#rootCascadeSkinparams` also fed `<style> root { LineColor }` through that same key, so it now uses the internal `ROOT_LINE_COLOR_KEY` instead.
- **Impact**: a user's bare `borderColor` now lands in `unknown[]` in every diagram type. Only diduxa uses it in the oracle cache.
- **Confidence**: High (Java grep + jar SVG).

## Observation: dedicated skinparam handlers shadow the element bucket
- **Context**: `interfaceBackgroundColor` / `actor { bordercolor }` rows.
- **Finding**: ten keys have both a dedicated handler and a bucket match: note/interface/actor/package/activity/swimlane colours. Only `interfacebackgroundcolor` and `actorbordercolor` now also write the bucket (`BUCKET_TOO_KEYS`). `packageBackgroundColor` must stay bucket-free (pinned by `style-map-buckets-cdd6.test.ts`); the note, activity and swimlane keys were left alone because their engines read the dedicated field.
- **Impact**: a description package/note colour set via those skinparams still ignores the bucket; not measured as a defect.
- **Confidence**: Medium (not probed against jar for note/package).

## Observation: port `data-qualified-name` omits the parent prefix
- **Context**: writing the entity-paint test helper.
- **Finding**: jar emits `comp.p80`, ours `p80`. `compareSvg` ignores the attribute, so no row shows it.
- **Impact**: if a future comparator compares `data-*`, ports will diverge.
- **Confidence**: High.

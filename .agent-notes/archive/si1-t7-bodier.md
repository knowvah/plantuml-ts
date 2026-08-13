# SI1/T7 — Bodier family port

## Observation: getRegexp() is consumed BOTH transformed and raw upstream
- **Context**: Porting `BodierLikeClassOrObject#isMethod` (java:103) and
  `Member`'s `URL` pattern (java:93).
- **Finding**: `Member.URL` compiles `UrlBuilder.getRegexp()` through
  `Pattern2.cmpile` (`%s`/`%g` token substitution + CASE_INSENSITIVE),
  but `isMethod`'s url purge is `String.replaceAll(getRegexp(), "")` —
  plain `java.util.regex`, so `[%s]`/`[%g]` are literal char classes
  containing `%`,`s`/`%`,`g` and matching is case-sensitive. The same
  string behaves as two different regexes.
- **Impact**: Any future consumer of `getRegexp()` must decide which
  form upstream uses at that call site. `url/UrlBuilder.ts` exports both
  the raw string (`getRegexp`) and the `transform` helper; the raw-purge
  form lives in `BodierLikeClassOrObject.ts#purgeUrl` with a comment.
- **Confidence**: High (read both Java call paths; both forms unit-tested).

## Observation: T8's MethodsOrFieldsArea is not constructible from (skinParam, leaf, style)
- **Context**: `BodierLikeClassOrObject#getBody`'s `new
  MethodsOrFieldsArea(members, skinParam, leaf, style)` (java:237-249).
- **Finding**: T8's landed `MethodsOrFieldsArea.ts` replaces upstream's
  `Style` param with the ADR-9 `MethodsOrFieldsAreaConfig` seam
  (pre-resolved `memberFontConfig`, optional `NestedDiagramRenderer`,
  `MethodsOrFieldsAreaSkinParam` extending ISkinParam+ISkinSimple with
  `classAttributeIconSize`/`getCircledCharacterRadius`). Building that
  config from a `Style` needs the unported style→font resolution.
- **Impact**: T9 (batch-4 assembly) must fill TWO hooks:
  `BodyFactory.create1` (BodyFactory.ts) and
  `BodierLikeClassOrObject.ts#newMethodsOrFieldsArea` (the config
  bridge). Both throws are pinned in unit tests that should flip then.
  Also note upstream constructs both areas BEFORE branching on
  show-flags, so getBody(false,false) on a plain class hits the hook.
- **Confidence**: High (read MethodsOrFieldsAreaConfig.ts).

## Observation: T8 and T7 independently widened the ISkinParam seam differently
- **Context**: Both tasks needed ISkinParam members beyond T5's slice.
- **Finding**: T7 added `getDefaultTextAlignment` directly to
  `abel/ISkinParam.ts` (+ MockSkinParam in tests/unit/core/abel/
  helpers.ts); T8 instead derived `MethodsOrFieldsAreaSkinParam` to
  avoid touching the shared files mid-batch (its header says so).
- **Impact**: A sequential batch should consolidate: fold T8's two
  members into `abel/ISkinParam.ts` and retire the derived interface,
  updating MockSkinParam once.
- **Confidence**: High.

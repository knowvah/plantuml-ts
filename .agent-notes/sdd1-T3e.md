# sdd1 T3e — observations

## Observation: core/svg rect() writes a transparent paint as the alpha-0 hex
- **Context**: item 4, moving `paintOf`'s transparent colour to `none`.
- **Finding**: T2a's note said rects were unaffected by `#00000000`; that
  holds for the klimt SVG writer only. `core/svg.ts#rect` wrote
  `fill="#00000000"` and a stroke-width where the jar writes `fill="none"
  style="stroke:none;"` (figezi-68, xalafa-49, vuniko-49, teoz-ng-001).
  `paintOf` now returns `none` (`SvgGraphics.java:521-541` `fixColor`).
- **Impact**: any paint consumer comparing against `#00000000` must compare
  `none` now; `resolveColorToSvgHex('none')` is NOT the alpha-0 hex (frames).
- **Confidence**: High (classify movement, jar goldens).

## Observation: a lifeline `<title>` is UGroup#fix of getDisplay's first element
- **Context**: item 6.
- **Finding**: `UGroup.singletonMap` rewrites every `[^-\w ]` as `.`
  (`UGroup.java:70-74`), and `getDisplay` puts a shown stereotype first, so
  `A <<s>>` is titled `..s..`. With `skinparam stereotypePosition bottom`
  the stereotype goes last and the title is the name (unported, todetu-82,
  xakuro-97). `sequenceParticipant underline` prefixes `<u>` (`.u.Alice`,
  jeviru-31), also unported.
- **Impact**: 15 rows still carry title diffs; 8 are participant ORDER, not
  title content.
- **Confidence**: High (jar probes `tt.puml`, `tt-spot.puml`).

## Observation: StereotypeDecoration.ts isNotEmpty misses whitespace
- **Context**: item 6 residuals (fakova-98, jefoke-95, nimoxu-60).
- **Finding**: `src/core/stereo/StereotypeDecoration.ts` `isNotEmpty` is
  `length > 0`; upstream `StringUtils.isEmpty` treats an all-space/tab
  string as empty (`StringUtils.java:172-183`), so `<< (C,#00FFFF) >>`
  keeps a `<<  >>` label in the port and the jar's `C ` title differs.
- **Impact**: wrong label/style names for spot stereotypes with a blank
  label; outside T3e's write-set.
- **Confidence**: High (read both).

## Observation: circleChar COLOR accepts 6-hex or \w+, not `#name`
- **Context**: item 6, jar probe.
- **Finding**: `<< (C,#red) T >>` does not decorate (title is the raw label,
  `.T` styles nothing); `<< (C,#FF0000) T >>` does. The port matches.
- **Impact**: do not "fix" `#red` spots to decorate.
- **Confidence**: High (jar-verified).

## Observation: the 500-line hook blocks ANY growth of an over-cap file
- **Context**: items 4 and 5.
- **Finding**: `sequence-skin-param.ts` (515) and
  `sequence-layout-participants.ts` (519) were already past 500; the hook
  rejects an Edit that adds a line. Split (`sequence-paint.ts`) or keep the
  edit net-negative (helpers moved to `sequence-hide-passes.ts`).
- **Impact**: plan edits to those files as net-zero or with a split.
- **Confidence**: High.

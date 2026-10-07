/**
 * Root-level `Theme` fields with no existing home — split out (rather than
 * added inline) because `theme.ts` is already at the project's 500-line
 * file-size cap (mirrors the `theme-colors-fields.ts`/`theme-sequence-
 * fields.ts` precedent for the SAME reason; see `theme.ts`'s own doc
 * comment for the full module map). `Theme extends ThemeRootFields`.
 *
 * add2 T3e (batch 3, families F/G): two `SkinParam` root accessors with no
 * `Theme` field yet, both `skin/SkinParam.java`.
 */
export interface ThemeRootFields {
  /**
   * `skinparam hyperlinkUnderline false` — `SkinParam
   * #useUnderlineForHyperlink()` (`SkinParam.java:1056-1060`):
   * `valueIs("hyperlinkunderline", "false") == false` keeps the underline
   * (returns `UStroke.simple()`); only an explicit case-insensitive
   * `"false"` turns it off (returns `null`). Absent = `true` (underline
   * on) — a reader must treat `undefined` the same as `true`.
   *
   * No consumer wired yet: the one call site that would forward this into
   * an activity label's `ActivityTextStyle` (`activity-renderer-shapes.ts
   * #renderAction`) is outside this task's write-set — see
   * `activity-renderer-text.ts#fontConfigForRun`'s own doc comment for the
   * consuming half (which DOES exist, reading this field when present).
   */
  hyperlinkUnderline?: boolean;
  /**
   * `skinparam svgLinkTarget <value>` — `SkinParam#getSvgLinkTarget()`
   * (`SkinParam.java:1080-1082`): `getValue("svglinktarget", "_top")`, a
   * raw passthrough string, no validation upstream. Absent = `"_top"`
   * (matches `core/svg.ts#linkWrap`'s own `target = '_top'` parameter
   * default). Same unwired-consumer note as {@link hyperlinkUnderline}.
   */
  svgLinkTarget?: string;
  /**
   * `skinparam preserveAspectRatio <value>` — `SkinParam
   * #getPreserveAspectRatio()` (`SkinParam.java:1085-1087`):
   * `getValue("preserveaspectratio", DEFAULT_PRESERVE_ASPECT_RATIO)`, a raw
   * passthrough string (no validation), cascaded onto the root SVG
   * `preserveAspectRatio` attribute (`klimt/drawing/svg/SvgGraphics.java
   * :813-815`). Absent = take `core/klimt/document-shell.ts
   * #DEFAULT_PRESERVE_ASPECT_RATIO` ('none'). Flows to `RenderFragment
   * .preserveAspectRatio` (`core/dispatcher.ts`, add2 T2d plumbing) —
   * `activity/renderer.ts#renderActivity` is the first producer to set it.
   */
  preserveAspectRatio?: string;
  /**
   * `skinparam padding N` — `SkinParam#getPadding()` (`skin/SkinParam.java
   * :1147-1150`): `getAsDouble("padding")`, a BARE root key, distinct from
   * any per-element `<style>`/`skinparam <element>Padding` bucket value
   * (`CommandSkinParam.java:96-99` additionally emits a "use CSS style
   * instead" deprecation `Warning` when this key is set -- the Warning
   * producer has no wiring in this port yet, reported separately, not
   * blocking this field). Fed into EVERY activity `SheetBlock1` alongside
   * (not instead of) that element's own bucket Padding (`FtileBox.java
   * :180`, `ConditionalBuilder.java:244`, `FtileWithNoteOpale.java:149`,
   * `FtileIfWithDiamonds.java:126`) -- two independent additions that
   * happen to share one constructor argument upstream. Absent = `none()`
   * (`SkinParam.java:1159`'s `isIntOrDecimal` guard), i.e. this field being
   * `undefined` must read as a no-op, not zero-with-effect.
   */
  padding?: number;
  /**
   * `skinparam swimlaneWidth <value>` — `SkinParam#swimlaneWidth()`
   * (`skin/SkinParam.java:1121-1130`): the case-insensitive literal `same`
   * -> `ISkinParam.SWIMLANE_WIDTH_SAME` (`-1`, `style/ISkinParam.java:71`);
   * an all-digits value (`isDigits`, `SkinParam.java:130-136`, `\d+`) ->
   * `Integer.parseInt`; anything else -> `0`. Absent = `0` (the same
   * fallthrough). Read once by `Swimlanes#computeSizeInternal`
   * (`activitydiagram3/ftile/Swimlanes.java:399`), its only reader.
   */
  swimlaneWidth?: number;
}

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
}

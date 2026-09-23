/**
 * `skinparam mode dark` default-color table (cdd-T33).
 *
 * Upstream mechanism: `SkinParam.isDark` (`skin/SkinParam.java:114-116`,
 * `"dark".equalsIgnoreCase(skinParam.getValue("mode"))`) switches
 * `TitledDiagram#muteColorMapper` (`TitledDiagram.java:291-294`) to
 * `ColorMapper.DARK_MODE` (`klimt/color/ColorMapper.java:68-72`), whose
 * `fromColorSimple` calls `simple.darkSchemeTheme()`
 * (`klimt/color/HColorSimple.java:236-239` — returns the color's baked-in
 * `.dark` field, or itself unchanged if none was ever set via
 * `withDark(...)`). The dark variant is baked in at STYLE-PARSE time
 * (`style/parser/StyleParser.java`'s `@media` token, `:277-283,314-324`),
 * from `resources/skin/plantuml.skin`'s literal
 * `@media (prefers-color-scheme:dark) { ... }` block (`:563-776`).
 *
 * This port has no `@media`/dark-variant style parser (explicitly out of
 * scope — see `plans/class-divergence-drive/batch-9/T33-mode-dark.md`'s own
 * boundaries) — this table reads the block's literal values directly, for
 * exactly the five defaults `skinparam-theme-builder.ts#buildThemePartial`
 * gates on `SkinparamAccumulator.mode === 'dark'`. An EXPLICIT skinparam or
 * `<style>` value for the SAME field always wins (mirrors
 * `HColorSimple#darkSchemeTheme`: a color with no baked `.dark` variant is
 * untouched by `ColorMapper.DARK_MODE`) — enforced by the `??=` gate at the
 * call site, not by this module.
 */
export const DARK_MODE_DEFAULTS = {
  /**
   * `document { BackGroundColor #1B1B1B }` — plantuml.skin:572. The root SVG
   * canvas background: `TitledDiagram#calculateBackColor`'s merged
   * `{root, document, <diagramType>}` style signature
   * (`TitledDiagram.java:279-289`) — `document`'s own BackGroundColor
   * overrides `root`'s for this specific (more specific) signature.
   */
  background: '#1B1B1B',
  /**
   * `root { LineColor #e7e7e7 }` — plantuml.skin:567. The general
   * stroke/border default (`theme.colors.border`) — routed through the
   * GENERAL field, not a class-specific one, because light mode has no
   * `theme.colors.graph.classBorder` default either (`classBorder(geo,
   * theme)`, `renderer-classifier-colors.ts`, falls through to
   * `theme.colors.border` by design) — the SAME single root-level LineColor
   * upstream uses for both the classifier box's stroke AND the badge
   * ellipse's stroke (`resolveBadgeBorder`'s own `defaultBorder` param).
   */
  border: '#E7E7E7',
  /**
   * `root { FontColor white }` — plantuml.skin:566. The general text-color
   * default (`theme.colors.text`), consumed directly by non-class engines
   * (e.g. activity's `theme.colors.text` fallback role,
   * `activity-text-style.ts`) sharing this same skinparam pipeline.
   */
  text: '#FFF',
  /**
   * `root { BackGroundColor #313139 }` — plantuml.skin:568. The classifier
   * box fill default (`theme.colors.graph.classBackground`) — class has no
   * OWN dark-mode selector in the `.skin` file, so it inherits `root`'s
   * BackGroundColor, exactly like the light-mode default already does
   * (`defaultTheme.colors.graph.classBackground`).
   */
  classBackground: '#313139',
  /**
   * `spot { spotClass { BackgroundColor #2E5233 } }` — plantuml.skin:
   * 644-646. The class-kind badge fill AND (reusing `ElementColors.font`,
   * fed by the SAME `root { FontColor white }` value as {@link text}) the
   * badge glyph's own fill — `resolveBadgeFill`/`resolveBadgeGlyphColor`
   * both consult `theme.colors.elements['spotclass']` ahead of their
   * hardcoded kind defaults.
   */
  spotClassBackground: '#2E5233',
} as const;

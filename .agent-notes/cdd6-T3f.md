## Observation: TYPE1 `[ ... ]` body lines are verbatim upstream; the description engine still unwraps them
- **Context**: dezobu-62-vuzu421 drew `Scrum Pillars` where the jar draws `"Scrum Pillars"`.
- **Finding**: `CommandCreateElementMultilines#executeNow` builds the display with `lines.toDisplay()` -> `Display.createFoo` -> `Display.create` (CommandCreateElementMultilines.java:192-199, Display.java:185-221); nothing unwraps quotes/brackets. Jar probe `rectangle A [ "q" (p) :c: ]` draws all three wrapped. Class fixed in `class-multiline-element.ts` (cdd6 T3f). `src/diagrams/description/parser.ts:114,139` (`pushElementEdgeText`/`pushElementBody`) still run `stripFullWrap` on TYPE1 lines.
- **Impact**: description-engine rows with a wrapped TYPE1 body line are drawn unwrapped; fix belongs to whoever owns `description/parser.ts`.
- **Confidence**: High (Java read + jar probe)

## Observation: `deepMergeTheme` drops any Theme scalar not on its allowlist
- **Context**: probing `Theme.reverseColor` through `renderSync(..., { theme: {...} })`.
- **Finding**: `src/core/theme-merge.ts` copies optional scalars from a fixed name list (`'monochrome'` is at :37). A new Theme scalar reaches no renderer through `resolveTheme`/the skinparam builder until it is added there, and nothing fails.
- **Impact**: every new Theme field needs the builder row (`skinparam-theme-builder.ts`) AND the merge-list entry, or it is silently inert.
- **Confidence**: High (measured: tozizu 16/0 without, 0/0 with the list entry)

## Observation: three copies of the HSLuv converter
- **Context**: porting `HUSLColorConverter` for `reversecolor dark`.
- **Finding**: `src/core/klimt/color/HUSLColorConverter.ts` (full port, cdd6 T3f) plus private subsets in `src/core/tim/builtin/color-utils.ts` and `src/core/klimt/sprite/ColorResolver.ts`.
- **Impact**: the two subsets can now import the full port; left for a cleanup PR.
- **Confidence**: High

## Observation: class scale pass drops new note-row geometry fields
- **Context**: note table `<r>` alignment `dx` and titled-separator `title` (cdd6 T3f).
- **Finding**: `class-scale-geo-note.ts#scaleTableCell` rebuilds `lines` as `{y, atoms}` (drops `dx`); `scaleLineDivider` spreads `title` unscaled. `scaleClassGeometry` short-circuits at k=1, so only `scale`/`dpi` diagrams are affected.
- **Impact**: under `scale != 1` a right-aligned cell draws flush left and a titled note separator's title keeps unscaled width/atoms.
- **Confidence**: High (read); not measured on a fixture

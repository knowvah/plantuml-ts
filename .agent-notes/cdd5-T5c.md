## Observation: group stereotype/sub-selector styles never reach the class Theme
- **Context**: cdd5-T5c cluster-style-signature-unmerged / group-linestyle-dropped.
- **Finding**: the class renderer sees only `Theme`, never the StyleMap. `style-map-element.ts#collectElementStyleBuckets` reads, per element bucket, only background/border/linecolor/fontcolor/linethickness/minimumwidth/roundcorner/fontsize/shadowing; `<sname>.stereotype` only `fontsize`; no `<sname>.title` selector; no `.label` FontColor; no `LineStyle` anywhere. `skinparam-stereo-keys.ts:179` (`PACKAGE_BY_STEREO_RE`) maps `<<label>>` skinparams for `package` only, so `skinparam rectangle<<boundary>> {...}` is dropped, and `skinparam rectangle { BorderStyle dashed }` has no handler.
- **Impact**: catana, tobevo, noxebo, fepiko, juzica, palida, zivilu and the stereo halves of cevoti/guxico need new `ElementColors` fields + parse in src/core before any renderer change can apply them.
- **Confidence**: High (theme dumped per row via buildTheme; code read)

## Observation: a package's visibility icon also sizes the DOT title table
- **Context**: cdd5-T5c package-visibility-icon (topave-65-ceso890).
- **Finding**: jar `svek-1.dot` label table is `WIDTH="30" HEIGHT="10"` for `- package foo` (title 19.425 + icon block 11; max(14, 15) - 5), so `ClusterHeader.java:130-139`'s mergeLR feeds `ClusterHeader.java:78-90`'s dims. The port computes those in `class-namespace-title-table.ts#namespaceTitleTableDims` from the label string alone, called from `class-dot-clusters.ts:100` -- neither sees the namespace's modifier.
- **Impact**: the fix spans ast.ts (Namespace field), class-command-containers.ts (capture), class-namespace-title-table.ts + class-dot-clusters.ts (DOT), class-package-style.ts getWTitle/getHTitle + class-namespace-shape.ts (draw).
- **Confidence**: High (jar DOT/SVG read)

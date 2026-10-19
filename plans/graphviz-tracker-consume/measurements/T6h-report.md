# T6h report: stereo-font-and-interface-border-keys

Commit 3ca3a28fb (unsigned). Files: src/core/{skinparam-accumulator,skinparam-arrow-stereo,skinparam-stereo-keys,style-cascade-description,theme-element-resolve,theme-graph-colors-c}.ts, src/diagrams/description/{renderer-cluster,renderer-edge,renderer-entity}.ts, docs/catalog.md, tests/unit/description/gtc-t6h-stereotype-font-keys.test.ts (new). Core.
Write-set extensions: renderer-cluster.ts (group title/stereotype colour), style-cascade-description.ts (`<style>` twin of the arrow tag font colour), skinparam-accumulator.ts/theme-graph-colors-c.ts (type of the tag cascade entry).

## Render-diff unknown/deroxu-29-gude369
Before 20 structural / 5 numeric. After 4 / 5. All text-fill and interface-stroke paths cleared (g[109..112], g[178..181], g[192], g[203..206]).

## Diagnosis
- Mechanism: `FromSkinparamToStyle`'s ctor strips `<<X>>` off any key (:292-302); `convertNow` resolves the base key's registration -- `addMagic(SName.interface_|component|agent|person|usecase|...)` (:211-227, :270-283: `<sname>BorderColor` -> LineColor, `addConFont(<sname>)` -> FontColor) or `addConFont("arrow", SName.arrow)` (:149) -- and `addStyle` re-signs it with the stereotype at +1000 priority (:396-408). A component `FontColor` colours the title AND the stereotype text (the stereotype style inherits it from the merged component style).
- Origin (port), three gaps:
  1. `skinparam-stereo-keys.ts` `GROUP_BY_STEREO_RE` (:~186) lacked `interface|agent|person|usecase|actor`, so `InterfaceBorderColor/FontColor<<X>>` went to `unknown`.
  2. The description renderers never read `fontByStereo` (stored since cdd6 T1a for groups): `usymbol-resolve.ts#textFontColor` takes only the plain `elements[sname].font`.
  3. `skinparam-arrow-stereo.ts` handled only `arrowcolor<<tag>>`; the description tag cascade (T3) had no FontColor, and the label font (`arrowLabelFontConfig`) ignored the tag.
- Fix: regex widened; `stereotypeFontColor(theme, sname, 'title'|'stereotype', labels)` (theme-element-resolve.ts; last label wins, title -> `fontByStereo`, stereotype text -> `stereoTextFontByStereo ?? stereotypeFontByStereo ?? fontByStereo`, the T1d declaration-order merge) read by `renderer-entity.ts` (title, body, stereotype text, from `styleStereotype ?? stereotype`, so it survives `hide stereotype`) and `renderer-cluster.ts` (title and stereotype; inline `text:` still wins on the title); `arrowfontcolor<<tag>>` and `<style> arrow { .tag { FontColor } }` fill `descriptionArrowTagCascade[tag].fontColor` (merged with the T3 colour/thickness entry rather than replacing it); `renderer-edge.ts#edgeLabelFont`.
- Precedence (jar-verified, oracle c1): link inline `#text:blue` (T6f; `font.mute(colors)` runs after the style, SvekEdge.java:260-262) > `ArrowFontColor<<X>>` / `<style> arrow .X { FontColor }` (SvekEdge.java:816-821) > theme `ArrowFontColor`. The skinparam and `<style>` spellings give identical output (oracle c2).
- Ruled out: the plain (un-scoped) `ComponentFontColor`/`InterfaceFontColor`/`ArrowFontColor` (already identical, oracle p1); sizing (colour only, layout unchanged: dotEqual unchanged).

## Reduced oracles (/private/tmp/claude-501/gtc-T6h)
f1 (flat), b1 (block), h1 (flat + `hide stereotype`), p1 (plain), c1 (group, usecase, agent, person, actor, port, arrow, link `#text:` + stereotype), c2 (`<style>` arrow tag), c3 (actor border/background/font + component background/font on a group): all IDENTICAL to the jar after the change; f1, b1, h1, c1, c3 differed before.

## Tests
gtc-t6h-stereotype-font-keys.test.ts, 6 tests (flat; block; hide stereotype; group + actor; `<style>` tag; text: precedence). Full `vitest run tests/unit tests/architecture tests/oracle/svg-conformance`: 1284 files collected, 26287 passed, 0 failed (class/object/state/description golden + diff-baseline ratchets green). typecheck, eslint, prettier clean; catalog regenerated.

## Surveys (before -> after; conformant/structural-match/diverged)
- component 213/12/41 -> 214/12/40: favega-89-rado990 diverged -> conformant
- usecase 66/7/20 -> 67/7/19: xozabi-42-pixa842 diverged -> conformant
- unknown 505/16/304 -> 505/17/303: kijipu-30-vona046 diverged -> structural-match
- class 723/0/0, object 63/8/9, state 99/14/160: unchanged
- Losses: none. Three rows to pin; I did not diagnose the movers individually beyond the verdict change on stereotype-font fixtures.

## Residuals
deroxu 4 structural / 5 numeric:
- Next family T6i port-cluster-title-min-width (the 5 numerics): svg/g[1]/g[19]/rect[1]/@width exp=163.125 act=186.875 (D 23.75), rect[1]/@x exp=351.25 act=339.375, rect[2]/@x exp=501.875 act=513.75, rect[3]/@x and rect[4]/@x exp=500.625 act=512.5 (the ent0174 port cluster; ours measures the literal `\n` title as one line).
- T6j multi-stereotype-tie-order: svg/g[1]/g[106]/rect[1..4]/@fill exp=#8FF act=#FF0.
Nothing traces into dot-engine.

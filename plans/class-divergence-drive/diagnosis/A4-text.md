# A4 — text content / width / creole / scale (delivered inline by the diagnosis agent 2026-09-21)

| Sub-bucket | Mechanism | Reach | Confidence |
|---|---|---|---|
| 1 | `scale` / `skinparam dpi` never wired to class's SVG scale factor | 10 FULLY (7 scale + 3 dpi) | HIGH |
| 2a | Tree-cell leading space before bold dropped (`.trim()` + unported `DriverTextSvg` leading-space branch) | 2 FULLY | HIGH |
| 2b | Chrome text (legend/title/header/footer/caption) bypasses creole | 3 confirmed, ~14 suspect | HIGH mech / MEDIUM reach |
| 3 | Edge-label visibility modifier never becomes an icon (documented T12a gap) | 2 FULLY | HIGH |
| 4 | Guillemet `<<x>>`→`«x»` not applied in member text | 1 FULLY | HIGH |
| 5 | Name/header creole `<size:>`/`<plain>` left literal | 2 | MEDIUM |
| 6 | `<:name:>` icon shorthand in class-name text | 1 | LOW |
| 7 | `~` prefix on cardinality/role label not stripped | 1 | MEDIUM |
| cascade (probable) | positional shift from another bucket | 22 order-tagged | — |
| unclassified | not instrumented | 38 | — |

## 1 — scale / dpi (HIGH)
Java: `core/TextBlockExporter.java:205-209` (`computeScaleFactor` = `fromScale * dpi/96.0`, `:497` builder scale from `diagram.getScale()`), `klimt/drawing/svg/SvgGraphics.java:466-472` (`format(double)` multiplies every emitted numeric attr; `:695`, `:705`, `:557 setStrokeWidth`). `ClassDiagram` is a `TitledDiagram` (`classdiagram/ClassDiagram.java:49` → `atmp/CucaDiagram.java:109`), so `UgDiagram.java:138` passes scale to the exporter. Layout is unscaled; only serialization scales.
TS: `src/core/scale-command.ts` resolves the factor correctly (numerically verified) but class is not a consumer; `src/diagrams/class/class-command-directives.ts:41-47` discards the `scale` line as a no-op; `src/core/svg.ts#svgRoot:522-558` / `src/core/assemble-svg.ts:499` have no scale seam. Sequence pre-scales geometry instead (`src/diagrams/sequence/scale-geo.ts` + `renderer.ts:466-468`). No `skinparam dpi` capture exists for ANY diagram type.
Reach (all jar-verified): cagace-55-libu760 (`scale max 50 width`), corine-48-pemu761 (`scale .5`), jiramo-39-xuze087 (`scale 2.0`), koxoco-29-moke425 (`scale 0.8`), kujiji-68-cujo036 (`scale 900 width`), nadaba-37-zaku242 (`scale max 50 height`), vebini-34-gapu710 (`scale 2`); `skinparam dpi 300` (3.125 = 300/96): paluca-39-desa696, ziparo-17-joku307, fuxoju-95-xuko052.
Fix shape: capture `scale`/`dpi` into the class AST; follow sequence's `scale-geo.ts` precedent (multiply resolved `ClassGeometry`, font sizes, stroke widths) rather than adding a param to the shared `svgRoot`. `dpi` is a new cross-cutting factor source.

## 2a — tree-cell leading space (HIGH)
Java: `klimt/creole/legacy/StripeTree.java:80-90` strips only `^\s*\|_`, leaving `" **Bom(Model)**"`; `StripeSimple.java:272-293` emits a `" "` atom before the bold atom; `klimt/drawing/svg/DriverTextSvg.java:112-124`: whitespace-only text → NBSP `<text>`; mixed text `startsWith(" ")` → strip and advance `x`.
TS: `src/diagrams/class/class-body-enhanced.ts:156` (`buildTreeRun`) has a spurious `.trim()` (no Java counterpart); `src/diagrams/class/class-member-creole.ts:351-367` (`resolveOneAtom`) ports only the whitespace-only branch, not the mixed-content leading-space-to-x branch (`svg-text-font.ts#emittedTextForm` doc says "Not ported: leadingSpaceAdjust").
Reach: foxiki-17-kosa114 (one missing `<text>\xa0</text>`, all else byte-equal), juxora-90-fisu720 (×2; its path/polygon residuals cascade from the box-height shift).
Fix shape: BOTH changes together — drop the `.trim()` and add the mixed-content leading-space handling — or the `" prop"` case regresses.

## 2b — chrome text never runs creole (HIGH mech / MEDIUM reach)
Java: `activitydiagram3/ftile/EntityImageLegend.java:47-56` (`createTextBlockBordered` on the `Display` → `CreoleParser.createSheetSlow`), `core/DiagramChromeFactory.java:340-413` (title/caption/header/footer same path).
TS: `src/core/annotations/blocks.ts#buildAnnotationBlock:394-421` backs title/caption/legend/header/footer (`src/core/annotations/chrome.ts:161-211`) and calls `measureLines`/`drawLines` on raw strings — zero creole recognition (no `buildStripeAtoms`/`classifyStripeLine`/`StripeTable`/`StripeTree`/`manageGuillemet` references).
Reach confirmed: kacico-91-bati232 (legend table + tree; `childCount exp=34 act=10`), galili-87-zivo129 (`<back:red>` in footer and legend; `filter` absent; `defs exp=1 act=0`), manube-50-xora983 (legend table with `<back:>` swatches). Suspect: lozego, nucite, ropera, rotisi (sprite-in-note, distinct), repuga, sijoba, xenere — not attributed. gikipi's `legend` tag is a false positive (its mechanism is 3).
Fix shape: route each chrome line through the stripe/creole pipeline. SHARED SEAM, HIGH risk (every diagram type's chrome) — scope as its own mission.

## 3 — edge-label visibility modifier (HIGH)
Java: `skin/VisibilityModifier.java:228,277,296`; `svek/SvekEdge.java:302,363-373`.
TS: `src/core/edge-label-box.ts#applyVisibilityIcon` is used only for MEASUREMENT (`class-layout-edge-labels.ts#computeMeasuredLabelAttrs`); render text at `src/diagrams/class/class-edge-geo.ts:130` calls only `applyGuillemet`; comment at `:118-126` documents the deliberate T12a deferral (no edge-label icon draw routine exists).
Reach: gikipi-69-pepo172 (`+parameter`), gixesa-28-feri809 (all four chars). (A2a M2 lists canuti too.)
Fix shape: apply `applyVisibilityIcon` at render and draw the glyph, reusing the member-row icon drawer. LOW seam risk.

## 4 — guillemet in member text (HIGH)
Java: `klimt/creole/legacy/CreoleParser.java:175-176` (`manageGuillemet` on every line), `text/Guillemet.java:78-88`.
TS: `src/core/text/Guillemet.ts` exists and is applied for stereotypes/edge labels; `class-member-creole.ts` and `class-body-enhanced.ts` never call it.
Reach: padapo-73-beke177. Fix: call `applyGuillemet` in `buildMemberAtoms` (`class-member-creole.ts:252-263`).

## 5 — name/header creole `<size:>`/`<plain>` (MEDIUM)
diseka-11-gozu390 (`<color:#888888><plain>Enumeration</plain></color>\nBookCategory` alias; `<plain>` literal and colour not applied), daxeno-00-kasu166 (package name `<size:18>styled</size>`). Path is `class-layout-header-creole.ts`; upstream candidate `klimt/creole/legacy/CommandCreole*`. Not traced to file:line.

## 6 — `<:name:>` icon shorthand (LOW)
lecelo-92-loma110: jar draws 11 children vs our 4; mechanism unresolved.

## 7 — `~` on cardinality/role label (MEDIUM)
focaci-80-suzu938: `"~* initiators"` → jar `* initiators` (no icon, no childCount change). Strip site not located.

## Probable cascades (order-tagged, not rendered)
bufogi, cirojo, cobumi, delasa, fogexa, gevuci, givofi, gokoru, gujigi, guxode, lejoga, pecabi, pejone, popesa, runane, sanixi, tegefa, temise, vudepo, vuresa, vusute, xonamo.

## Unclassified (no claim)
camuna-58-veca254 (compound: `<style>` arrow/cardinality font colour + qualifier box + `\n` in cardinality), lozego, nucite, ropera, rotisi (sprite-in-note), repuga, sijoba, xenere; untouched: bavoxa, bijevi, cacoma, canuti, dojanu, gekope, giraca, jabama, julixi, lipazi, malara, mizupo, mugobo, nafiki, nenexe, nufini, nuvake, ponono, rifuzu, rulite, rusuzi, sadamo, sijisi, sokevu, sumocu, zubevi, zuduxu.

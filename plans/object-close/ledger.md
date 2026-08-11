# object-close ledger — authoritative attribution for all 80 object fixtures

**Status.** Batch-1 (audit) complete. This file is the authoritative
attribution per `decisions.md` D5; `plans/g3-object-svg/README.md`'s residue
table is superseded. G3's *mechanism writeups* remain valid precedent — it is
its residue attribution that this file replaces.

**Exit bar (D1, the 2026-07-14 ruling).** Each of the 80 object fixtures is
either SVG zero-diff against the pinned jar, or carries a row below naming a
mechanism with a `file:line` on **both** sides. No anonymous misses.

**Count check.** 80 slugs appear exactly once in Part 1: **23 conformant + 57
non-conformant**. The 57 match `baseline-object.json`'s non-zero-`diffs` set
exactly (verified by set difference, no gaps, no duplicates). Every one of the
57 carries at least one mechanism ID; **zero rows are `gvts-blocked`**.

**Provenance.** Every row cites the audit file and section that produced it.
The audits are the detailed record — full causal chains, ruled-out
alternatives and confirming experiments live there, not here.

| Audit | Scope | Fixtures |
|---|---|---|
| `audit-size.md` | DOT size-backlog cluster | 8 |
| `audit-nonnumeric-a.md` | ≥5 non-numeric diffs | 9 |
| `audit-nonnumeric-b.md` | 1–4 non-numeric diffs | 20 |
| `audit-geometry-a.md` | purely numeric, ≤10px | 7 |
| `audit-geometry-b.md` | purely numeric, >10px | 13 |

### Four measurement facts that govern how this file is read

1. **The object DOT gate is blind to the largest mechanism (M1).**
   `tests/oracle/svek-dot.ts` compares node count, shape multiset and edge
   topology with **ports stripped**, so structurally different node emission
   scores EQUAL. "78/80 structurally EQUAL" is not evidence that DOT inputs
   match. (`decision-journal.md`, T4b row.)
2. **`test-results/dot-cache/object/<slug>/svek-1.dot` is a copy of the
   ORACLE**, not our emission. Never cite it as evidence about this port.
   To see our DOT: capture `DotInputGraph` via `setLayoutInputObserver`, then
   `toSvekDot`. (`decision-journal.md`, T5b row.)
3. **Diff counts are FLOORS.** `compare.ts` stops recursing into a `<g>` once
   its `childCount` differs, so everything below a `childCount` diff is hidden.
   The queue below is ordered by *mechanism reach*, never by diff count.
4. **D3's premise is falsified (→ D3a).** The three identical `0.055556` size
   pins are three unrelated causes, and `maxSizeDeltaIn` pairs nodes by sorted
   pool, so it cannot say which node moved.

---

# Part 1 — per-fixture attribution (all 80)

## 1a — conformant (23, zero SVG diffs vs the pinned jar)

No mechanism required. `baseline-object.json` `diffs == 0` for each.

`beruju-17-jigi548` · `febadi-87-zozu271` · `figeze-77-fozi735` ·
`gizini-87-vuve916` · `janoma-30-dovo501` · `juciri-29-tamu404` ·
`kexica-21-gega428` · `kocupi-02-ripa662` · `lalizo-85-paxe277` ·
`lapato-45-neje847` · `lijoda-62-teci632` · `linazi-45-gevo553` ·
`linuxu-41-cogo780` · `niloru-34-nuve651` · `nufoju-44-dabi767` ·
`pagidu-67-doxa131` · `rotele-89-cuva650` · `sinepa-64-beze711` ·
`sobosi-40-xuda813` · `soxufi-98-nita528` · `vozomu-86-rodo657` ·
`xuvesu-44-laru205` · `zagodo-28-ranu153`

**Subtotal: 23.**

## 1b — non-conformant (57)

Mechanism IDs are defined in Part 2 and are ordered by measured reach, so a
lower ID means a wider mechanism. A fixture listing two IDs is counted under
both in Part 2's reach tallies — see the double-count note at the end of
Part 2.

Verdicts: `fixable` · `fixable-large` (own tracked mission) · `scoping`
(needs-maintainer-scoping) · `deferred-D7`.

| # | Slug | Mech | Java `file:line` (primary) | Ours `file:line` (primary) | Verdict | Audit |
|---|---|---|---|---|---|---|
| 1 | `baloca-83-nadu916` | M1 + M3 | `svek/SvekNode.java:268-296` | `src/core/svek-dot-emit.ts:150-152` | fixable | nonnum-b §baloca-83 |
| 2 | `beleso-08-ruca459` | M7 | `classdiagram/command/CommandLinkClass.java:363-364` | `src/diagrams/class/class-arrow-grammar.ts:248-249` | **FIXED (B6)** — zero-diff, ratcheted | geom-b §C1, §beleso-08 |
| 3 | `bepafe-03-teda035` | M3 + M1 | `cucadiagram/TextBlockCucaJSon.java:163-167` | `src/diagrams/class/class-json-sizing.ts` | fixable | nonnum-b §bepafe-03 |
| 4 | `diveje-52-xefe514` | M1 | `svek/image/EntityImageMap.java:245-247` → `svek/SvekNode.java:269-303` | `src/core/svek-dot-emit.ts:148-152`, `:169` | scoping | geom-a §M2, §diveje-52 |
| 5 | `donoki-79-riku189` | M21 | `klimt/creole/atom/Bullet.java:58-69` | `src/diagrams/class/note-layout-measure.ts:365` | fixable | nonnum-b §donoki-79 |
| 6 | `fafozi-27-reja300` | M33 | `svek/SvekUtils.java:99-102` | `src/core/svek-dot-emit.ts:42` | fixable | size §fafozi-27 |
| 7 | `fajafu-44-cuve930` | M12 | `klimt/drawing/svg/SvgGraphics.java:716-729` | `src/core/svg-text-font.ts#renameLogicalMonospace` | **FIXED (B10)** — zero-diff, ratcheted | nonnum-b §fajafu-44 |
| 8 | `fikojo-87-tine499` | M7 | `CommandLinkClass.java:362-363`, `:517-527` | `class-dot-edge-order.ts#dotEdgeRunsReversed` | **FIXED (B6)** — zero-diff, ratcheted | geom-b §fikojo-87 |
| 9 | `fonulu-92-libi014` | M10 + M2 | `skin/SkinParam.java:548-551` + `themes/puml-theme-crt-amber.puml:106-110` | `src/core/themes-builtin-a-m.ts:205-237` | fixable | size §fonulu-92 |
| 10 | `fusopu-05-loxo960` | M3 + M1 | `cucadiagram/TextBlockMap.java:171-180`, `:145-152` | `src/diagrams/class/class-map-sizing.ts` | fixable | nonnum-b §fusopu-05 |
| 11 | `gapisu-00-celo011` | M9 | `decoration/symbol/USymbols.java:60-95`; `svek/image/EntityImageDescription.java:111-114,171,203-213` | `src/core/usymbol-shapes.ts:223-228`; `src/core/latex.ts:106-112` | deferred-D7 (fixable-large) | nonnum-a §gapisu-00 |
| 12 | `gatefi-65-curu360` | M4 | `svek/SvekNode.java:269-297` + `~/git/graphviz/lib/common/shapes.c:1993-2009` | `src/core/graph-layout-build.ts:160-169`, `:47-49` | fixable | geom-b §C2, §gatefi-65 |
| 13 | `gubene-80-zume167` | M24 + M25 | `svek/image/EntityImageObject.java:132-135`, `:199-203`; `objectdiagram/command/CommandCreateMap.java:186-190` | `src/core/style-map-element.ts:197-199`; `src/diagrams/class/class-map-commands.ts:344-366` | fixable | nonnum-a §gubene-80 |
| 14 | `guzojo-14-muxa584` | M3 + M1 + M2 | `TextBlockMap.java:171-180`; `cucadiagram/BodierMap.java:72-82` | `class-map-sizing.ts`; `src/core/svek-dot-emit.ts:150-152` | fixable | nonnum-b §guzojo-14 |
| 15 | `jabote-02-rajo672` | M6 | `klimt/drawing/LimitFinder.java:184-188` + `svek/image/EntityImageObject.java:110-113` | `class-ink-box.ts#addRectInkEmptyShownBody` | **FIXED (B5)** — zero-diff, ratcheted | geom-a §M3, §jabote-02 |
| 16 | `jaxere-74-cole479` | M1 | `EntityImageMap.java:245-247` → `SvekNode.java:269-303` | `src/core/svek-dot-emit.ts:148-152`, `:169`, `:92-105` | scoping | geom-a §jaxere-74 |
| 17 | `jocamu-71-nuvo330` | M19 (M6 landed, no movement) | `svek/image/EntityImageObject.java:186-187`, `:211-212` | `src/diagrams/class/renderer-group.ts:78` | fixable — B20 | nonnum-b §jocamu-71 |
| 18 | `jotaga-99-fatu830` | M6 | `LimitFinder.java:184-188` + `EntityImageObject.java:110-113` | `class-ink-box.ts#addRectInkEmptyShownBody` | **FIXED (B5)** — zero-diff, ratcheted | geom-a §jotaga-99 |
| 19 | `kagope-09-kubu001` | M26 | `svek/SvekResult.java:82-91`, `:97-101` | `src/diagrams/class/renderer.ts:316-320`, `:440-443` | fixable | nonnum-a §kagope-09 |
| 20 | `kavako-54-zipa815` | M23 | `svek/image/EntityImageMap.java:160,166-167`; `EntityImageClass.java:193,200-201` | `src/diagrams/class/class-color-override.ts:25-28`; `renderer-classifier-colors.ts:152-160` | fixable | nonnum-a §kavako-54 |
| 21 | `kiluja-96-pado371` | M17 + M1 + M2 | `decoration/symbol/USymbolFrame.java:68-96` | `src/diagrams/class/class-namespace-shape.ts` | fixable | nonnum-b §kiluja-96 |
| 22 | `lafemo-98-ruri220` | M4 + M1 | `svek/SvekNode.java:269-297` + `shapes.c:1993-2009` | `src/core/graph-layout-build.ts:160-169` | fixable | geom-b §lafemo-98 |
| 23 | `lecali-51-funo316` | M18 + M2 | `svek/SvekEdge.java:308-327`; `abel/Link.java:328` | `src/diagrams/class/class-edge-geo.ts`; `renderer-note.ts` | fixable | nonnum-b §lecali-51 |
| 24 | `lisepi-64-mudo307` | M28 | `EntityImageObject.java:115-116` → `cucadiagram/MethodsOrFieldsArea.java:240` | `src/diagrams/class/class-object-map-sizing.ts:229`, `:417` | fixable | size §lisepi-64 |
| 25 | `lunike-70-xipi897` | M10 | `style/FromSkinparamToStyle.java:201` + `themes/puml-theme-aws-orange.puml:451-458` | `src/core/themes-builtin-a-m.ts:47-72`; `skinparam-key-handlers.ts:241` | fixable | size §lunike-70 |
| 26 | `majake-62-pero492` | M22 | `style/FromSkinparamToStyle.java:292-302`, `:396-410` | `src/core/skinparam-stereo-keys.ts:135-195` | fixable | nonnum-b §majake-62 |
| 27 | `maxosa-84-juci042` | M14 + M3 + M1 | `cucadiagram/TextBlockCucaJSon.java:180-190`, `:163-167`; `BodierJSon.java:83-85` | `src/core/style-map-theme.ts#applyStyleMap`; `class-json-sizing.ts` | fixable | nonnum-b §maxosa-84 |
| 28 | `meloxo-38-jeti489` | M11 + M2 | `net/atmp/CucaDiagram.java:325-337` | `src/diagrams/class/class-namespace.ts` / `class-container.ts` | fixable | nonnum-b §meloxo-38 |
| 29 | `nitica-38-cere665` | M16 + M1 | `svek/image/EntityImageClassHeader.java:229-242` | `src/diagrams/class/class-badge.ts:365-372` | fixable | nonnum-b §nitica-38 |
| 30 | `nukera-08-dige359` | M2 (+M34) | `svek/SvekEdge.java:372-373` + `klimt/shape/TextBlockUtils.java:64-68` | `src/diagrams/class/class-layout-edge-labels.ts:221` | fixable | geom-a §M1, §nukera-08 |
| 31 | `nulixu-97-nofi684` | M5 + M2 | `skin/VisibilityModifier.java:178-180`, `:100-102` | `src/diagrams/class/class-visibility-icon.ts:67-71` | fixable | geom-b §C4, §nulixu-97 |
| 32 | `pavizi-27-xupe815` | M12 | `SvgGraphics.java:716-729` | `src/core/svg-text-font.ts#renameLogicalMonospace` | **FIXED (B10)** — zero-diff, ratcheted | nonnum-b §pavizi-27 |
| 33 | `pikuba-31-faxo766` | M32 | `klimt/creole/legacy/CreoleParser.java:91-100` | `src/diagrams/class/class-body-enhanced-layout.ts:393`; `class-object-member-creole.ts` | fixable | size §pikuba-31 |
| 34 | `rocepa-35-gepo708` | M1 + M4 | `svek/SvekNode.java:269-297`; `cucadiagram/TextBlockMap.java:66` | `src/core/svek-dot-emit.ts:88-104`; `graph-layout-build.ts:160-169` | scoping | geom-b §C3, §rocepa-35 |
| 35 | `rozuxo-44-fudi093` | M1 + M4 | `SvekNode.java:269-297` + `appendTr :298-311`; `MethodsOrFieldsArea.java:81`; `abel/Link.java:219-231` | `src/core/svek-dot-emit.ts:88-104` | scoping | geom-b §rozuxo-44 |
| 36 | `ruloso-59-nato909` | M1 + M4 | `SvekNode.java:269-297`; `TextBlockMap.java:66`; `Link.java:219-231` | `src/core/svek-dot-emit.ts:88-104`; `graph-layout-build.ts:160-169` | scoping | geom-b §ruloso-59 |
| 37 | `ruturo-47-kapi300` | M9 | `USymbols.java:60-95`; `EntityImageDescription.java:111-114,171,203-213` | `src/core/usymbol-shapes.ts:223-228`; `latex.ts:106-112` | deferred-D7 (fixable-large) | nonnum-a §ruturo-47 |
| 38 | `sajege-04-zuce784` | M20 (M6 landed at B5: 6 → 2 diffs) | `CommandLinkClass.java:363-364` → `abel/Link.java:145-146`, `:135` | `src/diagrams/class/renderer-uid.ts:145-233` | fixable — B21 | nonnum-b §sajege-04 |
| 39 | `sarepa-89-cevi460` | M7 | `CommandLinkClass.java:362-363`, `:517-527` | `class-dot-edge-order.ts#dotEdgeRunsReversed` | **FIXED (B6)** — zero-diff, ratcheted | geom-b §sarepa-89 |
| 40 | `satuco-50-vusa163` | M15 + M3 + M1 | `cucadiagram/BodierMap.java:54`, `:72-76` | `src/diagrams/class/class-object-map-sizing.ts` / `class-map-sizing.ts` | fixable | nonnum-b §satuco-50 |
| 41 | `sibika-09-sipu286` | M2 + M5 | `SvekEdge.java:372-373`; `VisibilityModifier.java:178-180`, `:186-190` | `class-layout-edge-labels.ts:221`; `class-visibility-icon.ts:68` | fixable | geom-a §sibika-09 |
| 42 | `sigado-12-rina240` | M1 + M4 | `SvekNode.java:269-297`; `TextBlockMap.java:66`; `Link.java:219-231` | `src/core/svek-dot-emit.ts:88-104` | scoping | geom-b §sigado-12 |
| 43 | `sivapa-41-sebu112` | M1 + M3 | `EntityImageMap.java:245-247` → `SvekNode.java:132-135`, `:268-296`; `CommandCreateMap.java:191` | `src/core/svek-dot-emit.ts:150-152` | fixable | nonnum-b §sivapa-41 |
| 44 | `sivime-00-gudo607` | M1 + M4 | `SvekNode.java:269-297`; `TextBlockMap.java:66` | `src/core/svek-dot-emit.ts:88-104` | scoping | geom-b §sivime-00 |
| 45 | `sorisi-53-xebi982` | M2 + M5 | `SvekEdge.java:372-373`; `VisibilityModifier.java:178-180`, `:94-95`, `:134` | `class-layout-edge-labels.ts:221`; `class-visibility-icon.ts:68` | fixable | geom-a §sorisi-53 |
| 46 | `style-stereotype-on-arrow-3` | M8 (+M2) | `CommandLinkClass.java:369-371`; `svek/SvekEdge.java:817-822`, `:874-876` | `src/diagrams/class/class-relationship-parser.ts:144`, `:166`; `src/core/style-cascade-class.ts:326` | fixable | nonnum-a §sta-3 |
| 47 | `style-stereotype-on-arrow-7` | M8 (+M2) | `CommandLinkClass.java:369-371`; `SvekEdge.java:817-822`, `:874-876` | `class-relationship-parser.ts:144`, `:166`; `style-cascade-class.ts:326` | fixable (28px numeric residue unattributed) | nonnum-a §sta-7 |
| 48 | `tenalu-53-meri239` | M29 + M30 | `klimt/creole/legacy/AtomText.java:179-181` → `EntityImageObject.java:240-247` | `src/diagrams/class/class-object-map-sizing.ts:324-328`; `src/core/klimt/creole/legacy/AtomText.ts` | fixable | size §tenalu-53 |
| 49 | `tobuka-93-jale775` | M27 **FIXED (B25)** + **M37** (residue) | `EntityImageObject.java:150-153`; `FromSkinparamToStyle.java:241`, `:414-422` | `class-object-map-sizing.ts#floorAtMinimumWidth` | M27 done — canvas and every `<rect>` now byte-exact; 137 → 41 diffs. Residue is M37, see B32 | size §tobuka-93 |
| 50 | `togixe-65-bepo490` | M31 + M9 | `svek/image/EntityImageState.java:102-111`, `:65-66`; `svek/GeneralImageBuilder.java:130-142` | `src/diagrams/class/class-layout-helpers.ts:264-353`, `:379`; `src/diagrams/state/state-sizing.ts:134-136` | fixable (size); M9 residue deferred-D7 | size §togixe-65 |
| 51 | `tujasu-04-nota700` | M35 + M2 | `svek/SvekEdge.java:249-250` | `src/core/graph-layout.ts:388-399` | scoping (7.25px residual undiagnosed) | geom-b §tujasu-04 |
| 52 | `tusiri-92-catu943` | M11 + M2 | `net/atmp/CucaDiagram.java:325-337` | `class-namespace.ts` / `class-container.ts` | fixable | nonnum-b §tusiri-92 |
| 53 | `vimavu-26-civo110` | M3 + M1 | `TextBlockMap.java:171-180`, `:145-152`; `EntityImageMap.java:245-247` | `class-map-sizing.ts`; `src/core/svek-dot-emit.ts:150-152` | fixable | nonnum-b §vimavu-26 |
| 54 | `vocute-12-suxa445` | M5 + M2 | `MethodsOrFieldsArea.java:366` → `VisibilityModifier.java:178-180`, `:100-102` | `class-visibility-icon.ts:67-71` | fixable | geom-b §vocute-12 |
| 55 | `zebufu-01-pevo013` | M8 + M2 | `CommandLinkClass.java:369-371`; `SvekEdge.java:817-822`, `:874-876` | `class-relationship-parser.ts:144`, `:166`; `style-cascade-class.ts:326` | fixable | nonnum-a §zebufu-01 |
| 56 | `zicope-62-pica490` | M3 + M13 | `cucadiagram/TextBlockMap.java:172-180`; `EmbeddedDiagram.java:77-78` | `src/diagrams/class/class-map-sizing.ts:71-76`, `:147-155` | M3 half fixable; M13 half deferred-D7 / scoping | nonnum-a §zicope-62 |
| 57 | `zuvila-56-nuda425` | M13 | `sourceforge/plantuml/EmbeddedDiagram.java:75-77`; `klimt/creole/Display.java:190-195` | `src/core/klimt/creole/Display.ts:185`; `SheetBuilder.ts` | deferred-D7 / scoping | nonnum-b §zuvila-56 |

**Subtotal: 57. Part 1 total: 23 + 57 = 80.**

---

# Part 2 — mechanism catalogue, ordered by MEASURED reach

Reach = number of the 57 non-conformant object fixtures in which the mechanism
is named by an audit. Per D3a, this ordering — not the diff count, not the size
pin — is what batch-2 works in.

## M1 — `RECTANGLE_HTML_FOR_PORTS`: row-port DOT node emission and per-row edge anchors are unbuilt — **reach 18**

Upstream emits every map, every JSON, and every port-bearing object/class as a
`shape=plaintext` node whose HTML label carries one `<TR PORT="p<md5(key)>">`
per member row, and anchors edges to those ports (`sh0006:p48c4…->sh0007:pcb85…`).
We emit a 3×3 `shieldTable` with a single `PORT="h"` and every edge as
`sh0006:h->sh0007:h`.

- **Java:** `svek/SvekNode.java:132-135` (dispatch) → `appendLabelHtmlSpecialForLink`,
  `svek/SvekNode.java:268-296` (cited `:269-303` by geom-a and `:269-297` +
  `appendTr :298-311` by geom-b — one routine, see the citation-drift note).
  Selected by `svek/image/EntityImageMap.java:245-247` (unconditional),
  `EntityImageJson.java:241` (unconditional), `EntityImageObject.java:249-253`
  and `EntityImageClass.java:254-258` (when port short names exist). Ports from
  `cucadiagram/TextBlockMap.java:93-105` / `:66`,
  `TextBlockCucaJSon.java:103`, `MethodsOrFieldsArea.java:81`; threaded by
  `abel/Link.java:219-231`; set on the edge at
  `objectdiagram/command/CommandCreateMap.java:191`.
- **Ours:** `src/core/svek-dot-emit.ts:150-152` (only `portTable`/`shieldTable`,
  no `appendLabelHtmlSpecialForLink` analogue), `:92-107` (`shieldTable`,
  placeholder `SHIELD_MARGIN_X = 1` / `SHIELD_MARGIN_Y = 16` at `:89-90`),
  `:169` (`:h` hardcoded as the only port suffix an edge endpoint can carry).
  The layout adapter carries no port on any edge — captured `DotInputEdge`s hold
  only `{minLen}`.
- **Fixtures (18):** `baloca-83-nadu916`, `bepafe-03-teda035`,
  `diveje-52-xefe514`, `fusopu-05-loxo960`, `guzojo-14-muxa584`,
  `jaxere-74-cole479`, `kiluja-96-pado371`, `lafemo-98-ruri220`,
  `maxosa-84-juci042`, `nitica-38-cere665`, `rocepa-35-gepo708`,
  `rozuxo-44-fudi093`, `ruloso-59-nato909`, `satuco-50-vusa163`,
  `sigado-12-rina240`, `sivapa-41-sebu112`, `sivime-00-gudo607`,
  `vimavu-26-civo110`.
- **Found independently by three audits** — `audit-nonnumeric-b.md` shared
  mechanism 1 (10 fixtures), `audit-geometry-a.md` M2 (2), `audit-geometry-b.md`
  C3 (6). Three disjoint fixture sets, one routine, one `file:line` pair.
- **Invisible to the DOT gate.** See fact 1 above.

## M2 — link labels are measured without upstream's 1px all-round margin — **reach 15**

Upstream wraps every link label block in `withMargin(block, 1, 1)` before
measuring, so the DOT label table is +2 wide and +2 tall (once for the whole
block, not per line). We emit the raw measurement.

- **Java:** `svek/SvekEdge.java:372-373` (`marginLabel = startUid.equalsId(endUid) ? 6 : 1`)
  → `klimt/shape/TextBlockUtils.java:64-68`; truncated into the table at
  `svek/SvekEdge.java:505-507`.
- **Ours:** `src/diagrams/class/class-layout-edge-labels.ts:221` (`labelWidth:
  m.width, labelHeight: m.height`), emitted via `src/core/svek-dot-emit.ts:46-48`.
- **Fixtures (15):** `fonulu-92-libi014`, `guzojo-14-muxa584`,
  `kiluja-96-pado371`, `lecali-51-funo316`, `meloxo-38-jeti489`,
  `nukera-08-dige359`, `nulixu-97-nofi684`, `sibika-09-sipu286`,
  `sorisi-53-xebi982`, `style-stereotype-on-arrow-3`,
  `style-stereotype-on-arrow-7`, `tujasu-04-nota700`, `tusiri-92-catu943`,
  `vocute-12-suxa445`, `zebufu-01-pevo013`.
- **Found independently by two audits** — `audit-geometry-a.md` M1 (owns
  `nukera`/`sorisi`/`sibika`, plus a corpus-wide scan of every object fixture
  emitting a `label=<<TABLE>>`) and `audit-geometry-b.md` C5 (`vocute`,
  `nulixu`, `tujasu`, filed as "edge-label table under-measured ~1px wide /
  2px tall"). The observed pairs are identical across both: `21x13`→`22x15`,
  `28x13`→`29x15`, `91x13`→`92x15`, `199x39`→`200x41`.
- **Control:** `tobuka-93-jale775` carries only `taillabel=`/`headlabel=`
  tables, which upstream builds *without* `addVisibilityModifier`; ours match
  the oracle byte for byte.
- **MUST land with M34.** See the pairing note below.

> **Conflict RESOLVED by measurement, B2 (2026-08-11): the number is 11.**
> A scan of every object fixture whose ORACLE emits a main `label=<<TABLE>>`
> finds 11 — neither the 15 enumerated above nor the 16 claimed. The larger
> counts conflated fixtures carrying only `taillabel=`/`headlabel=` tables,
> which upstream builds WITHOUT `addVisibilityModifier` and which therefore
> never carried this defect (the same reason `tobuka-93-jale775` was already
> byte-exact and was named as the control).
>
> After B2, **10 of the 11 match the oracle exactly**. The 11th,
> `lecali-51-funo316`, is a DIFFERENT mechanism — ours `20x15,20x15` vs the
> jar's `75x48,174x46`, which is `EntityImageNoteLink` merged into `labelText`
> (`svek/SvekEdge.java:308-326`), not a 1px margin. It is carried as its own
> row, not inside M2's count.
>
> **B2 landed correctly and moved no fixture.** The object census held at
> 23/80 with an identical bucket distribution: these fixtures' remaining
> residues are other mechanisms, and M2 was one layer of several.

## M3 — map/JSON cell construction: cells not built through `CreoleMode.FULL`, empty-value cell and row vline suppressed, JSON full-height vline missing — **reach 9**

Three sub-parts that share one body-building seam and land together.

- **Java:** `cucadiagram/TextBlockMap.java:171-180` (`display.create0(…,
  CreoleMode.FULL, …)`, so `__…__` underlines and `<font:…>` becomes an
  attribute) · `TextBlockMap.java:145-152` (an unconditional cell +
  `ULine.vline(heightOfRow)` for EVERY non-`Point` value, empty string
  included) · `TextBlockCucaJSon.java:180-190` and `:163-167`
  (`ULine.vline(height)` once per JSON object, full height, at `dx = width1`).
- **Ours:** `src/diagrams/class/class-map-sizing.ts:71-76` (`measureMapCell`
  measures the raw string), `:147-155` (`buildOneMapRow` sets `text: row.key` /
  `row.value` verbatim); `src/diagrams/class/class-json-sizing.ts` /
  `renderer-classifier-box.ts` (horizontal rules only, no vline).
- **Fixtures (9):** `baloca-83-nadu916`, `bepafe-03-teda035`,
  `fusopu-05-loxo960`, `guzojo-14-muxa584`, `maxosa-84-juci042`,
  `satuco-50-vusa163`, `sivapa-41-sebu112`, `vimavu-26-civo110`,
  `zicope-62-pica490`.
- **Found by two audits** — `audit-nonnumeric-b.md` shared mechanism 2 (8) and
  `audit-nonnumeric-a.md` M6 (`zicope-62`, the `<font:…>` half). The creole
  commands are already ported and wired for other paths
  (`src/core/klimt/creole/command/CommandCreoleFontFamilyChange.ts`,
  `CommandCreoleBuilder.ts:110`) — this is a missing call, not a missing feature.
- Only `zicope-62`'s `{{ }}` half is out of scope here; that is M13.

## M4 — `shape=plaintext` HTML-label nodes lose graphviz's own label padding — **reach 7**

Upstream emits plaintext nodes with an HTML `<TABLE>` label and **no**
`width`/`height`; graphviz then pads the label by +4·GAP wide / +2·GAP tall
(16 / 8 px) and floors at 54 × 36. Our adapter folds `plaintext` into
`shape=box, fixedsize=true, label="", width=<measured>/72`, so there is no
label to pad and every downstream coordinate is 16 px (horizontally) or 8 px
(vertically) tight.

- **Java / graphviz:** `svek/SvekNode.java:269-297` (no width/height emitted);
  padding at `~/git/graphviz/lib/common/shapes.c:1993-2009` via `PAD`
  (`~/git/graphviz/lib/common/macros.h:27-29`, `GAP` at
  `~/git/graphviz/lib/common/const.h:251`).
- **Ours:** `src/core/graph-layout-build.ts:160-169` (`addOneNode` default
  branch), `:47-49` (`layoutShape` folds `plaintext` → `box`).
- **Fixtures (7):** `gatefi-65-curu360` (sole cause — the clean isolate),
  `lafemo-98-ruri220`, `rocepa-35-gepo708`, `rozuxo-44-fudi093`,
  `ruloso-59-nato909`, `sigado-12-rina240`, `sivime-00-gudo607`.
- **Verified against real graphviz on the oracle DOT:** a 49×18 label becomes a
  65×36 node; 65.94×36 → 81×44; 69.49×68 → 85×76; 151.4×72 → 167×80.

### M1 + M4 are ONE upstream routine and TWO port-side changes that must land together

This is the ruling the queue order turns on. `SvekNode#appendLabelHtmlSpecialForLink`
is a single upstream routine; on our side it decomposes into two edits in two
files, and **neither is correct alone**:

- **M1 alone** (emit the row table, keep the adapter's `fixedsize` fold): the
  ports exist but the node footprint is still the measured label with no
  padding, so every port's absolute y is still wrong by up to 8 px and the
  splines still leave from the wrong place.
- **M4 alone** (stop folding plaintext, keep the shield table): graphviz pads
  the *wrong* label — our 3×3 shield with its 1 px side cells and 16 px pad
  rows — which overshoots the jar's footprint instead of reproducing it.

Both change the node's laid-out extent, in the same axis, in the same
fixtures. **Land them as one change-set and re-measure once.**

`audit-geometry-a.md` (§`diveje-52`, §`jaxere-74`) attributes this same
footprint error to the shield table's placeholder constants in the *emission
form*, where `audit-geometry-b.md` C2 attributes it to the *adapter's* fold.
These are two descriptions of one footprint axis, not a conflict — and they
are exactly the two halves named above.

**Combined M1 ∪ M4 reach: 19 fixtures** (18 + `gatefi-65-curu360`), the largest
in the corpus. D3a's "~28 of 80" is the grep-positive population of fixtures
containing a `map` or a `::` port reference, which includes conformant ones;
19 is the measured non-conformant reach.

## M5 — `skinparam classAttributeIconSize` never reaches the visibility-glyph geometry — **reach 4**

Glyph edge is `ensureEven(size) - 4` and the row block is `size + 1`; ours is a
hardcoded 10, self-documented as "skinparam override not wired". Correct at the
default, so the defect is confined to the override path. Render-only — it never
reaches the DOT.

- **Java:** `cucadiagram/MethodsOrFieldsArea.java:366` →
  `skin/VisibilityModifier.java:178-180` (`URectangle.build(size-4, size-4)`),
  `:100-102` (block dim `size+1`), `:134`/`:186-190` (`ensureEven`); default 10
  at `skin/SkinParam.java:554-556`.
- **Ours:** `src/diagrams/class/class-visibility-icon.ts:67-71`
  (`VISIBILITY_ICON_SIZE = 10`, `ICON_BLOCK_HEIGHT = VISIBILITY_ICON_SIZE + 1`).
- **Fixtures (4):** `nulixu-97-nofi684` (20→16, we draw 6),
  `sibika-09-sipu286` (14→10, we draw 6), `sorisi-53-xebi982` (12→8, we draw 6),
  `vocute-12-suxa445` (16→12, we draw 6).
- **Found independently by two audits that never communicated** —
  `audit-geometry-a.md` M4 and `audit-geometry-b.md` C4, same `file:line` on
  both sides, disjoint fixture sets. Logged in `decision-journal.md` (T5a+T5b
  row) as the strongest available reach signal. The `size - 4` relation is read
  from the Java, not fitted: it reproduces all four observed pairs
  (10→6, 12→8, 14→10, 16→12, 20→16).

## M6 — `LimitFinder`'s `-1` ink max-corner inset — **reach 4** — **LANDED at B5**

> **B5 correction (2026-08-11).** The audit's diagnosis below is right about the
> arithmetic and wrong about the GATE, and the correction matters because the
> proposed gate would have regressed a pinned fixture. "The object's field list
> is empty" is too wide: it merges two upstream branches that carry **different
> ink rules**. The one that moves is only `EntityImageObject.java:110-113`
> (empty list, still SHOWN → the `TextBlockEmpty(10, 16)` placeholder). The
> `showFields == false` branch (`BodierLikeClassOrObject.java:225-229`) keeps
> `y + h` and was already modeled correctly.
>
> Established with three untitled, edge-free, two-node fixtures authored for
> this iteration and rendered through the pinned jar (two nodes so the
> degenerate-single-leaf sizer path is not taken; no title so annotation chrome
> cannot absorb a pixel) — the first control set in this mission that isolates
> the two empty branches from each other:
>
> | body state | source | maxX | maxY | jar canvas |
> |---|---|---|---|---|
> | populated | `BodyFactory.create1` | `x+w` | `y+h` | 148 x 62 |
> | `showFields == false` | `TextBlockUtils.empty(0,0)` | `x+w-1` | `y+h` | 123 x 40 |
> | empty list, shown | `TextBlockEmpty(10,16)` | `x+w-1` | `y+h-1` | 123 x 55 |
>
> Applying the audit's wider gate (or simply adding the Y term to
> `addRectInkEmptyBody`) took `kexica-21-gega428` — a **pinned, zero-diff**
> fixture — from 0 to 2 diffs. That measurement is what forced the three-way
> split. The audit's "G3/O2 concluded height is DELIBERATELY unaffected from
> two title-bearing fixtures where the Y term never surfaced" is therefore also
> wrong: the Y term *does* surface on `kexica`, and `y + h` is correct there.
>
> **Landed** as a third rule, `class-ink-box.ts#addRectInkEmptyShownBody`, gated
> on a new `ClassifierGeo.emptyFieldPlaceholder` flag set at
> `class-object-map-sizing.ts#buildFieldBasedObjectGeo` — keyed on the upstream
> BRANCH, not on a predicate over the geometry.
>
> **Still open, and explicitly not claimed as understood:** the `+1` by which
> the other two states exceed `LimitFinder#drawRectangle` has no identified
> drawing shape. `addRectInk`'s doc comment attributes it to an invisible
> `UEmpty` reservation, but `UEmpty` is drawn nowhere on any class/object path
> (`USymbolNode`/`USymbolDatabase`/`LaneDivider`/activity ftiles only), so that
> attribution cannot be right. Pre-existing since G2 N5, orthogonal to M6, and
> the reason this rule is branch-keyed rather than derived.
>
> **Measured result:** object census **23 → 26/80**, zero regressions and zero
> swaps (before/after zero-diff sets compared element-wise). Flipped
> `jabote-02-rajo672`, `jotaga-99-fatu830`, and — unpredicted — `fafozi-27-reja300`,
> whose 2 diffs the queue had filed under M33 (B30); see the B30 note.
> Partials: `sajege-04` 6 → 2, `beleso-08`/`fikojo-87`/`sarepa-89` 23 → 19,
> `sigado-12`/`sivime-00` 15 → 11, `ruloso-59` 9 → 7, `tenalu-53` 24 → 22,
> `tobuka-93` 148 → 146, `zebufu-01`/`style-stereotype-on-arrow-3` 41 → 39.
> `jocamu-71` did NOT move: its max-X comes from the populated sibling `p2`,
> so the audit's "width only" prediction for it was a coincidence of the right
> sign; it needs M19 (B20) as filed.

`drawRectangle` records the ink max corner at `(x+w-1, y+h-1)`, not `(x+w, y+h)`.
We overstate by (1,1), which inflates the canvas by exactly 1 px per affected
axis after the `.delta(15,15)` box, the ±5 margins and `floor(v+1)`.

- **Java:** `klimt/drawing/LimitFinder.java:184-187`; the case that surfaces it
  is `svek/image/EntityImageObject.java:111-113` (empty-but-unsuppressed field
  list ⇒ `TextBlockLineBefore(TextBlockEmpty(10,16))`, whose payload draws
  nothing — `klimt/shape/TextBlockEmpty.java:79-80`).
- **Ours:** `src/diagrams/class/class-ink-box.ts:68-73` (`addRectInk` →
  `addPoint(x+w, y+h)`) and `:122-125` (`addRectInkEmptyBody` applies `x+w-1`
  but keeps `y+h`); gate at `:277-278`
  (`kind === 'object' && dividerYs.length === 0`), narrower than the rule.
- **Fixtures (4):** `jabote-02-rajo672` (both axes), `jotaga-99-fatu830`
  (both axes), `sajege-04-zuce784` (both axes), `jocamu-71-nuvo330` (width only).
- **Found independently by two audits** — `audit-geometry-a.md` M3
  (`jabote`/`jotaga`) and `audit-nonnumeric-b.md` shared mechanism 4
  (`sajege`/`jocamu`). Both close the arithmetic to the digit in both
  directions; no fitted constant.
- **Fix-design note from geom-a:** the correct gate is "the object's field list
  is empty" (`EntityImageObject.java:111`), strictly wider than
  `dividerYs.length === 0` (which models `showFields == false`). G3/O2's
  "height is DELIBERATELY unaffected" conclusion was drawn from two
  title-bearing fixtures where the Y term never surfaced.
- **Blast radius:** this rule moves the whole class corpus. Re-measure the class
  census alongside the object one.
- **Open candidate, not an assignment:** `beleso-08-ruca459` carries an
  unattributed 1.0px residual on both axes (`audit-geometry-b.md`, §beleso-08,
  "Residual"). It matches this signature but no audit assigns it. Check it
  during M6's re-measure; do not pre-credit it.

## M7 — decor-driven endpoint swap reverses the DOT edge — **reach 3** — **LANDED at B6**

> **B6 outcome (2026-08-11).** Confirmed exactly as filed: the "94.0 triple"
> was one cause, and all three flipped together (19 → 0 diffs each). Object
> census 26 → 29/80, zero lost.
>
> The fix is at the dot boundary, not in the arrow grammar. Dropping
> `decorSwap` from `swapDirection` would re-orient `from`/`to` for every
> left-headed arrow and drag decors, roles, ports and quantifiers with it;
> instead the dot edge is now emitted `idEntity1FullId -> idEntity2FullId`
> (`class-dot-edge-order.ts#dotEdgeRunsReversed`), which is upstream's `cl1`/
> `cl2` verbatim — the AST already carried it under that name since G2 N9/N30.
> This generalizes the 2026-08-08 `ranksParentFirst` patch from the two
> hierarchical types to all seven, and fixes that patch's own blind spot (a
> hierarchical arrow ALSO carrying `-left-`/`-up-`, where `swapDirection` is
> `decorSwap XOR upOrLeft` = false and it declined to reverse).
>
> Second half, same mechanism: `swappedEdges` recorded every HIERARCHICAL
> index while emission used `ranksParentFirst`, and `class-edge-geo.ts
> #normalizeEdgePoints` derives `matchesFromTo` (decor-to-endpoint pairing)
> from it. Both now call the same predicate.
>
> **The row's "re-measure the class DOT gate with this one" produced a null
> result, and the null is itself the finding** — see B31. Class DOT stayed at
> exactly 689/711 because the comparator is orientation-blind, not because the
> class corpus was unaffected. The 317 class SVG goldens are what carries the
> no-regression claim.

Upstream swaps a link's endpoints in exactly one place, guarded on a
`-left-`/`-up-` **direction word**; `<--` reduces to `--` and never inverts.
We swap on the arrowhead decor, and un-swap only for extension/implementation.

- **Java:** `classdiagram/command/CommandLinkClass.java:363-364` (the only
  swap), `:517-527` (`getDirection` strips non-`[-.=\w]`),
  `StringUtils.java:281-310`; `svek/SvekEdge.java:249-250` takes
  `getEntityPort1/2` verbatim.
- **Ours:** `src/diagrams/class/class-arrow-grammar.ts:248-249`
  (`decorSwap` / `swapDirection`), applied at
  `class-relationship-parser.ts:380`, un-swapped only at
  `class-dot-graph.ts:216-218` (`ranksParentFirst`).
- **Fixtures (3):** `beleso-08-ruca459`, `fikojo-87-tine499`,
  `sarepa-89-cevi460` — the "94.0 triple", one cause, confirmed.
- **Reach beyond the corpus:** 8 object fixtures have a left-headed arrow at
  line start; the defect is not object-specific
  (`class/baneru-00-kuro607`, `class/mopesi-01-gapo101` both show the
  reversal). **Re-measure the class DOT + SVG gates with this one.**
- Cheapest high-reach item in the queue: a single predicate.

## M8 — a link's `<<stereo>>` never reaches the arrow style signature; the arrow cascade never reads `LineThickness` — **reach 3**

- **Java:** `CommandLinkClass.java:369-371`
  (`link.setStereotype(Stereotype.build(arg.get("STEREOTYPE", 0)))`) →
  `svek/SvekEdge.java:817-822` (`getDefaultStyleDefinition(stereotype)` →
  `withTOBECHANGED`) → `:874-876` (`styleLine.getStroke()`,
  `Rainbow.build(styleLine, …)`); subset matching at
  `style/StyleSignatureBasic.java:213`, fan-out at `:119-132`.
- **Ours:** `src/diagrams/class/class-relationship-parser.ts:144` (`REL_STEREO`,
  used non-capturing at `:166` and `:185` — the stereotype is matched and
  thrown away); `src/core/style-cascade-class.ts:326` (no `stereotypeTags`
  argument, no `linethickness` lookup anywhere); consumed at
  `src/diagrams/class/renderer-edge.ts:168-170`, `:198`.
- **Fixtures (3):** `zebufu-01-pevo013`, `style-stereotype-on-arrow-3`
  (byte-identical `.puml` to zebufu — one duplicated corpus entry, not two
  independent data points), `style-stereotype-on-arrow-7` (endpoints are `map`
  rather than `object`; changes nothing about the link path).
- `resolveStyleCascade` already implements upstream's two-subset match
  including `stereotypeTags` (`src/core/style-map-element.ts:325-346`), and
  `babcfa94` established the `<<stereo>>`-to-style precedent — but that work is
  skinparam-side, so it is **precedent for the shape of the fix, not the fix**.

## M9 — descriptive USymbol emitter: 4-of-37 icon coverage, hardcoded stroke-width, centred/`textLength`-less label, spurious spot badge — **reach 3** — **DEFERRED (D7)**

- **Java:** `decoration/symbol/USymbols.java:60-95` (37 `record(...)` entries);
  `svek/image/EntityImageDescription.java:111-114`, `:171` (stroke from the
  style, not a constant), `:203-210` (label is a real `BodyFactory.create3`
  TextBlock, left-anchored with `textLength`), `:213`;
  `~/git/plantuml/src/main/resources/skin/plantuml.skin:91-93`
  (`element { LineThickness 0.5 }`).
- **Ours:** `src/core/usymbol-shapes.ts:223-228` (`USYMBOL_ICONS` holds exactly
  `database`, `component`, `actor`, `usecase`), `:234-240`, and the hardcoded
  `stroke-width` at `:59,97,116,157`, label delegated at `:217`;
  `src/core/latex.ts:106-112` (`text-anchor="middle"`, no `textLength`);
  `src/diagrams/class/class-badge.ts:160-162` (spurious badge);
  `src/diagrams/class/renderer.ts:98-102`.
- **Fixtures (3):** `gapisu-00-celo011`, `ruturo-47-kapi300` (both primary,
  deferred as their own mission), and `togixe-65-bepo490`'s **non-numeric
  residue only** (32 paths of USymbol drawing decomposition — `childCount`,
  `rx`/`ry`, `stroke-width`, `text-anchor`, `textLength`).
- **Cross-audit resolution.** `audit-nonnumeric-a.md`'s closing "linkage note"
  hypothesised that `togixe-65` and `lunike-70` collapse into this mechanism.
  Measured by `audit-size.md`: **CONFIRMED for `togixe-65`'s non-numeric half**
  (every USymbol node matches the oracle DOT to the last decimal; the residue is
  drawing decomposition, explicitly "a separate, larger workstream") and
  **REFUTED for `lunike-70`** (its 26 non-numeric paths are aws-orange's
  `<linearGradient>` + header band and dropped theme colours — M10, not M9).
  Reach is therefore 3, not 4.
- Porting ~33 USymbol shapes plus re-routing the icon label is a multi-task
  body of work. Deferred per D7 as a tracked mission; the rows stay here.

## M10 — the compiled built-in theme table drops each theme file's `skinparam` blocks — **reach 2**

`scripts/compile-themes.py` ingests each upstream theme's `<style>` block plus a
small hand-copied set of skinparams and silently discards the rest. Both size
defects are a single dropped skinparam whose *consumer already exists and is
correct*.

- **Java:** `skin/SkinParam.java:548-551` (`getCircledCharacterRadius`, default
  17/3+6 = 11) with `themes/puml-theme-crt-amber.puml:106-110`
  (`CircledCharacter { Radius 9 }`); `style/FromSkinparamToStyle.java:201`
  (`addConFont("objectAttribute", SName.object)`) with
  `themes/puml-theme-aws-orange.puml:451-458`
  (`object { AttributeFontSize 11 }`), matched by
  `EntityImageObject.java:132-134`'s header signature.
- **Ours:** `src/core/themes-builtin-a-m.ts:205-237` (crt-amber) and `:47-72`
  (aws-orange), generated by `scripts/compile-themes.py`;
  `src/core/skinparam-key-handlers.ts:275` parses `circledcharacterradius`
  correctly and `:241` handles only `classattributefontsize` (no
  `objectattributefontsize` handler exists).
- **Fixtures (2):** `fonulu-92-libi014`, `lunike-70-xipi897`.
- **Confirmed by experiment** for fonulu: feeding the one skinparam explicitly
  reproduces `oracle/goldens/object/fonulu-92-libi014/svek-1.dot`
  byte-for-byte, taking the pin to 0.
- **Reach beyond the corpus:** by construction, every `!theme` fixture in every
  corpus. This is the highest-reach *class* of item in the size cluster and the
  cheapest to verify.

## M11 — namespace phantom groups are never materialised — **reach 2**

A dotted `namespace a.b.c` declares only the leaf group here; upstream's
post-parse sweep turns every childful data-less quark into a real
`GroupType.PACKAGE` entity.

- **Java:** `net/atmp/CucaDiagram.java:325-337`
  (`eventuallyBuildPhantomGroups`), group creation at `:349-364`.
- **Ours:** `src/diagrams/class/class-namespace.ts` + `class-container.ts`;
  the ported `src/core/cucadiagram/CucaDiagramBase.ts:289` is on the
  CucaDiagram path, which the class/object engine does not run.
- **Fixtures (2):** `meloxo-38-jeti489`, `tusiri-92-catu943`.
- Previously mis-filed as "DOT-topology namespace nesting, awaiting-maintainer";
  the gap is at PARSE time — the groups never exist as entities, so no cluster
  is ever requested from the layout engine.

## M12 — `monospaced` → `monospace` family rename missing on the attribute-emitting half — **reach 2** — **LANDED at B10**

> **B10 outcome (2026-08-11).** Confirmed exactly as filed, including "one
> line; no geometry moves": both fixtures were a single diff on the same path
> (`svg/g[1]/g[1]/text[4]/@font-family`, `monospaced` vs `monospace`), both
> flipped, and NOTHING else in the corpus moved. Census 29 → 31/80.
>
> Landed as `src/core/svg-text-font.ts#renameLogicalMonospace`, applied inside
> `textFontFamily` BEFORE the `ROOT_FONT_FAMILY` comparison — upstream's own
> ordering (`SvgGraphics.java:716-729`: rename, then the `DEFAULT_FONT_FAMILY`
> test, then the NBSP test). `nbspIfMonospace` now calls the same helper
> instead of carrying its own inline copy, so the rename exists once and both
> consumers provably see the same value.
>
> **Not a one-line diff in practice.** `svg-shapes.ts` was ALREADY over the
> repo's 500-line cap (552) before this touched it, so the complexity hook
> blocked the edit. The font-family/NBSP helpers moved to a new
> `src/core/svg-text-font.ts` (pure move + the fix), leaving `svg-shapes.ts`
> at 412. `textLengthOf` stayed behind — it is rule 5, not a font-family rule.
> The new file is inside the `core/svg*.ts` namespace the SVG-emission-seam
> fitness test scopes to, so that gate still covers it.

The rename must run BEFORE the `DEFAULT_FONT_FAMILY` comparison that decides
whether to emit `font-family` at all. Ours has it in the NBSP half and on the
klimt seam, but not on the shared shape seam the class/object engine uses.

- **Java:** `klimt/drawing/svg/SvgGraphics.java:720-725`.
- **Ours:** `src/core/svg-shapes.ts:117-121` (`textFontFamily`, returns the raw
  family verbatim); the rename exists at `:237` (`nbspIfMonospace`) and at
  `src/core/klimt/drawing/svg/svg-graphics-elements.ts:263`. The file's own doc
  comment at `svg-shapes.ts:224` states the rename must happen "BEFORE the test".
- **Fixtures (2):** `fajafu-44-cuve930`, `pavizi-27-xupe815` — one diff each,
  the same path, the same `monospaced`/`monospace` pair. Single-line fix; no
  geometry moves.

## M13 — the `{{ }}` embedded-diagram pipeline does not exist in this port — **reach 2** — **DEFERRED (D7)**

- **Java:** `sourceforge/plantuml/EmbeddedDiagram.java:75-77`, `:77-78`
  (`EMBEDDED_START = "{{"`); reached from `klimt/creole/Display.java:190-195`
  and `klimt/creole/legacy/CreoleParser.java:152-167`
  (`EmbeddedDiagram.getEmbeddedType` → `createAndSkip` as an `Atom`).
- **Ours:** `src/core/klimt/creole/Display.ts:185` recognises `EMBEDDED_END`
  for trimming only; `src/core/klimt/creole/SheetBuilder.ts` passes the raw
  text through. There is **no `EmbeddedDiagram` equivalent anywhere in `src/`**.
- **Fixtures (2):** `zicope-62-pica490` (a `{{ }}` map value; its `<font:…>`
  half is M3 and is NOT deferred), `zuvila-56-nuda425` (a `{{ }}` inside a
  legend).
- A nested-diagram compile + SVG-to-data-URI embed is a new pipeline stage, not
  a class/object-engine change. Deferred per D7 as a tracked mission.

---

## Singleton mechanisms (reach 1 each)

Ordered by ID, not by priority; they sit below every mechanism above in the
queue. Each row is a complete D1 entry.

| ID | Mechanism | Java `file:line` | Ours `file:line` | Fixture | Audit |
|---|---|---|---|---|---|
| M14 | `<style> json/map { … }` applied only for BackGroundColor/FontColor; MaximumWidth (word wrap), FontSize, FontStyle, LineColor, LineThickness all dropped. `Margin`/`Padding` are inert in the jar too and must NOT be built | `cucadiagram/TextBlockCucaJSon.java:180-190`; `BodierJSon.java:83-85`; `BodierMap.java:100-106` | `src/core/style-map-theme.ts#applyStyleMap`; `class-json-sizing.ts` / `class-map-sizing.ts` | `maxosa-84-juci042` | nonnum-b |
| M15 | Two map entries with an EMPTY key collide in upstream's `LinkedHashMap` — the second REPLACES the first; we keep both rows | `cucadiagram/BodierMap.java:54`, `:72-76` | `src/diagrams/class/class-object-map-sizing.ts` / `class-map-sizing.ts` | `satuco-50-vusa163` | nonnum-b |
| M16 | `entity` classifier's circled-badge letter falls through to the class default `'C'` instead of `'E'`; the `'E'` outline is already captured | `svek/image/EntityImageClassHeader.java:229-242` | `src/diagrams/class/class-badge.ts:365-372` (`'E'` glyph at `:322-325`) | `nitica-38-cere665` | nonnum-b |
| M17 | `frame` drawn with the folder/package outline instead of `USymbolFrame`'s rounded rect + 4-point corner path | `decoration/symbol/USymbolFrame.java:68-96` | `src/diagrams/class/class-namespace-shape.ts` | `kiluja-96-pado371` | nonnum-b |
| M18 | `note on link` unbuilt — upstream merges the note's TextBlock into the LINK'S OWN LABEL block, so it both draws inside the link `<g>` and enlarges the DOT edge label | `svek/SvekEdge.java:308-327`; `abel/Link.java:328` | `src/diagrams/class/class-edge-geo.ts`; `renderer-note.ts` | `lecali-51-funo316` | nonnum-b |
| M19 | Entity-level URL (`object … [[http://…]]`) not wrapped in the `<a>` element upstream opens around the whole entity image | `svek/image/EntityImageObject.java:186-187`, `:211-212` | `src/diagrams/class/renderer-group.ts:78` | `jocamu-71-nuvo330` | nonnum-b |
| M20 | `Link#getInv()` constructs a second `Link`, which consumes a tick of the shared uid counter — a left/up-directed link burns one `lnk` number that is never rendered | `CommandLinkClass.java:363-364` → `abel/Link.java:145-146`, `:135` → `net/atmp/CucaDiagram.java:745-746`, `:129` | `src/diagrams/class/renderer-uid.ts:145-233` | `sajege-04-zuce784` | nonnum-b |
| M21 | Creole bullet-list header modelled as a width-only spacer — layout exact, but no bullet GLYPH is drawn (ellipse at order 0, rect at order ≥1) | `klimt/creole/atom/Bullet.java:58-69`; `klimt/creole/StripeStyle.java:59-62` | `src/diagrams/class/note-layout-measure.ts:365`; `src/core/klimt/creole/StripeStyle.ts:84-86` (throws) | `donoki-79-riku189` | nonnum-b |
| M22 | `<<stereo>>`-qualified skinparam keys modelled as a per-key allowlist; upstream splits the stereotype off ANY raw key and re-signs the style with it at +1000 priority | `style/FromSkinparamToStyle.java:292-302`, `:396-410`, `:198`; `style/StyleLoader.java:178-186` | `src/core/skinparam-stereo-keys.ts:135-195` (no `*backgroundcolor<<…>>` matcher); `renderer-classifier-colors.ts:122-124` | `majake-62-pero492` | nonnum-b |
| M23 | Inline entity LINE-colour decorations (`##pink`, `#line:red`) parsed into `Classifier.color` then discarded; `classBorder` has no per-entity override tier | `CommandCreateMap.java:95`, `:218-227`; `CommandCreateClassMultilines.java:118`, `:271-281`; `klimt/color/ColorParser.java:45`; `EntityImageMap.java:160,166-167`; `EntityImageClass.java:193,200-201` | `src/diagrams/class/class-color-override.ts:25`, `:27-28`; `renderer-classifier-colors.ts:152-160` | `kavako-54-zipa815` | nonnum-a |
| M24 | A **bare top-level** `<style> header { … }` selector is dropped by the style-map parser, which accepts only the nested `<sname>.header` form | `EntityImageObject.java:132-135`, `:199-203`, `:174-177`, `:96-98`; `EntityImageMap.java:146-149`; subset matching legal per `StyleSignatureBasic.java:213` | `src/core/style-map-element.ts:197-199` (`ELEMENT_BUCKET_SNAMES.has('')` fails) | `gubene-80-zume167` (cause 1) | nonnum-a |
| M25 | A `map` body's `key *-> dest` link is created with no `creationIndex`, which makes the exact uid path bail and renumber everything densely entities-first | `objectdiagram/command/CommandCreateMap.java:186-190` → `net/atmp/CucaDiagram.java:741-747` | `src/diagrams/class/class-map-commands.ts:344-366`, `:365`; `src/diagrams/class/renderer-uid.ts:115-119` | `gubene-80-zume167` (cause 2) | nonnum-a |
| M26 | Node/edge emission order — upstream draws every node (classifiers AND notes) in one creation-order pass, then every edge in a second; we interleave hosted notes and emit freestanding notes after all edges | `svek/SvekResult.java:82-91`, `:97-101` | `src/diagrams/class/renderer.ts:316-320`, `:440-443` (heuristic documented at `:298-307`) | `kagope-09-kubu001` | nonnum-a |
| ~~M27~~ **LANDED B25** | `skinparam minClassWidth` floors the box width of EVERY boxed class-family leaf (`addConvert` passes NO SName varargs ⇒ empty signature ⇒ subset of all); we applied it only on the generic class-leaf path, gated to `isLikeClass`. Ported to object, map AND json — all three clamp identically upstream | `svek/image/EntityImageObject.java:151-153`; `style/FromSkinparamToStyle.java:241` (EMPTY `SName` varargs ⇒ matches every element) | `class-object-map-sizing.ts:367`, `:340`; `class-layout-helpers.ts:402`, `:416-418`, `:264`, `:294` | `tobuka-93-jale775` | size |
| M28 | `<style> object { FontSize N }` never reaches object MEMBER ROWS — upstream passes the element `Style` into the bodier, which builds each row's `FontConfiguration` from it; we hardcode the diagram default | `EntityImageObject.java:115-116` → `cucadiagram/MethodsOrFieldsArea.java:240` (`style` stored at `:103`) | `src/diagrams/class/class-object-map-sizing.ts:229`, `:417` | `lisepi-64-mudo307` | size |
| M29 | `AtomText` floors a text run's HEIGHT at 10 px regardless of font size; ours has no floor, so a sub-10pt name row is 2 px short | `klimt/creole/legacy/AtomText.java:179-181`, summed by `EntityImageObject.java:240-247` | `class-object-map-sizing.ts:324-328`; `src/core/klimt/creole/legacy/AtomText.ts` (ports `:183-187` but not the `h < 10` clamp) | `tenalu-53-meri239` | size |
| M30 | Stereotype-scoped `<<X>> { BackgroundColor … }` never lands — `babcfa94` wired the stereo-scoped FontSize arm but not the colour arm of the same cascade | same cascade as M22: `FromSkinparamToStyle.java:292-302`, `:396-410`; `StyleLoader.java:178-186` | `src/core/skinparam-stereo-keys.ts:135-195` | `tenalu-53-meri239` (second defect) | size |
| M31 | Under `allow_mixing` the `state` leaf is routed to the generic class-leaf formula; upstream sizes it with `EntityImageState` (MARGIN delta 20 both axes, then `atLeast(50,50)`), dispatched on `LeafType`, not on diagram type | `svek/image/EntityImageState.java:102-111`, `:65-66`; `svek/GeneralImageBuilder.java:130-142` | `class-layout-helpers.ts:264-353`, `:379`; correct constants already exist at `src/diagrams/state/state-sizing.ts:203-208`, `:134-136` | `togixe-65-bepo490` | size |
| M32 | Creole TABLE markup (`\| a \| b \|`, `\|= h \|= h \|`) in an object/entity body is laid out as a real table upstream (one `<text>` per CELL at computed column x's plus grid `<line>`s); we draw each body line as one literal run | `klimt/creole/legacy/CreoleParser.java:91-100`, reached via `EntityImageObject.java:115-116` → `MethodsOrFieldsArea.java:240-266` (`CreoleMode.SIMPLE_LINE`) | `class-body-enhanced-layout.ts:393`; `class-object-member-creole.ts`. Machinery already ported and unused: `src/core/klimt/creole/legacy/StripeTable.ts:175`, `atom/AtomTable.ts`, `legacy/CreoleParser.ts` | `pikuba-31-faxo766` | size |
| M33 | DOT six-decimal number formatting. Java's `%6.6f` rounds the double's SHORTEST decimal representation HALF_UP; JS `toFixed(6)` rounds the exact binary value. `62.2125/72` → `0.864063` vs `0.864062` | `svek/SvekUtils.java:99-102`, called from `svek/SvekNode.java:159-161` | `src/core/svek-dot-emit.ts:42` | `fafozi-27-reja300` (sole defect); latent on any node dimension landing on a 7th-decimal tie | size |
| M34 | DOT **label-table** rounding: we emit `Math.round` where upstream truncates. No current fixture distinguishes them — but adding M2's +2 margin without this overshoots by 1 px on roughly half of M2's fixtures | `svek/SvekEdge.java:505-506` (`(int) dim.getWidth()`) | `src/core/svek-dot-emit.ts:44` | none alone — **must land with M2** | geom-a §M1 |
| M35 | On a **flat** (same-rank) labelled edge, `taillabel`/`headlabel` quantifiers are not recovered from the engine's render and collapse onto the edge-label centre. The vertical edge in the same file DOES get distinct positions, which localises the failure to the flat-edge path | `svek/SvekEdge.java:249-250` (tail/head label tables are emitted alongside `label=` and are present in BOTH DOTs) | `src/core/graph-layout.ts:388-399` (`extractPortLabelPositions`) | `tujasu-04-nota700` | geom-b |

**M33 and M34 are two different sites, not one mechanism.** M33 is the node
dimension formatter (`inches()`, `svek-dot-emit.ts:42` ↔ `SvekUtils.java:99-102`);
M34 is the label-table integer (`round()`, `:44` ↔ `SvekEdge.java:505-506`).
Different lines on both sides, different Java, different fixtures. Do not merge.

---

## Reach tally and the double-count note

| ID | Reach | ID | Reach |
|---|---|---|---|
| M1 | 18 | M9 | 3 (2 primary + 1 residue) |
| M2 | 15 | M10 | 2 |
| M3 | 9 | M11 | 2 |
| M4 | 7 | M12 | 2 |
| M5 | 4 | M13 | 2 |
| M6 | 4 | M14–M33, M35 | 1 each |
| M7 | 3 | M34 | 0 alone (rides M2) |
| M8 | 3 | | |

Sum of reach counts = **95 mechanism-assignments across 57 fixtures** (M34
excluded — it has no fixture of its own and rides M2). The excess is
**deliberate and declared, not double-counting**: 23 fixtures carry exactly one
mechanism and **34 carry more than one**, and each such fixture is listed in
Part 1 under every ID it carries
and appears in each of those IDs' fixture lists in Part 2. The two views are
consistent by construction — Part 2's fixture lists are exactly the Part 1 rows
that name that ID. **A fixture goes zero-diff only when ALL of its listed
mechanisms have landed**, which is why the queue's per-mechanism "fixtures
moved" column below is a prediction to be confirmed by the re-measure, never an
accounting identity.

---

# Part 3 — the batch-2 queue

Ordered by measured reach per D3a. **D3's discipline is unchanged and
mandatory: re-measure after every landed mechanism.** A mechanism's predicted
fixture list is a hypothesis until the census confirms it — every count in the
"predicted" column below is a floor (fact 3) and several fixtures need two
mechanisms before they move at all.

**The standing re-measure after each item:**
`svg-conformance-census.ts object` (with T2's freshness guard) + the object SVG
ratchet + the object DOT parity gate, then the four quality gates
(`npm test` · `npm run typecheck` · `npm run lint` · `npm run build`), then a
row in `decision-journal.md`. Items flagged **cross-type** additionally require
the class census/DOT gate in the same pass.

| # | Mechanism | Reach | Lands with / after | Predicted to move alone | Notes |
|---|---|---|---|---|---|
| ~~B1~~ | **M1 + M4 together** — row-port DOT node emission + plaintext label padding | 19 | Each other, non-negotiable (see the M1+M4 ruling) | `gatefi-65` certainly; `diveje-52`, `jaxere-74`, `lafemo-98`, `rozuxo-44`, `ruloso-59`, `sivime-00`, `sigado-12`, `rocepa-35`, `sivapa-41` plausibly | Largest item and the largest delta magnitudes in the corpus. Cross-module: `svek-dot-emit.ts` + `graph-layout-build.ts` + `DotInputNode`/`DotInputEdge` port plumbing. Changes the DOT for every map/json/port fixture in **class and description too** — **cross-type**.  **DONE — landed `233846d9`; row was never struck by that iteration, corrected at B7.** |
| ~~B2~~ | **M2 + M34 together** — link-label 1px margin + label-table truncation | 15 | Each other, non-negotiable — M2 alone overshoots by 1px on ~half the set | none alone (M2 is a secondary on 12 of its 15) | Resolves the 15-vs-16 count discrepancy in `audit-geometry-a.md` M1. Touches every diagram type that emits a link label — **cross-type**.  **DONE — landed `8a0692af`; row was never struck by that iteration, corrected at B7.** |
| ~~B3~~ | **M3** — map/JSON cell construction (creole FULL + empty-value cell + row vline + json full-height vline) | 9 | After B1 (its cell widths feed B1's row table; landing it first means measuring B1 against a moving body) | `bepafe-03`, `baloca-83` plausibly with B1 | `zicope-62`'s `<font:…>` half only; its `{{ }}` half is deferred.  **DONE — landed `b5b24929`; row was never struck by that iteration, corrected at B7.** |
| ~~B4~~ | **M5** — `classAttributeIconSize` → visibility glyph | 4 | — | `vocute-12`, `nulixu-97` after B2 | Render-only, never reaches the DOT. Independently rediscovered by two audits.  **DONE — landed `d5950f53`; row was never struck by that iteration, corrected at B7.** |
| ~~B5~~ | **M6** — `LimitFinder` `-1` ink max-corner inset | 4 | — | landed: `jabote-02`, `jotaga-99`, plus unpredicted `fafozi-27` | **DONE 2026-08-11.** Gate is NARROWER than this row proposed, not wider: only `EntityImageObject.java:110-113`'s empty-but-SHOWN branch. The "field list is empty" gate regressed pinned `kexica-21`; see M6's B5 correction block for the three-way jar control set. Census 23 → 26; class ratchet (317 goldens) and all five DOT counts unmoved. `beleso-08`'s 1px residual was M6 and is resolved. |
| ~~B6~~ | **M7** — decor-driven endpoint swap | 3 | — | landed: all three, 19 → 0 each | **DONE 2026-08-11.** Not "a single predicate": the fix is at the dot boundary (`dotEdgeRunsReversed`), plus `swappedEdges` which fed decor pairing from a DIFFERENT predicate than emission used. Census 26 → 29. Class DOT unmoved at 689/711 — because the comparator is orientation-blind, see B31, not because the corpus was untouched. |
| B7 | **M8** — link `<<stereo>>` → arrow style signature + `LineThickness` reader | 3 | After B2 (all three fixtures also carry M2) | none alone | `resolveStyleCascade` already does the two-subset match; `babcfa94` is precedent for the shape only. |
| B8 | **M10** — compiled theme table drops `skinparam` blocks | 2 | `fonulu-92` also needs B2 | `lunike-70` | Fix in `scripts/compile-themes.py` + regenerate. Reaches every `!theme` fixture in every corpus — **cross-type**. Confirmed by jar experiment for fonulu. |
| B9 | **M11** — namespace phantom groups | 2 | After B2 (both fixtures also carry M2) | none alone | Parse-time, not layout. |
| ~~B10~~ | **M12** — `monospaced` → `monospace` on the attribute half | 2 | — | landed: both, 1 → 0 each | **DONE 2026-08-11.** Prediction held exactly — one diff each, both flipped, zero collateral. Census 29 → 31. The rename is one line; the file split it forced (`svg-shapes.ts` was already 52 lines over the cap) was not. |
| B11 | **M25** — map-body link missing `creationIndex` | 1 | With B12 (same fixture) | none alone | One field stamp. Cheapest of `gubene-80`'s two causes. |
| B12 | **M24** — bare top-level `<style> header { }` selector | 1 | With B11 | `gubene-80` once both land | One branch in `style-map-element.ts:197-199`. |
| B13 | **M22** — generic `<<stereo>>`-qualified skinparam BackgroundColor | 1 | — | `majake-62` | Direct copy of `babcfa94`'s landed FontSize matcher shape. The "SEPARATE, larger mechanism, deferred" notes at `skinparam-element-buckets.ts:86-90` and `renderer-classifier-colors.ts:119-121` are now **stale**. |
| B14 | **M30** — stereotype-scoped BackgroundColor (colour arm of M22) | 1 | With/after B13 and B15 | none alone | `tenalu-53` needs both M29 and M30. |
| B15 | **M29** — `AtomText` 10px line-height floor | 1 | With B14 | none alone | Creole-wide: reaches any text run below 10pt anywhere — **cross-type**. |
| B16 | **M16** — `entity` badge letter `'E'` | 1 | After B1 (`nitica-38` also carries M1) | none alone | One-line dispatch gap; outline already captured. |
| B17 | **M15** — `BodierMap` empty-key collision | 1 | After B1 + B3 | none alone | |
| B18 | **M14** — `<style> json/map` property set | 1 | After B1 + B3 | none alone | Build MaximumWidth/FontSize/FontStyle/LineColor/LineThickness **only**. `Margin`/`Padding` are inert in the jar and must NOT be built. |
| B19 | **M17** — `USymbolFrame#drawFrame` | 1 | After B1 + B2 | none alone | |
| B20 | **M19** — entity `<a>` URL wrapper | 1 | B5 landed; B20 is now the only blocker | `jocamu-71` | |
| B21 | **M20** — `Link#getInv()` uid tick | 1 | B5 landed; B21 is now the only blocker | `sajege-04` (down to 2 diffs) | |
| B22 | **M21** — creole `Bullet` glyph atom | 1 | — | `donoki-79` | Three shapes; all constants already in the file; geometry already exact. |
| B23 | **M23** — inline entity LINE colour (`##`, `#line:`) | 1 | — | `kavako-54`'s 9 non-numeric diffs; ≤15px positional residue remains unattributed | Add a border-override tier to `classBorder` and stop discarding the token. |
| B24 | **M26** — node/edge emission order (notes) | 1 | — | `kagope-09` | Zero numeric delta on this fixture — DOM sequence only. Schedule near B11/B12: adjacent code (`renderer-uid.ts` / `renderer.ts` / `class-map-commands.ts`). |
| ~~B25~~ | **M27** — `minClassWidth` floor on object/map/json | 1 | — | none — `tobuka-93` 137 → 41, does not flip | **DONE 2026-08-11.** Scope was wider than this row: map and json clamp identically upstream (`EntityImageMap.java:127-130`, `EntityImageJson.java:127-132`), so all three arms landed. The 1196px delta is gone — canvas and every `<rect>` are byte-exact — but the fixture does NOT reach zero, and its residue is a separate mechanism (M37/B32). Census 31/80 unchanged. |
| **B32** | **M37** — `tobuka-93`'s edge-label placement residue | 1 | — | `tobuka-93` | **NEW, found at B25.** 41 diffs, ALL edge-label text positions (`g[N]/text[1..2]/@x,@y`) plus one 13-point spline on `g[15]`; zero rect/canvas/non-numeric diffs remain. Deltas cluster at y≈1.784 (×5) and y≈11.44–11.49 (×6) with scattered x up to 41.2 — systematic, not noise. **Do NOT pre-attribute to M2/M34**: `tobuka-93` is M2's own named CONTROL (it carries only `taillabel=`/`headlabel=` tables, which upstream builds without `addVisibilityModifier`, and whose DOT is byte-exact). This residue was invisible until B25 removed the 1196px sizing error on top of it. Needs its own audit. |
| B26 | **M28** — `<style> object { FontSize }` → member rows | 1 | — | `lisepi-64` (size half; 67 non-numeric paths are the same block's other properties) | |
| B27 | **M31** — `state` leaf sizing in the class engine | 1 | — | `togixe-65`'s size half only; its non-numeric residue is deferred M9 | Correct constants already exist in `state-sizing.ts:134-136` — **cross-type** (state engine is the source of truth). |
| B28 | **M32** — creole table stripe in object/entity bodies | 1 | — | `pikuba-31` | `StripeTable`/`AtomTable` already ported and unused on this path. |
| B29 | **M18** — `note on link` merged into the edge label | 1 | After B2 | `lecali-51` | 222 diffs / 124px, all downstream of the un-merged label block. |
| **B31** | **M36** — the DOT structural comparator cannot see edge direction | gate-wide | — | — | **NEW, found at B6.** `tests/oracle/svek-dot.ts#structurallyEqual` is the conjunction of node count, edge count, `degreeSequence`, sorted minlens/shapes/ports/cluster-sizes, label counts, rankdir, nodesep, ranksep. `degreeSequence` (`:199-208`) increments both endpoints and sorts — **undirected**; every other member is a sorted multiset or scalar. Reversing `a -> b` leaves all eleven invariant, so M7 was invisible to the mission's primary structural gate and 116/722 class fixtures scored EQUAL while emitting edges the jar emits the other way. Widening it will re-score the class and object denominators, so it must NOT ride along with an emission change. Maintainer scoping: it moves a frozen count by construction. |
| ~~B30~~ | **M33** — DOT inches formatting (`toFixed` vs `%f`) | 0 | — | — | **Moot for `fafozi-27`**: B5 flipped it to zero-diff, so M33's only fixture is gone and this item leaves the actionable queue. The mechanism itself is real and latent everywhere; `fafozi-27`'s 2 diffs were the M6 canvas pair, misattributed here. Retain as a tracked-but-unfixtured note, not a queue item. |

## Deferred under D7 — carried as named rows, NOT batch-2 work

Maintainer-approved 2026-08-11 ("Defer as tracked missions, carry in the
ledger"). These rows satisfy D1's exit bar without pretending the fixtures are
closed. Each needs a `planning/mission-index.md` entry.

| Mechanism | Fixtures | Why deferred |
|---|---|---|
| **M9** — ~33 unported USymbol shapes + icon-label routing + `element { LineThickness 0.5 }` + spurious spot badge | `gapisu-00-celo011`, `ruturo-47-kapi300` (primary); `togixe-65-bepo490` (non-numeric residue only — its size half is B27) | Genuinely large AND separable: porting 33 shapes plus re-routing the icon label through the classifier text path. Not a fix absorbed into object closure. |
| **M13** — `{{ }}` embedded-diagram pipeline (`EmbeddedDiagram` + nested render + base64 SVG data-URI) | `zicope-62-pica490` (`{{ }}` half only — its `<font:…>` half is B3), `zuvila-56-nuda425` | A new pipeline stage with no port at all in `src/`; cross-cutting capability, not a map or legend fix. |

**A deferral is a measured product decision with a tracked owner, never an
effort excuse** (standing CLAUDE.md bar). Both rows carry a mechanism and a
`file:line` on both sides in Part 2.

## Needs-maintainer-scoping — awaiting a ruling

Ten fixtures carry a `needs-maintainer-scoping` verdict from their audit. Two
distinct questions are in play; the first is arguably already answered.

**Question 1 — is M1+M4 (B1) in scope for batch-2?** Eight of the ten scoping
verdicts are this one item: `diveje-52-xefe514`, `jaxere-74-cole479`,
`rozuxo-44-fudi093`, `ruloso-59-nato909`, `sivime-00-gudo607`,
`sigado-12-rina240`, `rocepa-35-gepo708` (and `tujasu-04`'s port-label half,
below). The audits flagged them because porting
`SvekNode#appendLabelHtmlSpecialForLink` is a cross-module change touching
`DotInputNode`/`DotInputEdge` and every map fixture in class and description
too — not an edit.

**D3a appears to have already ruled this in**: its Consequences read "The
map/port node-emission family leads (~28 of 80 fixtures) rather than the size
backlog (8)", and D7 defers only the USymbol and `{{ }}` subsystems. The queue
above therefore places it at B1. **Flagging for explicit confirmation rather
than assuming it** — this is the largest single item in the mission and the
audits asked the question in good faith.

**Question 2 — genuinely open scoping items.**

| Fixture | Open question | Audit |
|---|---|---|
| `tujasu-04-nota700` | The max (104.877px) is the flat-edge tail/head label collapse (M35, actionable). The **7.25px uniform body offset is undiagnosed** — `audit-geometry-b.md` explicitly declines to attribute it: 2px of label-table height does not account for a 7.25px band. Needs instrumentation of the flat-edge label band before it can be scheduled. | geom-b §tujasu-04 |
| `zicope-62-pica490` | The audit asks that the two halves be **split before scheduling**: the `<font:…>` half is M3 (B3, contained); the `{{ }}` half is M13 (deferred D7). The queue above adopts that split — confirm it. | nonnum-a §zicope-62 |
| `zuvila-56-nuda425` | Wholly M13; deferred under D7. Listed here because its audit verdict predates D7. | nonnum-b §zuvila-56 |

**Unattributed numeric residues** (named, not anonymous — each sits on a
fixture that already carries a mechanism, so D1 is satisfied; they are recorded
so they are not mistaken for closure):

- `style-stereotype-on-arrow-7` — 28.0px, empty-`map` box extent. Likely B1;
  confirm at the re-measure.
- `kavako-54-zipa815` — ≤15px positional residue on `g[2]`/`g[3]`/`g[4]`.
- ~~`beleso-08-ruca459` — 1.0px on both axes; matches M6's signature but is not
  assigned by any audit (see M6's open-candidate note).~~ **RESOLVED at B5** —
  it was M6 after all. Both its objects are empty-but-shown; the canvas
  ±1-on-each-axis quartet cleared with the rule (23 → 19 diffs). Its remaining
  19 are M7.
- `tujasu-04-nota700` — 7.25px body offset (Question 2 above).

---

## Conflicts and corrections found while merging

Recorded rather than silently resolved, per the merge instruction.

1. **`audit-geometry-a.md` M1 claims 16 label-table fixtures and names 15.**
   The 15 named slugs are M2's fixture list. The 16th is unidentified. Not
   guessed; B2's re-measure will find it.
2. **`audit-nonnumeric-a.md`'s linkage hypothesis is half right.** It proposed
   that `togixe-65` and `lunike-70` collapse into the USymbol mechanism.
   `audit-size.md` measured both: **confirmed** for `togixe-65`'s non-numeric
   residue, **refuted** for `lunike-70` (aws-orange gradient + dropped theme
   colours = M10). Resolved in M9's entry; M9's reach is 3, not 4.
3. **Citation drift on one Java routine.** `appendLabelHtmlSpecialForLink` is
   cited as `SvekNode.java:268-296` (nonnum-b), `:269-303` (geom-a) and
   `:269-297` + `appendTr :298-311` (geom-b). One routine; the ranges differ by
   where each agent chose to stop. Likewise the ink gate at
   `class-ink-box.ts:277` (nonnum-b) vs `:278` (geom-a) — one expression.
   Recorded as drift, not conflict.
4. **Two descriptions of one node-footprint axis.** `audit-geometry-a.md`
   attributes `diveje`/`jaxere`'s footprint error to the shield table's
   placeholder constants in the emission form; `audit-geometry-b.md` C2
   attributes it to the adapter's `plaintext`→`box` fold. Both are true and are
   the two halves of B1 — see the M1+M4 ruling.
5. **`audit-size.md` supersedes `size-backlog.json`'s `_doc` grouping.** The
   three identical `0.055556` pins are three unrelated causes (M10, M28, M29);
   one of the three pins is stale (`tenalu-53` is at 0.027778 since
   `babcfa94`). Already recorded as D3a; repeated here because the pin file
   still carries the falsified grouping.
6. **Prior `gvts-blocked` filings are wrong for all 57.** G3 filed 46/80 as
   sub-pixel graphviz noise. Five audits over disjoint fixture sets produced not
   one engine-blocked row. Where the DOT input was compared directly, it was
   found to differ in edge direction, node label form, port attachment or label
   table size — the engine was never given identical input, so no
   engine-attributable delta could be measured, and none is claimed.

---

## Exit-bar self-check

- [x] 80 slugs, each exactly once in Part 1 (23 conformant + 57 non-conformant).
- [x] The 57 match `baseline-object.json`'s non-zero-`diffs` set exactly.
- [x] Every non-conformant row names ≥1 mechanism ID.
- [x] Every mechanism in Part 2 carries a Java `file:line` and an ours
      `file:line`.
- [x] No mechanism appears twice under two IDs (M1/M4, M2/M5, M6, M3 merges are
      declared and the merged-from audit sections are named).
- [x] Part 2's fixture lists are exactly the Part 1 rows naming that ID.
- [x] Zero `gvts-blocked` rows.
- [x] Deferred (D7) and needs-scoping rows carry their mechanism and reason.

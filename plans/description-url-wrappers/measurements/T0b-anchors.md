# T0b — class/state anchor check (debugger agent, read-only, 2026-10-16)

Written by the orchestrator from the agent's hand-back. Scratch evidence: `/private/tmp/claude-501/dur-T0b/`.

Method: ours rendered through the production call (as render-diff.mts). The per-run wrap was PROTOTYPED in a
scratch copy of the repo (4 edits: `inline` variant of `Atom.ts` gets `url?`, `StripeSimple.ts:230` stamps
`activeUrl` on inline atoms, `EntityImageDescriptionDelegates.ts#descAtomOps.drawU` and
`EntityImageDescriptionTextBlock.ts#drawAtoms` wrap each text/inline atom in startUrl/closeUrl); all 51 rows
re-rendered and diffed byte-for-byte vs unpatched.

## Headline
- No class/object/state fixture reaches the two drawers with a url-bearing atom. A trace on both drawers fired
  only for unknown/gubexu, jajeve, jobuje, dezobu (embedded) and the two usecase rows. All 24 class+object and
  all 7 state SVGs are BYTE-IDENTICAL before/after the wrap.
- The jar never nests `<a>`: `SvgGraphics.openLink` (java:1228-1240) first calls `closeTopActiveLinkIfNeeded()`;
  field comment :1177-1184 "SVG does not support nested links". Ours `svg-graphics.ts:181-197` is the same
  port. All 51 jar SVGs, ours before and after: max `<a>` depth 1.
- Net: 5 rows move toward the jar (gubexu closes outright; jajeve/jobuje/bivira/vivido gain their `<a>`s), 0
  class/object/state rows change, 1 row's score rises for a pre-existing reason (jajeve).

## Table (49 class/object/state/unknown fixtures with `[[`, plus two usecase rows)
jar `<a>` count; ours today / after = `<a>` count, pass or diff count. "after" is measured in the prototype.

| tree/slug | jar `<a>` | nested? | wraps | ours today | after per-run wrap |
|---|---|---|---|---|---|
| class/class-missing-label-URL-SVG-0 | 5 | no | entity + `[[[url]]]` member rows | 5, pass | byte-identical |
| class/cokeje-99-gede231 | 3 | no | note-body text runs | 3, pass | unchanged |
| class/cutasu-32-zete658 | 26 | no | entity + member rows | 26, pass | unchanged |
| class/danozo-79-nunu375 | 1 | no | whole note | 1, pass | unchanged |
| class/dasagu-52-vani172 | 8 | no | entity + member rows (+icon) | 8, pass | unchanged |
| class/dopuzi-50-muxo994 | 1 | no | package cluster | 1, pass | unchanged |
| class/fijali-69-pina030 | 14 | no | entity + member rows | 14, pass | unchanged |
| class/fitini-85-kupo803 | 1 | no | link (edge + label) | 1, pass | unchanged |
| class/fugexa-12-zoti674 | 5 | no | entity + member rows | 5, pass | unchanged |
| class/gavimi-70-nuju057 | 1 | no | entity | 1, pass | unchanged |
| class/gukuda-51-fuju086 | 3 | no | entity + member row | 3, pass | unchanged |
| class/jatome-90-pire087 | 1 | no | entity | 1, pass | unchanged |
| class/jinoba-14-firi471 | 2 | no | entities | 2, pass | unchanged |
| class/jovaxe-68-bube754 | 5 | no | entity + member rows (tooltip-only) | 5, pass | unchanged |
| class/kutazo-40-texe886 | 3 | no | entity + note + link | 3, pass | unchanged |
| class/laluve-92-raxu863 | 2 | no | entities | 2, pass | unchanged |
| class/rakuci-96-tuti371 | 5 | no | package/rectangle clusters + entities | 5, pass | unchanged |
| class/sejuzo-42-fini523 | 1 | no | member text run (creole) | 1, pass | unchanged |
| class/tegoxa-17-kudo421 | 1 | no | entity | 1, pass | unchanged |
| class/vacole-77-vivo236 | 1 | no | namespace cluster | 1, pass | unchanged |
| class/vafaka-92-xose973 | 1 | no | entity | 1, pass | unchanged |
| class/xogixe-78-zuro619 | 66 | no | entity + member rows (+icon) | 66, pass | unchanged |
| object/gizini-87-vuve916 | 14 | no | entity + member rows | 14, pass | unchanged |
| object/jocamu-71-nuvo330 | 1 | no | entity | 1, pass | unchanged |
| state/dajipi-09-doki542 | 8 | no | state entities/cluster, notes, links | 0, 10 diffs | unchanged |
| state/dapunu-39-kava045 | 12 | no | state entities, start ellipses, links | 0, 11 diffs | unchanged |
| state/feziva-71-gufo538 | 1 | no | state-name text run | 1, 1 diff (text-decoration) | unchanged |
| state/kenuci-20-cane702 | 3 | no | state entities | 0, 3 diffs | unchanged |
| state/mujipe-99-fume794 | 1 | no | state-name text run | 1, 1 diff (text-decoration) | unchanged |
| state/nixoja-06-guxe431 | 1 | no | state-name text run | 1, 1 diff (@fill) | unchanged |
| state/xasoka-58-temi462 | 1 | no | state description text run | 1, pass | unchanged |
| unknown/dezobu-62-vuzu421 | 0 outer (3 in embedded `<image>`) | no | embedded archimate | 0/0, pass | 0 outer / 3 embedded, pass (href bytes exempt) |
| unknown/fepoko-61-fona364 | 1 | no | class member text run | 1, pass | unchanged |
| unknown/finume-86-gada330 | 1 | no | link label | 1, pass | unchanged |
| unknown/gubexu-05-dufu787 | 1 | no | archimate display text run | 0, 1 diff | 1, **pass** |
| unknown/gujeku-90-jisa609 | 0 (jar error page) | no | n/a | 3, 57 diffs | byte-identical |
| unknown/jajeve-56-poza115 | 3 | no | archimate display runs | 0, 196 diffs | 3, 202 diffs (see below) |
| unknown/jixipo-21-mefu703 | 4 | no | title, class-name, 2 member runs | 4, pass | unchanged |
| unknown/jobuje-80-mopu051 | 2 | no | rectangle display run + note-body run | 0, 4 diffs | 2, 3 diffs |
| unknown/jogaji-49-zaco571 | 0 (sequence) | no | n/a | 0, 17 diffs | unchanged |
| unknown/katoke-97-puri404 | 0 (sequence) | no | n/a | 0, 31 diffs | unchanged |
| unknown/nezimo-68-jabo300 | 1 | no | link, tooltip-only | 1, pass | unchanged |
| unknown/nurile-03-kumi912 | 0 (`<math>`) | no | n/a | 0, 11 diffs | unchanged |
| unknown/pecafo-64-rili177 | 0 (`<math>`) | no | n/a | 0, 11 diffs | unchanged |
| unknown/rukate-37-jabu394 | 2 | no | package clusters | 2, pass | unchanged |
| unknown/sozeke-50-rilu829 | 0 (asciimath) | no | n/a | 0, 24 diffs | unchanged |
| unknown/tikiti-02-bagu049 | 1 | no | link, tooltip-only | 1, pass | unchanged |
| unknown/zasuxe-15-lugo662 | 2 | no | cluster title runs | 2, pass | unchanged |
| unknown/zivenu-37-nace681 | 4 | no | title, class-name, 2 member runs | 4, pass | unchanged |
| usecase/bivira-53-boja685 | 2 | no | desc text run (map) + sprite (map2) | 0, 29 diffs | 2, 25 diffs (numeric y; link-label g[4] childCount 4 vs 3) |
| usecase/vivido-49-nisu863 | 9 | no | desc text/sprite/openiconic runs | 0, 8 diffs | 8, 6 diffs (OpenIconic, below) |

Why class/object/state do not move: they draw url-bearing creole text through their own per-run drawers
(`class-member-creole.ts`, `renderer-note.ts`, `renderer-note-lines.ts`, `class-edge-label-sprite-runs.ts`,
`class-namespace-title-runs.ts`, `renderer-classifier-rows.ts`, `svek/image/creole-text-lines.ts` for state);
jixipo/zivenu hit `annotations/blocks-creole-atoms.ts#drawAtom`. Block-level `<a>`s are untouched.

## Rows the per-run wrap pushes away from the jar
| row | change | reason |
|---|---|---|
| unknown/jajeve-56-poza115 | 196 → 202 | Wrap correct (3 `<a>`, hrefs right). Positional: our entity draw order differs (`g[1]/@id exp=ent0001 act=ent0003`), so the new `a[1]` compares against the wrong entity. Pre-existing ordering defect, unmasked. |

No row gains an `<a>` the jar lacks.

## Residuals that survive the wrap (pre-existing)
- usecase/vivido g[4] `<&cloud>` OpenIconic: jar draws `<a><path/></a>`; ours never draws the glyph —
  `creole-atoms-image-resolver.ts:465-469` `if (atom.kind === 'openiconic') return undefined;` (comment claims
  "zero description/usecase corpus"; vivido is the counterexample). An empty `<a>` is dropped (java
  `closeTopPendingElement` `getFirstChild() != null`). The 9th `<a>` needs the glyph drawn
  (`AtomOpenIconic.java:76-82`).
- unknown/jobuje note `<a>/text/@fill exp=#0FF act=#00F`: note hyperlink colour. Separate defect.
- state/dajipi, dapunu, kenuci: state entity/cluster/link/note urls not emitted (block-level, not creole). Out of
  this mission's reach.

## Java (base `~/git/plantuml/src/main/java/net/sourceforge/plantuml/`)
- `cucadiagram/Member.java:93` `URL = "^(.*?)(?:\\[(" + UrlBuilder.getRegexp() + ")\\])?$"`; `:108-116` strips
  a trailing `[[[url]]]` from the display, so no creole url remains in the member text.
- `cucadiagram/MethodsOrFieldsArea.java:245-257` `createTextBlock` → `new TextBlockTracer(m, block)`;
  `:307-325` TextBlockTracer `startUrl` :319 / `closeUrl` :323 (block-level member `<a>`); `:341-368`
  `TextBlockWithUrl.withUrl(uBlock, url)` (`klimt/shape/TextBlockWithUrl.java:67-69`) around the visibility icon.
- Creole `[[url]]`: `klimt/creole/command/CommandCreoleUrl.java:82` `stripe.addUrl(url)` →
  `legacy/StripeSimple.java:225` `AtomTextUtils.createUrl` → `legacy/AtomText.java:198-199/235-236`.
- Nesting: `klimt/drawing/svg/UGraphicSvg.java:160-162` → `SvgGraphics.java:1228-1240` `openLink`
  (`closeTopActiveLinkIfNeeded(); activeLinks.add(0,…); addTopOpenedLinkIfNeeded();`), `:1246-1258`
  `closeLink`, `:1191-1196` non-empty only, comment `:1177-1184`. Inner link wins; outer split into siblings.
  Ours `svg-graphics.ts:158-205` reproduces it.

## bivira / vivido jar structure
Rule: ONE `<a>` per atom (text run, sprite, img, openiconic), never per url span. Text outside `[[ ]]` stays
outside. Attrs on every anchor: `target="_top" href xlink:href xlink:type="simple" xlink:actuate="onRequest"
xlink:show="new" title xlink:title` (title = url when no `{tooltip}`).

| row / entity | puml label | jar order inside the entity `<g>` |
|---|---|---|
| bivira map (ent0002) | `You can click\n[[http://www.google.com]] <$maxime>` | `<text>You can click</text>`, `<a><text fill=#00F underline>http://www.google.com</text></a>`, `<text> </text>`, `<image>` (no `<a>`) |
| bivira map2 (ent0003) | `...\n[[http://www.google.com <$maxime>]]` | `<text>You can click</text>`, `<a><image 48x48/></a>` |
| vivido ent0001 | `click the image:[[http://plantuml.com before <$database*0.31> after]]` | `<text>click the image:</text>`, `<a><text>before</text></a>`, `<a><image 15x15/></a>`, `<a><text>after</text></a>` |
| vivido ent0002 | same with `<$database>` | same, image 48x48 |
| vivido ent0003 | `... <&cloud> ...` | `<a><text>before</text></a>`, `<a><path fill=#00F/></a>`, `<a><text>after</text></a>` |

Java: `klimt/creole/legacy/AtomTextUtils.java:79-91` `createUrl` → `createAtomTextForUrl` `:96-130` (splits by
openicon/sprite/img/emoji patterns; text → `AtomText(…, url, …)` :104,:124; openicon → `AtomOpenIconic(…, url)`
:116; sprite → `AtomSprite(…, url, null)`; emoji throws :107; >1 atom → `AtomHorizontalTexts`; multiline →
`AtomVerticalTexts` :82-87). `AtomSprite.java:73-80` startUrl :75 / closeUrl :79; `AtomImg.java:246-254`
startUrl :248 / closeUrl :254; `AtomOpenIconic.java:76-82` startUrl :78 / closeUrl :82.

## Re-runnable commands
- `cd /Users/scottseely/git/knowvah/plantuml-ts && FIX=usecase/bivira-53-boja685,usecase/vivido-49-nisu863 npx jiti /private/tmp/claude-501/dur-T0b/rd.mts`
- Trace / prototype: `/private/tmp/claude-501/dur-T0b/repo` with `rd2.mts` (`DUR_WRAP=1`); byte compare
  `out-base` vs `out-wrap`. Tables: `python3 -I /private/tmp/claude-501/dur-T0b/tbl.py`, `anchors.py jar|ours`.

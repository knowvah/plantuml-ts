# Seam map (planning, 2026-10-15, main bb5b660d9; Explore agent, read-only)

Line numbers are at bb5b660d9. Re-read before editing; they drift.

## Family A — entity-level URL
**Java**
- `descdiagram/DescriptionDiagramFactory.java:120` registers `classdiagram/command/CommandUrl.java`: regex `:62-75`
  (`url`, optional `of|for`, CODE, optional `is`, `UrlBuilder.MANDATORY`); `executeArg` `:86-102`
  (`quarkInContext` `:91`, error if null `:93-94`, `new UrlBuilder(topurl, STRICT)` `:98`, `entity.addUrl(url)` `:100`;
  `addUrl` replaces).
- Inline: `descdiagram/command/CommandCreateElementFull.java:113` (`UrlBuilder.OPTIONAL`), `:333-337` `entity.addUrl`.
  Packages: `CommandPackageWithUSymbol.java:125`, `:208-212`. Also `CommandCreateElementParenthesis.java:213-218`,
  `CommandCreateElementMultilines.java:216-220`, `CommandCreateDomain.java:164-181`. `CommandArchimateMultilines.java:126-127`
  says the URL is "currently ignored"; `CommandArchimate.java` has no UrlBuilder.
- Draw: `svek/image/EntityImageDescription.java:139` `url = entity.getUrl99()`, `:304-305` `ug.startUrl(url)`, `:327-328`
  `closeUrl()` (inside the entity startGroup). Ports: `EntityImagePort` (`GeneralImageBuilder.java:127`) has no url → no `<a>`.
  Groups: `svek/Cluster.java:339-341` `if (url != null) ug.startUrl(url)`. Data `abel/Entity.java:262-264,279-281`.
- Jar output: `<a target="_top" href xlink:href xlink:type="simple" xlink:actuate="onRequest" xlink:show="new" title
  xlink:title>` around the shapes + text inside `<g class="entity">`. Tooltip `{This is Dog}` → `title="This is Dog"` (sadeja).

**Port drop points**
- `description/parse-helpers-strings.ts:429-462` `stripUrl` (`:405-412` `stripUrlTokenAt` keeps `''`; `:395` regex).
- `parse-helpers.ts:257` (stripUrl/stripTrailingUrl); `:80-88` `NameSection` (no url); `:152-167` `makeNode` (no url).
- `ast.ts:26-110` `DescriptiveNode` (no url).
- Bracket shorthand: `element-grammar.ts:30-44` `BracketDeclaration`, `:74-110` `parseBracketDeclaration`; callers
  `command-table-containers.ts:58,195`; `command-table-shorthand.ts:76,106-109`.
- `url of`: `command-table-directives.ts:62-76` (regex `:71`), handler `:268-290` (checks `nodesById`, never stores).
- `renderer-entity.ts:155` `url: null`; sizer stub `core/svek/image/leaf-sizing-entity.ts:262` `url: null` (no size effect).
- Core ready: `core/svek/image/EntityImageDescription.ts:138-141` `EntityUrl {url, tooltip}`, `:413-419` start/closeUrl.
  `core/url/UrlBuilder.ts:144-162` (`constructor(topurl, mode)`, `getUrl(s): Url | null`); `core/url/Url.ts:24-29` (private
  fields — copy to a plain `{url, tooltip}`). SVG `core/klimt/drawing/svg/u-graphic-svg.ts:254-261`, attrs
  `svg-graphics.ts:82-83,137-142`. `theme.topurl` (`core/theme.ts:189`).
- makeNode call sites: `command-table-containers.ts:61,108,140,198,207,229,244`, `command-table-helpers.ts:46`,
  `command-table-shorthand.ts:76,109`; endpoint auto-creates `parser.ts:220`, `parse-state.ts:278` (no url).
- Geo copy pattern: `layout-helpers.ts:228` (`stereotypeSprite`), `layout-dot-tree.ts:536,577`, `layout-types.ts:27`,
  `layout-helpers-types.ts:28-44` (`DescriptionNodeGeo`). Port leaves `renderer-entity.ts:252-277` keep no `<a>`.
- Class engine has its own url path (`class-url-command.ts:38-57`, `class-url.ts:31-36`): unaffected.

| fixture | form | drop point |
|---|---|---|
| component/gacida-77-joku810 | `component foo1 as "My comp" [[My_component_1]]` | parse-helpers.ts:257 via containers |
| component/givape-84-xano421 | `url of APP is [[…]]` | directives :284-290 |
| component/jazabe-68-bica131 | `[Component1] << S >> [[…]]`, `() Interface << … >> [[…]]` | element-grammar :74-110, shorthand :106-109 |
| component/tukipe-82-ziva562 | `url for Foo is [[…]]` | directives |
| usecase/lizutu-99-mapa855 | `actor User [[file://…]]` (+ commented `url of`) | containers :228-244 |
| usecase/sadeja-25-tina867 | `actor Mamal [[…]]`, `usecase Dog [[…{This is Dog}]]` | containers; tooltip via UrlBuilder |
| usecase/kolibo-58-rata251 | top-level entity url (rectangle) | containers |

## Family B — inline `[[url label]]` in text
**Java**: `klimt/creole/command/CommandCreoleUrl.java:56,73-82`; per run `klimt/creole/legacy/AtomText.java:197-198`
`startUrl`, `:235-236` `closeUrl` (each run/sprite its own `<a>`); `klimt/drawing/svg/UGraphicSvg.java:160-162`.
Owners: entity desc (`BodyFactory.create3`), notes, link labels (`SvekEdge` Display), cluster titles (`ClusterHeader`),
legends. Jar: `<a …><text fill="#00F" text-decoration="underline">label</text></a>`; inside `<g class="link">` for labels,
inside the note's `<g class="entity">` for notes.

**Port**
- Creole OK: `core/klimt/creole/command/CommandCreoleUrl.ts:77-93` (registered `legacy/CommandCreoleBuilder.ts:164`);
  `legacy/StripeSimple.ts:135-140` (`activeUrl`), `:159-163`, `:262-270` (`flushPending` stamps url on text atoms);
  `atom/Atom.ts:49-55` `CreoleAtomUrl`, text variant `url?`.
- Inline atoms drop it: `StripeSimple.ts:230` pushes `{kind:'inline', atom, ambientFont}` with no url; `Atom.ts:57-70`
  inline variant has no `url` (only `insideUrl` via `markUrlProvenance` `:257-259`).
- Draw drops it: `core/svek/image/EntityImageDescriptionDelegates.ts:174-189` `drawTextAtom` (called `:247-250`
  `descAtomOps.drawU`) — entity desc (`buildDesc` `:376+`), note bodies (`leaf-sizing.ts:318` → `buildDesc`), cluster titles
  (`EntityImageDescriptionClusterTitle.ts:35-47`). And `EntityImageDescriptionTextBlock.ts:90-169` `drawAtoms` (text
  `:101-106`) — `buildTextBlock` (`:212`): edge labels (`SvekEdge.ts:330-336` `drawLabelBlock`), port labels
  (`renderer-entity.ts:265`), cluster stereotype labels (`renderer-cluster.ts:121`).
- Correct helper exists: `core/annotations/blocks-creole-atoms.ts:164-196` `drawAtom`, `urlCapable` `:172-182` (legends
  already use it, `annotations/blocks-creole.ts:183`). `TextBlockWithUrl.ts` is block granularity — wrong for this.
- Link-label draw input is raw (`renderer-edge.ts:74-82`); `link-edge-attrs.ts:139-141,380,453,460` resolve to plain text
  for DOT/measure only. Un-tabled `SvekEdge.ts:305-321` `UText.build` prints `[[` raw (reachability unconfirmed).
- No sizer change expected (`creole-atoms-measure.ts:113` honors `insideUrl`).
- Shared consumers: class (`class-namespace-title-table.ts`, `class-namespace-usymbol-shape.ts`,
  `renderer-usymbol-entity.ts`, `class-layout-leaf-shapes.ts`, `class-hidetext-shield.ts`, `class-leaf-magnetic-border.ts`,
  `renderer-entity-port.ts`), SvekEdge in class (`class-edge-geo.ts:355`) and state (`state-renderer-transitions.ts`).
  67 class fixtures contain `[[`; members already wrap at block level (`cucadiagram/TextBlockTracer.ts:96-100`) → nested
  `<a>` risk (T0b).

| fixture | text kind | jar `<a>` |
|---|---|---|
| component/xufexu-38-fola855 | note body | 2 |
| component/tuliba-37-liza126 | note body | 1 |
| component/nevuzi-33-duna992 | link label | 1 |
| usecase/malumi-33-safu797 | link label | 1 |
| usecase/bivira-53-boja685 | entity desc (sprite inside url on map2) | 2 |
| usecase/vivido-49-nisu863 | entity desc (sprites inside url) | 9 |
| unknown/gubexu-05-dufu787 | archimate display | 1 |
| unknown/jajeve-56-poza115 | archimate display | 3 |
| unknown/jobuje-80-mopu051 | rectangle display + note body | 2 |

## Family C — edge `path @id`
- Java: `abel/Link.java:106-120` `idCommentForSvg()` = `getEntity1().getName() + "-" + getEntity2().getName()` (and
  `-to-`/`-backto-`); `abel/Entity.java:686-688`; `plasma/Quark.java:84-86` `getName()` = leaf segment. Jar:
  `<!--link ccc03 to ccc05-->`, `<path id="ccc03-ccc05">`.
- Port: `core/svek/SvekEdge.ts:225-236` (comment, id from `input.from/to`); `description/renderer-edge.ts:115-116`
  `bareEntityName(edge.from)`; `namespace-groups.ts:150,174-177` `bareEntityName` strips only the scope key;
  `:54-69` `leafDisplayName(id, sep)`. `layout-geo-post.ts:84` `from: link.from`; `EdgeMapping` `:34-40` no separator;
  `layout.ts:245,255-263,278,402`. `drawEdge` (`renderer-edge.ts:151-158`) has 6 params already.
- Minimal fix: `DescriptionEdgeGeo.fromName/toName` (`layout-helpers-types.ts:160-165`), set in `assembleEdgeGeo`
  (`layout-geo-post.ts:76-88`) via `leafDisplayName(bareEntityName(link.from), m.namespaceSeparator)`; `rawMapping` gets
  `namespaceSeparator` (`layout.ts:255-263`); `renderer-edge.ts:115-116` prefers `fromName`. Do NOT change `SvekEdge.ts` or
  `bareEntityName`. Check `description-elk-adapter.ts` for edge `from` use.
- Rows: component/fidati-41-kofe029, kofovu-01-niti223, tojitu-03-ruto643 (88 `@id` diffs each at bb5b660d9).

## Open questions (resolve in-task)
1. `topurl` at the seam (D4: `theme.topurl`). 2. `element-grammar-nosymbol.ts:29-40` DECORATION consumes `[[url]]` for
`RE_BARE_DECORATED_DECL`/`RE_BARE_QUOTED_DECL` — trace capture groups (T1a). 3. Sprite-inside-url atom order (bivira map2,
vivido) — T0b measures the jar. 4. Class nested-anchor risk — T0b. 5. Un-tabled edge label `[[` (SvekEdge.ts:319).
6. `description-elk-adapter.ts` edge `from` and node url.

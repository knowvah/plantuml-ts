# The cucadiagram base contract (Track SI-1)

The typed shared entity/link model the G-1..G-7 greenfield rebuilds consume.
Landed by mission SI1 (`plans/si1-cucadiagram-base/`, 2026-08-06). Every
member carries `@see` provenance to its Java origin; upstream names are
preserved throughout. The base is import-clean of `src/diagrams/**`
(guarded: `tests/architecture/cucadiagram-base-imports.test.ts`).

## Model surface

| Module | Type | Consumed for |
|---|---|---|
| `src/core/plasma/` | `Quark<D>`, `Plasma<D>`, `PEntry` | namespaced identity tree (parent/name/qualifiedName/children/data) |
| `src/core/abel/LeafType.ts` | 51-value union + `isLikeClass` | leaf classification across every cuca diagram type |
| `src/core/abel/GroupType.ts` | 8-value union | group classification |
| `src/core/abel/Entity.ts` (+`EntityBase`) | class, 60 members | the leaf/group model: quark, bodier, display, stereotype, symbol, colors, ports, together, notes, neighborhood |
| `src/core/abel/Link.ts` (+`LinkBase`) | class, 65 members | edges: `sameConnections` (dedup), `getInv`, decor/type/arg |
| `src/core/abel/LinkArg.ts` | fluent builder | label/quantifiers/roles/kal/distance-angle |
| `src/core/abel/Together.ts`, `EntityUtils.ts`, `EntityGenderUtils.ts`, `EntityPort.ts`, `EntityPosition.ts` | support | grouping, gender predicates, port names |
| `src/core/decoration/` | `LinkType`, `LinkDecor` (25, with data), `LinkStyle`, `LinkMiddleDecor`, `WithLinkType` (incl. `isSingle`) | arrow semantics; NOTE `LinkType.equals` is reference-compare on style (upstream `==`) |

## Diagram base

`src/core/cucadiagram/CucaDiagram.ts` (+`Base`,`Base2`; net/atmp origin,
75 members): quark navigation (`quarkInContext`), leaf/group creation
(`createLeaf`, `gotoGroup`/`endGroup`), link management (`addLink` with
the `-[single]->` dedup via `containsSimilarLink`), hide/show folds,
portions. Supertype slice: `src/core/TitledDiagram.ts` (abstract;
`getSkinParam()` abstract until SkinParam.create is ported). Export
pipeline members are typed deferred throws (file-maker subsystems
unported).

## The DOT bridge shape

`DotData`'s constructor contract (dot/DotData.java:85-96) is carried by
three fully-ported interfaces: `cucadiagram/GroupHierarchy.ts`,
`cucadiagram/PortionShower.ts`, `abel/EntityFactory.ts`. A future svek
consumption passes (entityFactory, topParent, links, leafs,
groupHierarchy, portionShower).

## Body layer

`cucadiagram/BodyFactory.ts`: `createLeaf`/`createGroup` (Bodier
routing), `create1` (member list → BodyEnhanced1), `create2` (title
Display → BodyEnhanced1 — the folder/package path), `create3`
(→ BodyEnhanced2). `MethodsOrFieldsArea` (with `TextBlockTracer`,
`Elected`), `Bodier`/`BodierAbstract`/`BodierSimple`/
`BodierLikeClassOrObject`/`BodierJSon`/`BodierMap`, `Member`,
`BodyEnhanced1/2/Abstract`. Style inputs ride the ADR-9 config seam
(`BodyEnhanced1Config.ts`, `MethodsOrFieldsAreaConfig.ts`) — resolved
font/config values, not live Style objects, until the skin/style
subsystem ports.

## Consumption rules (ADR-1/ADR-3 of the SI1 brief)

- Existing engines are NOT on the base; each migration is its own
  mission. Today's consumers: the shared dedup hook
  (`cucadiagram/linkDedup.ts` — description/class/state parsers) and the
  folder-title sizing route (`description/leaf-sizing-folder-title.ts`).
- New (greenfield) cuca-family work MUST build on this base rather than
  growing another silo.
- The base stays unexported from `src/index.ts` until a public consumer
  exists.

## Known deferrals (typed throws, all `@see`'d)

Export/file-maker pipeline (CucaDiagram), `SkinParam.create`
(TitledDiagram.getSkinParam), `Display.hasUrl` (ADR-8 note in T5),
`DisplayPositioned.createRibbon`, render halves behind the ADR-9 seams
(`resolveVisibilityStyle`, `nestedDiagramRenderer`), and the skin/
package remainder (~8k lines) — each surfaces as a typed throw at the
exact upstream call site, never a silent fallback.

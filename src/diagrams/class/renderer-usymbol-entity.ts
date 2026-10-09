/**
 * renderer-usymbol-entity.ts — SI14 T4: draws a class-diagram `usecase`/
 * `actor` leaf through the SAME faithful `EntityImageDescription.drawU`
 * path the description engine's `renderer-entity.ts#drawEntity` already
 * uses, replacing the hand-rolled `renderUseCaseIcon`/`renderActorIcon`
 * string renderers (`core/usymbol-shapes.ts`) for the ONE case that
 * actually matters: their label placement is content-dependent (a fitted
 * ellipse's own stored centre, `TextBlockInEllipse.java`), not the fixed
 * `cy + 2.6667` constant those two hand-rolled shapes used.
 *
 * Mirrors `description/renderer-entity.ts#buildEntityParams` field-for-
 * field, sourced from `ClassifierGeo` instead of `DescriptionNodeGeo` —
 * a parallel assembly of the SAME upstream params, not a call to it (this
 * engine's own `class-layout-leaf-shapes.ts#measureUsecaseOrActor`
 * already established this "route through the description engine's
 * faithful primitives, keep the composition class-local" split for
 * SIZING; this is the matching DRAW half, ADR-1/ADR-2).
 *
 * Deliberately NOT threaded (same scope as the pre-T4 icon renderers,
 * zero behavior change): stereotype labels (class-diagram usecase/actor
 * carries none) and `deltaShadow` (class-geo-types.ts's own `ClassifierGeo
 * .shadowing` doc comment: jar draws no shadow for an
 * `EntityImageDescription`-family shape here). Entity hyperlinks ARE
 * threaded (cdd3-T10, S-11: `classifier.url`); `classifier.color` IS
 * threaded (cdd5-T3b, see {@link resolveBackcolor}); `hexagonPolygon` is
 * always `null` (cdd5-T3b, see {@link buildUSymbolEntityParams}).
 *
 * @see ~/git/plantuml/.../svek/image/EntityImageDescription.java
 * @see plans/si14-usymbol-measurement-sharing/decisions.md (ADR-1, ADR-2)
 */
import type { ClassifierGeo } from './class-geo-types.js';
import type { ScaledTheme } from './class-scale-geo.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { spriteDimsLookupFor, type SpriteRegistry } from '../../core/sprite-commands.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { UDrawable } from '../../core/klimt/shape/UDrawable.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { renderDrawableToFragment, type DrawableFragment } from '../../core/klimt/document-shell.js';
import {
  EntityImageDescription,
  type EntityImageDescriptionParams,
  type EntityImageDescriptionStereotypeSprite,
} from '../../core/svek/image/EntityImageDescription.js';
import { resolveStereotypeSprite } from '../../core/svek/image/EntityImageDescriptionDelegates.js';
import { upstreamKeyword, mapComponentStyle, resolveActorStyle } from '../../core/decoration/symbol/usymbol-resolve.js';
import { makeAtomImageResolverFor } from '../../core/creole-atoms-image-resolver.js';
import { KEYWORD_TO_SYMBOL, type USymbol } from '../../core/descriptive-keywords.js';
// cdd7 T2b: the style-resolution helpers moved to a sibling (500-line cap).
import {
  resolveCorners,
  titleAlignmentFor,
  resolveBackcolor,
  resolveForecolor,
  resolveStroke,
  resolveLeafFonts,
} from './renderer-usymbol-entity-style.js';

/**
 * `EntityImageDescriptionParams.symbol.keyword` for one class-diagram leaf
 * routed through this file: `usecase`/`descriptive`+`actor` (SI14 T4),
 * plus cdd-T22's `circle` (E8) and `descriptive`+`component` (cacoma)
 * additions, plus cdd3-T12's `descriptive`+`rectangle` (sijisi) addition,
 * plus cdd5-T3b's every-other-descriptive-usymbol widening (see
 * {@link usesClassUSymbolEntity}).
 *
 * `classifier.usymbol` (`Classifier.usymbol`, `ast.ts`) carries the RAW
 * matched keyword text, not the canonical `USymbol` spelling -- a business
 * variant keeps its trailing slash (`actor/`, not `actor-business`;
 * `class-declaration-parser.ts#resolveDeclKind`'s `usymbol: rawKind`, and
 * `class-multiline-element.ts`'s `open[1]!.toLowerCase()`, both store the
 * literal source token). `KEYWORD_TO_SYMBOL` (`core/descriptive-keywords
 * .ts`, the SAME table `ALL_TYPES`/`DESCRIPTIVE_LEAF_KEYWORDS` are derived
 * from) is the one normalizer for that keyword -> `USymbol` mapping
 * (`actor/` -> `actor-business`, `portin`/`portout` -> `port`, `archimate`
 * -> `rectangle`, identity for every other entry) -- mirrors upstream's own
 * single `USymbols.fromString` factory (`decoration/symbol/USymbols.java:
 * 60-95`), so this reads it rather than re-deriving a second, hand-picked
 * mapping (cdd5-T3b fixed `fepulu-27-soci473`'s `actor/` leaf, which the
 * pre-fix raw cast fed straight through as an invalid `USymbol` value).
 */
function resolveSymbolKeyword(classifier: ClassifierGeo): USymbol {
  // cdd5-T4b: a `usecase/` leaf carries its raw keyword and falls through to
  // the `KEYWORD_TO_SYMBOL` normalizer below (`usecase/` -> `usecase-business`,
  // `abel/Entity.java:412-413`).
  if (classifier.kind === 'usecase' && classifier.usymbol === undefined) return 'usecase';
  if (classifier.kind === 'circle') return 'circle';
  const raw = classifier.usymbol;
  if (raw === undefined) return 'actor';
  return KEYWORD_TO_SYMBOL.get(raw) ?? (raw as USymbol);
}

/**
 * Assembles `EntityImageDescriptionParams` for one usecase/actor/circle/
 * component leaf, from exactly what `ClassifierGeo` + `Theme` already
 * carry — the draw-time counterpart to `class-layout-leaf-shapes.ts
 * #measureUsecaseOrActor`/`#measureCircleInterface`'s sizing-time params
 * (`leaf-sizing-entity.ts#buildSizingEntityParams` for usecase/actor), now
 * with REAL paint instead of a sizing placeholder.
 *
 * `roundCorner`: 0 for usecase/actor/circle (`TextBlockInEllipse`,
 * `ActorStickMan`, `CircleInterface2` all ignore `SymbolContext
 * #getRoundCorner` entirely), {@link COMPONENT_ROUND_CORNER} for
 * `component` (`USymbolComponent2#drawComponent2` DOES read it — the
 * jar's `rect/@rx="2.5"` on `cacoma-43-poxu615`, structural diff before
 * this task). `diagonalCorner: 0` for all four (unused by every shape this
 * file reaches).
 */
/**
 * cdd7 T2b (dezobu-62-vuzu421): `EntityImageDescription.java:192-194` --
 * a `<<$name>>` stereotype whose `Stereotype#getSprite`
 * (`Stereotype.java:108-117`) resolves REPLACES the stereo block. Resolved
 * through the SAME `resolveStereotypeSprite` + `spriteDimsLookupFor`
 * narrowing the sizer (`leaf-sizing-entity.ts#spriteLabel`) uses, so the
 * drawn sprite cannot differ from the measured one -- the class twin of
 * `description/renderer-entity.ts#spriteLabel`.
 */
function stereotypeSpriteLabel(
  classifier: ClassifierGeo,
  sprites: SpriteRegistry | undefined,
): { stereotypeSprite?: EntityImageDescriptionStereotypeSprite } {
  const lookup = sprites === undefined ? undefined : spriteDimsLookupFor(sprites);
  const resolved = resolveStereotypeSprite(classifier.stereotypeSprite, lookup);
  return resolved === undefined ? {} : { stereotypeSprite: resolved };
}

export function buildUSymbolEntityParams(
  classifier: ClassifierGeo,
  theme: ScaledTheme,
  sprites: SpriteRegistry | undefined,
): EntityImageDescriptionParams {
  const symbolKeyword = resolveSymbolKeyword(classifier);
  const display = classifier.rows[0]?.text ?? classifier.id;
  const { fontTitle, fontBody, fontStereo } = resolveLeafFonts(classifier, theme, symbolKeyword);
  // cdd3-T28 (E3-14): unconditional, as upstream computes it (see
  // ELEMENT_ROUND_CORNER's doc) -- `package`'s `USymbolFolder` tab reads it
  // too (the jar's `A2.5,2.5` arcs on gujigi-63-roki030). cdd7 T2b: plus the
  // stereotype-signed tier (`resolveCorners`).
  const { roundCorner, diagonalCorner } = resolveCorners(classifier, theme, symbolKeyword);
  const titleAlignment = titleAlignmentFor(symbolKeyword, theme);
  const stroke = resolveStroke(classifier, theme, symbolKeyword);
  return {
    // cdd3-T10 (S-11): the entity's own url (`getUrl99()`), drawn by
    // `EntityImageDescription#drawU`'s `startUrl`/`closeUrl` pair.
    entity: { name: classifier.id, uid: '', qualifiedName: classifier.id, location: null, url: classifier.url ?? null },
    symbol: {
      keyword: upstreamKeyword(symbolKeyword),
      actorStyle: resolveActorStyle(theme.actorStyle),
      componentStyle: mapComponentStyle(theme.componentStyle),
    },
    // cdd3-T28 (E3-14): `codeDisplay` is `entity.getName()` (java:180) -- the
    // leaf id, as the sizer's `measureShownFolderTitle(node.id, ...)` reads.
    // cdd6 b2 (journal row 39): `EntityImageDescription.java:198`
    // `portionShower.getVisibleStereotypeLabels(entity)` -- was `[]`.
    labels: {
      codeName: classifier.id,
      displayText: display,
      stereotypeLabels: classifier.visibleStereotypeLabels ?? [],
      ...stereotypeSpriteLabel(classifier, sprites),
    },
    paint: {
      forecolor: resolveForecolor(classifier, theme, symbolKeyword),
      backcolor: resolveBackcolor(classifier, theme, symbolKeyword),
      roundCorner,
      diagonalCorner,
      deltaShadow: 0,
      stroke,
      // cdd6 b2 (journal row 46): `BodyEnhancedAbstract.java:121-123`
      // `getDefaultThickness()` = the entity's own `LineThickness` -- the
      // border stroke's value (`plantuml.skin:91-93`), not root's 1.0.
      defaultThickness: stroke.getThickness(),
      fontTitle,
      // `fc` (`style`, not `styleTitle`, java:173) -- the `desc` font when the
      // display differs from the code name, so a package's bold title style
      // does not leak into its label (`buildDesc`).
      fontBody,
      fontStereo,
      titleAlignment,
      stereotypeAlignment: HorizontalAlignment.CENTER,
      // cdd7 T1c (xuloxo-85): `style.wrapWidth()` -> `desc`
      // (`EntityImageDescription.java:185-189`); `skinparam wrapWidth` is
      // `PName.MaximumWidth` on `SName.element` (`FromSkinparamToStyle.java
      // :250`). The sizer already reads it (`class-layout-generic-classifier
      // .ts#buildDescriptionLeafOpts`); without it the draw re-measured the
      // unwrapped line and drew a wider rect than the layout reserved.
      wrapWidth: theme.wrapWidth ?? 0,
    },
    links: [],
    fixCircleLabelOverlapping: theme.fixCircleLabelOverlapping === true,
    // cdd6 b2 (journal row 40): `SvgNanoParser.java:187-215` -- an unset
    // sprite `stroke-width` inherits the entity's own ambient stroke.
    atomImageResolverFor: makeAtomImageResolverFor(sprites, stroke),
    // cdd5-T3b (`xagomi-49-caki729`): `EntityImageDescription.java:334-341`'s
    // `drawHexagon` -- `bibliotekon.getNode(entity).getPolygon()` -- is
    // upstream's OWN "no computed shape for this node" state (`if (hexagon
    // != null) { ... }`, silently drawing nothing further), not the
    // `bibliotekon == null` defensive throw one line above it (dead
    // upstream: `GeneralImageBuilder.createEntityImageBlock`'s only two
    // callers, `GraphvizImageBuilder`/`CucaDiagramFileMakerSmetana#getBibliotekon`,
    // both always pass a real object). This engine has never threaded the
    // DOT-computed node polygon onto `ClassifierGeo` (would need
    // `class-dot-graph.ts`/`layout.ts`, outside this task's write-set), so
    // `null` is the honest, currently-true state for EVERY hexagon leaf this
    // engine draws -- not a fitted value chosen to dodge the throw. Verified
    // against `xagomi-49-caki729`'s golden (`!pragma layout smetana`, where
    // Smetana's own node has no stored polygon either): the jar draws ONLY
    // the label text, no hexagon outline, exactly what `hexagonPolygon:
    // null` produces here. A non-Smetana hexagon leaf still lacks its
    // outline after this fix -- an accepted, reported residual, not a new
    // regression (pre-fix, EVERY hexagon leaf drew as a wrong class box).
    hexagonPolygon: null,
  };
}
// #lizard forgives -- straight-line params-object assembly plus one ternary,
// mirrors renderer-entity.ts#buildEntityParams's identical shape/length for
// the same reason.

/** Whether a class-diagram leaf routes through {@link renderClassUSymbolEntity}
 *  rather than the generic classifier box -- usecase/`descriptive`+actor
 *  (SI14 T4), plus cdd-T22's `circle` (E8) and `descriptive`+`component`
 *  (cacoma-43-poxu615) additions, plus cdd-B7FU-R3's `descriptive`+`database`
 *  addition (`daxeno-00-kasu166`'s collapsed-empty `package "..." <<Database>>
 *  {}` leaf): `core/usymbol-shapes.ts#renderDatabaseIcon` hand-rolls a SINGLE
 *  middle-anchored `<text>` for `display`, with no creole/multi-line support,
 *  where upstream's `USymbolDatabase#asSmall` (`asSmall`, already ported at
 *  `core/decoration/symbol/USymbolDatabase.ts:178-203`) draws a REAL
 *  `TextBlockUtils.mergeTB(stereotype, label, CENTER)` -- exactly what
 *  `EntityImageDescription`'s `desc`/`buildDesc` already builds for
 *  usecase/actor/component.
 *
 *  cdd3-T12 (sijisi-94-ripu606): `descriptive`+`rectangle` addition. Upstream
 *  draws EVERY leaf with a resolved `USymbol` (`Entity#getUSymbol` never
 *  returns null -- `EntityImageDescription.java:217-224`'s own fallback to
 *  `componentStyle().toUSymbol()`) through this SAME `EntityImageDescription`
 *  class; a plain `rectangle "foo3"` leaf under `allow_mixing` resolves to
 *  `USymbols.RECTANGLE` (`USymbolRectangle.java`, already ported at
 *  `core/decoration/symbol/USymbolRectangle.ts`) exactly like `component`
 *  resolves to `USymbols.COMPONENT2`. Pre-T12 this fell through to
 *  `renderClassifierBox` (`renderer.ts#renderClassifier`), which draws the
 *  generic name+members class box complete with its visibility-icon badge --
 *  `sijisi-94-ripu606`'s golden `foo3` has neither members nor a badge, only
 *  a plain `rx="2.5"`-rounded rect and a left-anchored `<text>`.
 *
 *  The other three `usymbol-shapes.ts` icons (`renderComponentIcon` is dead
 *  for this engine since `component` routes here too, `renderActorIcon`/
 *  `renderUseCaseIcon` are the SAME pre-existing SI14 T4 story) already had
 *  no live class-engine caller; `renderUSymbolIcon` never had a `rectangle`
 *  entry either (`core/usymbol-shapes.ts:219-224`'s `USYMBOL_ICONS` map),
 *  so this dispatch widening -- not a new icon renderer -- is upstream's own
 *  fix: `rectangle` was never meant to draw as a class box.
 *
 *  cdd3-T28 (E3-14, gujigi-63-roki030): `descriptive`+`package` addition --
 *  an `allowmixing` `package "Elektronisk dokument"` leaf with no body is a
 *  `LeafType.DESCRIPTION` entity with `USymbols.PACKAGE`, which
 *  `GeneralImageBuilder.java:160-167` hands to `EntityImageDescription`
 *  (`USymbolFolder` tab path + bold title), not the class box. Exported so
 *  `renderer.ts`'s own dispatch (over its 500-line cap) stays a single call.
 *
 *  cdd5-T3b (`desc-leaf-classbox-fallback` = S2 `descriptive-usymbol-render-
 *  allowlist`, 20+ rows): widened from the hand-picked 6-symbol list above
 *  to EVERY remaining `descriptive` usymbol, mirroring upstream's actual
 *  rule instead of growing the list one fixture at a time --
 *  `GeneralImageBuilder.java:160-167`'s `LeafType.DESCRIPTION` branch (every
 *  non-usecase/state/native-class leaf a `USymbol` keyword produces,
 *  `CommandCreateElementMultilines.java:182-187`/`CommandCreateElementFull2
 *  .java`) routes to `EntityImageDescription` UNCONDITIONALLY -- there is no
 *  per-USymbol allowlist upstream, and the `USE_INTERFACE_EYE1`/`EYE2`
 *  globals that would otherwise intercept it are both `false`
 *  (`GlobalConfig.java:45-46`). The SAME unconditional-DESCRIPTION rule
 *  ALSO covers `GeneralImageBuilder.java:200-204`'s `LeafType.EMPTY_PACKAGE`
 *  branch (`if (leaf.getUSymbol() != null) return new
 *  EntityImageDescription(...)`) -- a collapsed-empty container that
 *  carries a USymbol (`queue Q { }`, `frame F { }`, `package P <<Frame>>
 *  { }`) is ALSO a `descriptive`-kind `ClassifierGeo` with that usymbol
 *  stamped on it by `class-container.ts#closeContainer` (`leaf.usymbol =
 *  usymbol`) -- one gate covers both upstream branches, no separate
 *  EMPTY_PACKAGE check needed here.
 *
 *  `port` (normalized from `port`/`portin`/`portout`) stays excluded -- a
 *  SEPARATE, already-diagnosed, out-of-this-task's-write-set family.
 *  Upstream checks `LeafType.PORTIN`/`PORTOUT` BEFORE `DESCRIPTION`
 *  (`GeneralImageBuilder.java:122-127`) and draws `EntityImagePort`, a
 *  third image class this port has never built (`class-portin-unported`,
 *  `bonaco-71-xefu608`, S3 diagnosis) -- excluded so this leaf keeps
 *  falling to the SAME `renderClassifierBox` fallback it already used, not
 *  a newly-wrong `EntityImageDescription` draw.
 *
 *  `hexagon` IS included (cdd5-T3b, `xagomi-49-caki729`) -- see
 *  {@link buildUSymbolEntityParams}'s `hexagonPolygon: null` for why that
 *  is faithful rather than a crash-avoidance shortcut.
 */
export function usesClassUSymbolEntity(classifier: ClassifierGeo): boolean {
  if (classifier.kind === 'usecase' || classifier.kind === 'circle') return true;
  if (classifier.kind !== 'descriptive' || classifier.usymbol === undefined) return false;
  return KEYWORD_TO_SYMBOL.get(classifier.usymbol) !== 'port';
}

/**
 * Draws one usecase/actor/circle/component/database/rectangle `ClassifierGeo` via
 * `EntityImageDescription.drawU`, translated to its absolute layout
 * position (mirrors `description/renderer-entity.ts#drawEntity`'s
 * `ug.apply(new UTranslate(node.x, node.y))` positioning), and unwraps the
 * result via T1's `renderDrawableToFragment` seam (ADR-2). The returned
 * fragment's `body` already carries EntityImageDescription's OWN
 * `<!--entity NAME--><g class="entity" ...>` wrap (`DecorateEntityImage.ts
 * #decorateEntityDrawing`) — jar-verified against `class-usecase-inline-
 * sprite/golden.svg`'s `<!--entity UC1-->`, NOT the class engine's own
 * `renderer-group.ts#wrapEntity` `<!--class NAME-->` comment every OTHER
 * classifier kind gets — so the caller must splice `body` in directly,
 * never re-wrap it with `wrapEntity`.
 *
 * `uid` doubles as both the entity's own `data-uid`/`id` attribute value
 * AND the fragment's id-namespace seed (`RenderDrawableToFragmentOptions
 * .uid`'s own doc comment) — the SAME uid `renderClass`'s classifier loop
 * already assigns via `uidPlan.classifierUid`, so reusing it here needs no
 * new uniqueness scheme.
 */
export function renderClassUSymbolEntity(
  classifier: ClassifierGeo,
  theme: ScaledTheme,
  measurer: StringMeasurer,
  sprites: SpriteRegistry | undefined,
  uid: string,
): DrawableFragment {
  const params = buildUSymbolEntityParams(classifier, theme, sprites);
  const image = new EntityImageDescription({ ...params, entity: { ...params.entity, uid } });
  const drawable: UDrawable = {
    drawU(ug: UGraphic): void {
      image.drawU(ug.apply(new UTranslate(classifier.x, classifier.y)));
    },
  };
  return renderDrawableToFragment(drawable, {
    width: classifier.x + classifier.width,
    height: classifier.y + classifier.height,
    measurer,
    uid,
  });
}

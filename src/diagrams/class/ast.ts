/**
 * AST type definitions for PlantUML class diagrams.
 */

// ---------------------------------------------------------------------------
// Member types — split into class-member-ast.ts to keep this file under the
// line cap; re-exported here so `import type { Member, Visibility } from
// './ast.js'` still works for existing/expected import sites.
// ---------------------------------------------------------------------------

import type { Member, Visibility } from './class-member-ast.js';
export type { Member, Visibility };
import type { UrlInfo } from './class-url.js';
export type { UrlInfo };

import type { DiagramAnnotations, DisplayPositioned } from '../../core/annotations/index.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { ScaleSpec } from '../../core/scale-command.js';

// ---------------------------------------------------------------------------
// Map row types
// ---------------------------------------------------------------------------

/**
 * One `key => value` entry inside a `map Name { ... }` body
 * (`BodierMap`'s `Map<String, String>`). `key`/`value` mirror the raw
 * (trimmed) text either side of `=>` — upstream stores them without further
 * parsing (a map row's value is opaque display text, not a typed member).
 *
 * A row created from the linked-entry form (`key *-> dest`, no `=>`) has
 * `value` = {@link MAP_POINT_SENTINEL} and `linkedCode` set to the resolved
 * destination classifier's id.
 *
 * `''` used to double as that marker here. It cannot: `BodierMap
 * #addFieldOrMethod` trims the right-hand side of `=>` but never rejects an
 * empty result, so `key => ` stores a genuine `""` — a REAL cell that
 * `TextBlockMap` measures (2*5 margin), draws (as `StripeSimple`'s
 * empty-stripe `" "` fallback atom) and gives a column `vline`, while the
 * `"\0"` `Point` gets none of the three. Fixtures: fusopu-05-loxo960,
 * guzojo-14-muxa584, vimavu-26-civo110, satuco-50-vusa163.
 * @see ~/git/plantuml/.../cucadiagram/BodierMap.java
 */
/**
 * The `MapRow.value` a `key *-> dest` linked row carries — upstream's own
 * literal (`map.put(s.substring(0, pos).trim(), "\0")`,
 * `cucadiagram/BodierMap.java:79`), which `TextBlockMap#getTextBlock`
 * short-circuits to a `TextBlockMap.Point` before any creole runs
 * (`cucadiagram/TextBlockMap.java:173-174`).
 */
export const MAP_POINT_SENTINEL = '\0';

export interface MapRow {
  key: string;
  value: string;
  /**
   * Destination classifier id for a `key *-> dest` linked row — set
   * alongside the {@link ClassDiagramAST.relationships} entry the same body
   * line produces (class-map-commands.ts). Absent for a plain `key => value`
   * row with no link token.
   */
  linkedCode?: string;
}

// ---------------------------------------------------------------------------
// JSON leaf value type — ONE definition shared by class and state, under
// core/command/JsonNode.ts (mission shared-seam-extraction D7). Re-exported
// here so `import type { JsonNode } from './ast.js'` still works for
// existing/expected import sites.
// ---------------------------------------------------------------------------

import type { JsonNode } from '../../core/command/JsonNode.js';
export type { JsonNode };

// ---------------------------------------------------------------------------
// Classifier / Relationship / Note types moved to sibling modules to keep
// this file under the line cap. Imported for local use by Namespace /
// ClassDiagramAST below AND re-exported so `from './ast.js'` sites are
// unchanged.
// ---------------------------------------------------------------------------

import type { ClassifierKind, Classifier } from './class-classifier-ast.js';
export type { ClassifierKind, Classifier };
import type { RelationshipType, LinkDecor, MiddleDecor, Relationship } from './class-relationship-ast.js';
export type { RelationshipType, LinkDecor, MiddleDecor, Relationship };
import type { NotePosition, ClassNote } from './class-note-decl-ast.js';
export type { NotePosition, ClassNote };
import type {
  HideTarget,
  HideShowDirective,
  HideStereotypeDirective,
  RemoveRestoreDirective,
  HideShowPatternDirective,
  HideShowEntityDirective,
  HideShowKindDirective,
  HideShowVisibilityDirective,
} from './class-hideshow-ast.js';
export type {
  HideTarget,
  HideShowDirective,
  HideStereotypeDirective,
  RemoveRestoreDirective,
  HideShowPatternDirective,
  HideShowEntityDirective,
  HideShowKindDirective,
  HideShowVisibilityDirective,
};

// ---------------------------------------------------------------------------
// Namespace types
// ---------------------------------------------------------------------------

export interface Namespace {
  id: string;
  display: string;
  /** Classifier ids contained within this namespace. */
  classifiers: string[];
  /**
   * Enclosing namespace id for nested packages/namespaces (dotted names split
   * on the namespace separator, e.g. `a.b.c` → nested `a` > `a.b` > `a.b.c`);
   * absent ⇒ top-level. Mirrors upstream's Quark hierarchy.
   */
  parentId?: string;
  /**
   * G2 N2 (mechanism 3): parse-time creation order -- see
   * {@link Classifier.creationIndex}'s doc comment (same shared counter,
   * same exact/fallback gate).
   */
  creationIndex?: number;
  /**
   * A2s F-G mechanism A8: the `<<stereotype>>` off a `package`/`namespace`
   * header (inner text, `<<`/`>>` stripped -- same storage convention as
   * {@link Classifier.stereotype}). Upstream stores it on the group entity
   * (`p.setStereotype(Stereotype.build(stereotype))`,
   * CommandPackage.java:190-191 / CommandNamespace.java:123-124 /
   * CommandNamespace2.java:122-124); its only size-bearing consumer is the
   * collapsed-EMPTY-package rect leaf (`EntityImageEmptyPackage.java:126-137`
   * stereo block), threaded by `collapseEmptyNamespace`
   * (class-namespace.ts) onto the synthesized classifier. A NON-empty
   * package keeps it here unconsumed (cluster-title stereotype display is
   * not wired -- out of A8 scope).
   */
  stereotype?: string;
  /**
   * T11 (diagnosis A2b E4): the header's own `[[url]]` bracket --
   * upstream wraps the cluster's ENTIRE contents in an `<a>`
   * (`svek/Cluster.java:337-341`, `ug.startUrl(url)` before the
   * outline/line/title, closed at `:379-382`'s `finally`). Parsed via
   * `class-url.ts#parseUrlBracket`, the same `UrlInfo` shape
   * {@link Classifier.url} already uses. Grammar-captured by both
   * `package`'s and `namespace`'s header commands
   * (`class-command-containers.ts`, `class-container.ts`'s
   * `NAMESPACE_COMMANDS`); render consumer is T12 (`renderer-group.ts`'s
   * `wrapCluster`, unbuilt this task -- parse-side field only).
   * @see ~/git/plantuml/.../command/CommandPackage.java:179-181
   */
  url?: UrlInfo;
  /**
   * T11 (diagnosis A3 M3): a `package "X" #COLOR {` / `namespace X
   * #COLOR {` inline background override -- grammar-captured
   * (`NAMESPACE_COMMANDS`' `NOTE_COLOR` group) but previously discarded
   * entirely (no AST field existed to hold it). Resolved to its
   * bare/`back:` half at PARSE time via
   * `core/color-override.ts#resolveBareOrBackColor` (M1's classifier-path
   * helper, reused verbatim) -- deliberately DIFFERENT storage convention
   * from {@link Classifier.color} (which stores the RAW compound spec and
   * defers resolution to render time): a namespace's fill only ever needs
   * the background half, never the `line:`/`text:`/`line.bold` remainder
   * `resolveBareOrBackColor`'s own doc comment names as unconsumed, so
   * pre-resolving here keeps the render consumer (T12,
   * `class-namespace-shape.ts`, ahead of the global
   * `theme.colors.graph.packageBackground` fallback) to a single field
   * read with no re-parsing.
   * @see ~/git/plantuml/.../descdiagram/command/CommandPackage.java
   *      (`entity.setColors(...)`, read back at draw time)
   */
  color?: string;
  /**
   * T11: the group's own USymbol keyword (same vocabulary
   * {@link Classifier.usymbol} uses --
   * `core/descriptive-keywords.ts#KEYWORD_TO_SYMBOL`'s key set), sourced
   * from a header `<<stereotype>>` that names a USymbol registry entry
   * (A2s F-G mechanism A8's `setNamespaceStereotype` GATED branch, e.g.
   * `<<Node>>` -- `class-container.ts`). `state.descriptiveContainers`
   * (ParseState, transient) remains the SOURCE OF TRUTH the EMPTY-collapse
   * path (`closeContainer`) reads to stamp the synthesized Classifier's
   * own `usymbol` when the group ends empty; this field is a COPY taken
   * at the same call site (`setNamespaceStereotype`) for a namespace that
   * stays a real, non-collapsed cluster, so a render consumer (T12) never
   * needs to reach into ParseState internals to learn the group's shape.
   * @see ~/git/plantuml/.../command/CommandPackage.java:178-191
   * @see ~/git/plantuml/.../decoration/symbol/USymbols.java:60-95,98-120
   */
  usymbol?: string;
  /**
   * cdd-T31 (E5 defect b): `package NAME $tag {`'s `$tag` tokens
   * (`Stereotag.pattern()`, `CommandPackage.java:88-90`) -- lets
   * `computeHiddenIds` fold `hide $tag` on a package. Population is a
   * separate change (the `package` regex still discards its TAGS runs);
   * absent == `[]`.
   */
  tags?: string[];
  /**
   * cdd2-T19b: the group's OWN legend -- a `legend ... end legend` (or
   * single-line `legend text`) written inside this container's body.
   * Upstream `AbstractClassOrObjectDiagram#setLegend` routes it to
   * `currentGroup.setLegend(legend)` whenever the current group is not the
   * root (`objectdiagram/AbstractClassOrObjectDiagram.java:353-363`,
   * `abel/Entity.java:101,551-557`); `ClusterHeader#getStereoBlock` draws it
   * in the cluster header (`class-cluster-header.ts`). Absent == no legend.
   */
  legend?: DisplayPositioned;
}

// ---------------------------------------------------------------------------
// Root AST
// ---------------------------------------------------------------------------

export interface ClassDiagramAST {
  classifiers: Classifier[];
  relationships: Relationship[];
  namespaces: Namespace[];
  /**
   * cdd-T31 (A2b E5 defect a): ACTIVE `set separator` value, mirrored from
   * `ParseState.namespaceSeparator` (`description/ast.ts` precedent). Class
   * default `"."`, not `null` (`AbstractClassOrObjectDiagram.java:65` ->
   * `CucaDiagram.java:144-148`). `null` = `set separator none` (upstream's
   * `Plasma.MAGIC_SEPARATOR` reset, plasma/Plasma.java:52,85-88) -- read by
   * `class-directives-removal.ts#matchEntityName` as a diagram-level strip
   * flag (this port never threads a real magic sentinel through ids).
   */
  namespaceSeparator?: string | null;
  directives: HideShowDirective[];
  /**
   * Command-execution errors that make the whole diagram unrenderable, in
   * source order — upstream's `CommandExecutionResult.error(...)`, which
   * aborts the diagram and draws an error page instead. Currently only the
   * `allowmixing` gate populates this.
   *
   * Additive/optional for the same reason as `removeDirectives` below:
   * absent is equivalent to `[]` for every reader, so existing AST literal
   * constructors (object-diagram reuse, unit-test fixtures) are unaffected.
   * Mirrors the chart engine's own `errors`-on-geo precedent
   * (`src/diagrams/chart/renderer.ts#renderErrorDiagram`).
   */
  errors?: string[];
  /** 0-indexed source line the refusal in `errors` belongs to. */
  errorLine?: number | undefined;
  /**
   * Additive (optional, unlike `directives` above) so existing AST literal
   * constructors elsewhere (object-diagram parser reuse, unit-test fixtures)
   * are unaffected — absent is equivalent to `[]` everywhere this is read
   * (class-directives.ts#computeRemovedIds, layout.ts).
   */
  removeDirectives?: RemoveRestoreDirective[];
  /**
   * `hide`/`show` entity-pattern directives (G2 N7) -- see
   * {@link HideShowPatternDirective}. Additive/optional for the same reason
   * as `removeDirectives`: absent is equivalent to `[]` everywhere this is
   * read (class-directives.ts#computeHiddenIds, layout.ts).
   */
  hidePatternDirectives?: HideShowPatternDirective[];
  /**
   * `hide`/`show <entity> circle|members|fields|methods` directives (G2
   * N26) -- see {@link HideShowEntityDirective}. Additive/optional for the
   * same reason as `removeDirectives`/`hidePatternDirectives` -- absent is
   * equivalent to `[]` everywhere this is read
   * (class-directives.ts#applyHideShowEntityDirectives).
   */
  hideEntityDirectives?: HideShowEntityDirective[];
  /**
   * `hide`/`show <TYPE_KEYWORD> circle|members|fields|methods` directives
   * (G3/O3) -- see {@link HideShowKindDirective}. Additive/optional for the
   * same reason as `hideEntityDirectives` -- absent is equivalent to `[]`
   * everywhere this is read (class-directives.ts#applyHideShowKindDirectives).
   */
  hideKindDirectives?: HideShowKindDirective[];
  /**
   * `hide`/`show <visibility> members|fields|methods` directives (G2 N12) --
   * see {@link HideShowVisibilityDirective}. Additive/optional for the same
   * reason as `removeDirectives`/`hidePatternDirectives` -- absent is
   * equivalent to `[]` everywhere this is read
   * (class-directives.ts#applyVisibilityHideShow).
   */
  hideVisibilityDirectives?: HideShowVisibilityDirective[];
  /**
   * `hide`/`show [<<pattern>>] stereotype(s)` directives (G2 N24) -- see
   * {@link HideStereotypeDirective}. Additive/optional for the same reason
   * as `hideVisibilityDirectives` -- absent is equivalent to `[]` everywhere
   * this is read (`class-directives.ts#isStereotypeLabelHidden`).
   */
  hideStereotypeDirectives?: HideStereotypeDirective[];
  notes: ClassNote[];
  /**
   * Set to `'LR'` by `left to right direction` (upstream CommandRankDir →
   * skinparam Rankdir=LEFT_TO_RIGHT). Absent = top-to-bottom default (svek emits
   * no `rankdir` attribute then).
   */
  rankdir?: 'LR';
  /**
   * All pages, in source order, when the source contains `newpage`
   * (upstream `NewpagedDiagram`) — the first element is this same AST
   * object. Absent for single-page sources so existing callers/tests that
   * only look at the top-level AST fields are unaffected.
   * @see ~/git/plantuml/.../NewpagedDiagram.java:61-162
   */
  pages?: ClassDiagramAST[];
  /**
   * title/caption/legend/header/footer/mainframe chrome, populated by
   * {@link matchAnnotationCommand} at the parser's command-dispatch position
   * (mission G0b, decisions.md D3). Optional (unlike `directives`) so
   * existing hand-authored AST literal fixtures compile unchanged; a real
   * `parseClass()` call always sets it via `createAnnotations()` --
   * `isEmpty()` distinguishes "no chrome present" from "not yet populated".
   */
  annotations?: DiagramAnnotations;
  /**
   * `sprite $name [WxH/N[z]] { ... }` definitions (mission SI5b/T4),
   * populated by {@link matchSpriteCommand} at the SAME dispatch position
   * as {@link matchAnnotationCommand} (tried immediately after it, mirroring
   * upstream's `CommonCommands.addTitleCommands` then `addCommonCommands2`
   * registration order). Optional so hand-authored AST literal fixtures
   * compile unchanged; a real `parseClass()` call always sets it via
   * `createSpriteRegistry()`.
   */
  sprites?: SpriteRegistry;
  /**
   * `scale ...` directive (6 forms -- see `core/scale-command.ts`'s module
   * doc for the full mechanism and jar Java citations), captured
   * type-only, no layout math reads it (scale is an SVG-emission-time
   * concern only, `core/TextBlockExporter.java:205-209`) -- mirrors the
   * description engine's identical `DescriptionDiagramAST.scale` (`ast.ts`
   * doc comment) and the sequence engine's `SequenceDiagramAST.scale`.
   * `layoutClass` (T29) resolves this into a factor via
   * `resolveScaleFactor` against the FINAL unscaled document dimension and
   * multiplies the returned `ClassGeometry` by it (`class-scale-geo.ts`).
   * Absent = no `scale` directive (factor 1, byte-identical to pre-T29
   * output).
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandScale.java
   */
  scale?: ScaleSpec;
}

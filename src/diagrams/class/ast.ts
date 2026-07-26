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

import type { DiagramAnnotations } from '../../core/annotations/index.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';

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
 * `value` = `''` (upstream stores the NUL placeholder `"\0"` — the empty
 * string here has the same "no display value" meaning, since a map row
 * never legitimately has an actual empty-string value from the `=>` form:
 * `BodierMap#addFieldOrMethod` trims the right-hand side but never rejects
 * an empty result) and `linkedCode` set to the resolved destination
 * classifier's id.
 * @see ~/git/plantuml/.../cucadiagram/BodierMap.java
 */
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
// JSON leaf value type — split into class-json-ast.ts to keep this file
// under the line cap; re-exported here so `import type { JsonNode } from
// './ast.js'` still works for existing/expected import sites.
// ---------------------------------------------------------------------------

import type { JsonNode } from './class-json-ast.js';
export type { JsonNode };

// ---------------------------------------------------------------------------
// Classifier / Relationship / Note types moved to sibling modules to keep
// this file under the line cap. Imported for local use by Namespace /
// ClassDiagramAST below AND re-exported so `from './ast.js'` sites are
// unchanged.
// ---------------------------------------------------------------------------

import type { ClassifierKind, Classifier } from './class-classifier-ast.js';
export type { ClassifierKind, Classifier };
import type { RelationshipType, LinkDecor, Relationship } from './class-relationship-ast.js';
export type { RelationshipType, LinkDecor, Relationship };
import type { NotePosition, ClassNote } from './class-note-decl-ast.js';
export type { NotePosition, ClassNote };

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
}

// ---------------------------------------------------------------------------
// Hide/show directives
// ---------------------------------------------------------------------------

export type HideTarget =
  | 'empty members'
  | 'members'
  | 'circle'
  | 'empty fields'
  | 'empty methods'
  // G2 N27: bare (non-"empty") global `hide fields`/`hide methods`
  // (`CommandHideShowByGender`, GENDER absent -> every classifier, no
  // `empty` qualifier -> unconditional, not emptiness-gated).
  | 'fields'
  | 'methods';

export interface HideShowDirective {
  kind: 'hideshow';
  action: 'hide' | 'show';
  target: HideTarget;
}

/**
 * `hide|show [<<stereotype-pattern>>] stereotype(s)` (upstream
 * `CommandHideShowByGender`, `PORTION=stereotype`, G2 N24) — suppresses the
 * classifier-header stereotype TEXT ROW itself (not the classifier), either
 * for every classifier (`pattern` absent, bare `hide stereotype`) or only
 * for classifiers carrying a stereotype LABEL matching `pattern` exactly
 * (`net.atmp.CucaDiagram#isStereotypeLabelShown`'s per-label string-equality
 * check, NOT a wildcard/substring match). Distinct from
 * {@link HideShowPatternDirective} (`hide <<stereotype>>` alone hides the
 * whole ENTITY; this hides only the stereotype LABEL text, entity still
 * draws) and from {@link HideShowVisibilityDirective} (member-visibility
 * filtered, not stereotype-filtered).
 * @see ~/git/plantuml/.../classdiagram/command/CommandHideShowByGender.java
 * @see ~/git/plantuml/.../net/atmp/CucaDiagram.java#isStereotypeLabelShown
 */
export interface HideStereotypeDirective {
  kind: 'hidestereotype';
  action: 'hide' | 'show';
  /** The `<<...>>`-bracketed label pattern (including the brackets, matching
   *  {@link Classifier.stereotype}'s own guillemet-free storage AFTER a
   *  `splitStereotypeLabels`-style unwrap would strip them -- comparison is
   *  done against the wrapped form, `class-directives.ts#isStereotypeLabelHidden`'s
   *  own doc comment). Absent for the bare `hide stereotype` form (matches
   *  every stereotype label). */
  pattern?: string;
}

// ---------------------------------------------------------------------------
// Remove/restore directives
// ---------------------------------------------------------------------------

/**
 * A `remove`/`restore` directive (upstream `CommandRemoveRestore`). Unlike
 * `hide`/`show` (which only ever gates rendering — `isHidden` is never
 * consulted at the svek export boundary), `remove`/`restore` excludes the
 * matched entities from the exported graph entirely: nodes disappear and any
 * relationship/note-connector touching a removed entity is dropped too.
 * @see ~/git/plantuml/.../classdiagram/command/CommandRemoveRestore.java
 */
export interface RemoveRestoreDirective {
  kind: 'removerestore';
  action: 'remove' | 'restore';
  /**
   * Raw target expression, interpreted by
   * class-directives.ts#computeRemovedIds (mirrors `HideOrShow#isApplyable`):
   * `*` (or any `*`-wildcard pattern) matches every entity by name; `$tag`
   * matches {@link Classifier.tags}/{@link ClassNote.tags}; `<<stereotype>>`
   * matches {@link Classifier.stereotype}; `@unlinked` matches entities with
   * no non-invisible incident relationship/note-connector
   * (`Entity#isAloneAndUnlinked`); anything else is a bare/wildcard
   * id match.
   */
  what: string;
}

/**
 * A `hide`/`show <entity|$tag|<<stereotype>>|*|@unlinked>` directive (upstream
 * `CommandHideShow2#executeArg` -> `CucaDiagram#hideOrShow2`, accumulated into
 * `hides2` -- a SEPARATE list from `removed`, sharing the exact same `HideOrShow`
 * matcher class upstream). Unlike `RemoveRestoreDirective`, this ONLY gates
 * rendering (`Entity#isHidden` -> `SvekResult`'s `UHidden` wrap at draw time) --
 * the matched entity keeps its svek/DOT node (position, creationIndex/uid slot)
 * exactly as if it were never hidden; only its drawn content disappears. Ported
 * separately from the compound `hide <name> circle|methods|fields|attributes`
 * qualifier forms (`CommandHideShowByGender`/`CommandHideShowByVisibility`) --
 * upstream's own regex for THIS command requires `what` to contain no
 * whitespace unless bracketed, which is exactly the discriminator
 * `parseHideShowDirective` uses to route between the two. The
 * entity-qualified compound form is {@link HideShowEntityDirective} (G2 N26).
 * @see ~/git/plantuml/.../classdiagram/command/CommandHideShow2.java
 * @see ~/git/plantuml/.../net/atmp/CucaDiagram.java#hideOrShow2,isHidden
 */
export interface HideShowPatternDirective {
  kind: 'hideshowpattern';
  action: 'hide' | 'show';
  /** Same grammar as {@link RemoveRestoreDirective.what}. */
  what: string;
}

/**
 * `hide|show <entity> circle|circles|circled|members|member|fields|field|
 * attributes|attribute|methods|method` (upstream `CommandHideShowByGender`,
 * GENDER = a single bare/quoted entity id -- the type-keyword
 * (`class`/`object`/…) and `<<stereotype>>` GENDER forms are NOT ported,
 * see `class-directives.ts#parseHideShowEntityDirective`'s doc comment).
 * `target` reuses `HideTarget`'s `'circle'`/`'members'` spelling for those
 * two portions; `'fields'`/`'methods'` are the entity-scoped, NOT-
 * `empty`-qualified compartment-suppression portions (jar-verified:
 * unconditional, not emptiness-gated like `HideTarget`'s `'empty
 * fields'`/`'empty methods'`, `nujiga-81-peno983`).
 * @see ~/git/plantuml/.../classdiagram/command/CommandHideShowByGender.java
 */
export interface HideShowEntityDirective {
  kind: 'hideshowentity';
  action: 'hide' | 'show';
  entityId: string;
  target: 'circle' | 'members' | 'fields' | 'methods' | 'stereotype';
}

/**
 * `hide|show <TYPE_KEYWORD> circle|circles|circled|members|member|fields|
 * field|attributes|attribute|methods|method` (upstream
 * `CommandHideShowByGender`, GENDER = a diagram-wide type-keyword filter --
 * the SAME command as {@link HideShowEntityDirective}, just the OTHER
 * GENDER alternative that parser's own doc comment named as deferred, G3/O3,
 * `beruju-17-jigi548`: `hide object fields`). Applies to EVERY classifier of
 * the matching KIND, diagram-wide (no entity id) -- `classifierKind` is
 * restricted to the 6 upstream `TYPE_KEYWORDS` entries with a genuine 1:1
 * {@link ClassifierKind} mapping in this port (`class`/`abstract`/
 * `interface`/`enum`/`annotation`/`object`); upstream's remaining keywords
 * (`protocol`/`struct`/`exception`/`metaclass`/`dataclass`/`record`) have no
 * distinct `ClassifierKind` value here, so `parseHideShowKindDirective`
 * simply never matches those tokens (falls through, same "unrecognized,
 * dropped" posture as any other unmatched hide/show line). `target` is the
 * SAME vocabulary {@link HideShowEntityDirective.target} uses.
 * @see ~/git/plantuml/.../classdiagram/command/CommandHideShowByGender.java
 */
export interface HideShowKindDirective {
  kind: 'hideshowkind';
  action: 'hide' | 'show';
  classifierKind: 'class' | 'abstract' | 'interface' | 'enum' | 'annotation' | 'object';
  target: 'circle' | 'members' | 'fields' | 'methods' | 'stereotype';
}

/**
 * `hide|show [public,private,protected,package] members|fields|methods`
 * (upstream `CommandHideShowByVisibility`, G2 N12) — a member-level filter
 * keyed on visibility char x field/method-ness, DISTINCT from
 * {@link HideShowDirective}'s fixed `members`/`empty members` targets (those
 * are unconditional or emptiness-gated; this one is visibility-gated) and
 * from {@link HideShowPatternDirective} (that one matches ENTITIES by
 * id/tag/stereotype, not member visibility). `visibilities` is empty for a
 * directive with no visibility token at all (`hide members` alone never
 * reaches this parser — `parseHideShowDirective`'s fixed-target map claims
 * it first — but upstream's own grammar permits an empty visibility list
 * syntactically, silently ignored at execution, `explainArg`'s own comment).
 * @see ~/git/plantuml/.../classdiagram/command/CommandHideShowByVisibility.java
 * @see ~/git/plantuml/.../net/atmp/CucaDiagram.java#hideOrShowVisibilityModifier
 */
export interface HideShowVisibilityDirective {
  kind: 'hideshowvisibility';
  action: 'hide' | 'show';
  visibilities: Array<'public' | 'private' | 'protected' | 'package'>;
  /** `'member'` covers BOTH fields and methods (upstream's EntityPortion.MEMBER). */
  portion: 'field' | 'method' | 'member';
}

// ---------------------------------------------------------------------------
// Root AST
// ---------------------------------------------------------------------------

export interface ClassDiagramAST {
  classifiers: Classifier[];
  relationships: Relationship[];
  namespaces: Namespace[];
  directives: HideShowDirective[];
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
}

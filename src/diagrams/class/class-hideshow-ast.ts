/**
 * Hide/show + remove/restore directive AST types, split out of `ast.ts`
 * (line cap) -- re-exported from it so every `import { ... } from
 * './ast.js'` site is unchanged, mirroring `ast.ts`'s own split-and-
 * re-export convention for Member/Classifier/Relationship/ClassNote.
 */

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
  /**
   * A2s R2g: the enclosing package/namespace id when the directive line was
   * parsed INSIDE a non-root group — upstream `CommandHideShowByGender
   * #executeArg` ANDs the gender with `byPackage(getCurrentGroup())`
   * whenever the current group is non-root (classdiagram/command/
   * CommandHideShowByGender.java:272-273), and `byPackage.contains` is
   * DIRECT parent-container equality only (abel/EntityGenderUtils.java:
   * 91-104) — an entity in a nested subpackage does NOT match. Absent for a
   * root-level directive (applies to every classifier, the pre-R2g
   * behavior). Consumed via `class-directives.ts#directiveAppliesTo`.
   */
  scopeNsId?: string;
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
  /**
   * cdd-T31 (E5 defect c): enclosing group's id when parsed non-root --
   * `CucaDiagram#fixWhat` (net/atmp/CucaDiagram.java:638-646) PREFIXES
   * `what` with it (+ sep) unconditionally when sep is non-magic. Stored,
   * not baked into `what`, mirroring the gender family's field above.
   */
  scopeNsId?: string;
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
  /** Same command-level group scoping as {@link HideShowDirective.scopeNsId}
   *  (CommandHideShowByGender.java:272-273 ANDs `byPackage` onto EVERY
   *  gender alternative of the command, the entity-id/`<<stereotype>>`
   *  genders included). */
  scopeNsId?: string;
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
  /** Same command-level group scoping as {@link HideShowDirective.scopeNsId}
   *  (CommandHideShowByGender.java:272-273 ANDs `byPackage` onto EVERY
   *  gender alternative of the command, the type-keyword genders included --
   *  jecopa-66-vepe168's in-package `hide enum fields` leaves the root-level
   *  enum's fields shown). */
  scopeNsId?: string;
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

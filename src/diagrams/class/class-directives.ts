/**
 * Hide/show directive parsing and post-processing for class diagrams.
 *
 * Split out of `parser.ts` to keep that file within the module line budget.
 * These functions operate only on the public `ClassDiagramAST` — they hold no
 * parse state — so they compose cleanly with the command-dispatch table.
 */

import type {
  ClassDiagramAST,
  HideShowDirective,
  HideShowEntityDirective,
  HideShowKindDirective,
  HideShowPatternDirective,
  HideTarget,
} from './ast.js';
import { directiveAppliesTo } from './class-directives-removal.js';
export { parseHideStereotypeDirective, applyStereotypeHideShow } from './class-stereotype.js';

/**
 * Map from the lowercase target string to the canonical HideTarget value.
 * Only the supported global targets are listed here.
 *
 * A2s F-A / A6: upstream's PORTION grammar is
 * `(members?|attributes?|fields?|methods?|circles?|circled?|stereotypes?)` --
 * every token optionally singular, `attributes?` an alias of the FIELD
 * portion and `circles?|circled?` of CIRCLED_CHARACTER (`getEntityPortion`'s
 * 3-char-prefix dispatch), so the singular/alias spellings map to the same
 * canonical targets here (jar-verified `zofabi-70-core205`'s `hide method`).
 * `stereotypes?` is deliberately ABSENT: `hide [<<pattern>>] stereotype(s)`
 * is owned by `parseHideStereotypeDirective` (G2 N24), which the dispatch
 * table tries right after this parser -- adding it here would steal that
 * form's line.
 * @see ~/git/plantuml/.../classdiagram/command/CommandHideShowByGender.java:82
 */
const HIDE_TARGET_MAP: Record<string, HideTarget> = {
  'empty members': 'empty members',
  'empty member': 'empty members',
  members: 'members',
  member: 'members',
  circle: 'circle',
  circles: 'circle',
  circled: 'circle',
  'empty fields': 'empty fields',
  'empty field': 'empty fields',
  'empty attributes': 'empty fields',
  'empty attribute': 'empty fields',
  'empty methods': 'empty methods',
  'empty method': 'empty methods',
  // G2 N27: bare global `hide fields`/`hide methods` -- distinct from
  // `empty fields`/`empty methods` above (those only hide an
  // ALREADY-empty compartment; these hide UNCONDITIONALLY, corpus-verified
  // 5-fixture reach beyond the single fixture this was first spotted on).
  fields: 'fields',
  field: 'fields',
  attributes: 'fields',
  attribute: 'fields',
  methods: 'methods',
  method: 'methods',
};

/**
 * Parse a hide/show directive line.
 * Returns null if the line is not a recognised directive.
 *
 * Matches lines of the form:
 *   hide empty members
 *   hide members
 *   hide circle
 *   hide empty fields
 *   hide empty methods
 *   hide fields
 *   hide methods
 *   show <same targets>
 */
export function parseHideShowDirective(line: string): HideShowDirective | null {
  const m = /^(hide|show)\s+(.+)$/i.exec(line);
  if (m === null) return null;

  const action = m[1]!.toLowerCase() as 'hide' | 'show';
  const targetStr = m[2]!.trim().toLowerCase();
  const target = HIDE_TARGET_MAP[targetStr];
  if (target === undefined) return null;

  return { kind: 'hideshow', action, target };
}

/**
 * Parse a `hide`/`show <entity|$tag|<<stereotype>>|*|@unlinked>` entity-
 * pattern directive (upstream `CommandHideShow2`, G2 N7 --
 * {@link HideShowPatternDirective}'s own doc comment). `WHAT` must be either
 * a single whitespace-free token or a `<<...>>`-bracketed stereotype (which
 * MAY contain internal whitespace, e.g. `<<My Stereo>>`) -- upstream's own
 * regex (`"([^%s]+|\<\<.*\>\>)"`) requires exactly this shape, which is
 * what keeps a QUALIFIED form like `hide C2 circle` (two whitespace-
 * separated tokens, not bracketed) from matching here: that form belongs to
 * a different, unported upstream command
 * (`CommandHideShowByGender`/`CommandHideShowByVisibility`) and is left for
 * `parseHideShowDirective`'s null return to drop, same as today.
 * Returns null for the global-target forms `parseHideShowDirective` already
 * owns (`members`/`circle`/`empty members`/`empty fields`/`empty methods`) --
 * callers try that parser FIRST; this one is the fallback.
 */
export function parseHideShowPatternDirective(line: string): HideShowPatternDirective | null {
  const m = /^(hide(?:-class)?|show(?:-class)?)\s+(<<.*>>|\S+)$/i.exec(line);
  if (m === null) return null;

  const action: 'hide' | 'show' = /^hide/i.test(m[1]!) ? 'hide' : 'show';
  const what = m[2]!.trim();
  // A2s F-A / A6: the global-target exclusion applies only to the BARE
  // `hide`/`show` spelling -- `hide-class`/`show-class` are their own
  // COMMAND tokens of upstream `CommandHideShow2` (java:57), never
  // dispatched to `CommandHideShowByGender`, so `hide-class Method` keeps
  // targeting the ENTITY named "Method" even though bare `hide method` is
  // now (correctly) the global methods portion.
  const explicitClassForm = /-class$/i.test(m[1]!);
  if (!explicitClassForm && HIDE_TARGET_MAP[what.toLowerCase()] !== undefined) return null;

  return { kind: 'hideshowpattern', action, what };
}

/**
 * `hide|show <entity> circle|circles|circled|members|member|fields|field|
 * attributes|attribute|methods|method` (upstream `CommandHideShowByGender`,
 * G2 N26) -- the ENTITY-QUALIFIED compound form {@link
 * HideShowPatternDirective}'s own doc comment named as unported. GENDER is
 * a single bare/quoted entity id OR (A2s F-A / B2) a `<<stereotype>>` token
 * ({@link stereotypeGenderMatches}); the type-keyword GENDER form
 * (`hide class circled`, applies to every classifier of that KIND) is
 * {@link parseHideShowKindDirective}'s (G3/O3) -- `TYPE_KEYWORD_GENDERS`
 * below excludes those keywords from matching as an entity id (so
 * `hide class circled` is correctly routed rather than mis-parsed as an
 * entity literally named "class"). `public`/`private`/`protected`/`package` are
 * ALSO excluded -- `hide private members` is
 * `HideShowVisibilityDirective`'s territory (already landed, G2
 * N12), and upstream registers that as a separate, higher-precedence
 * command for exactly this literal token set.
 * @see ~/git/plantuml/.../classdiagram/command/CommandHideShowByGender.java
 */
const ENTITY_PORTION_MAP: Record<string, HideShowEntityDirective['target']> = {
  circle: 'circle',
  circles: 'circle',
  circled: 'circle',
  member: 'members',
  members: 'members',
  field: 'fields',
  fields: 'fields',
  attribute: 'fields',
  attributes: 'fields',
  method: 'methods',
  methods: 'methods',
  // G3/O4: `EntityPortion.STEREOTYPE` -- the GENDER/PORTION form
  // (`CucaDiagram#showPortion`), distinct from the LABEL-pattern `hide
  // [<<pattern>>] stereotype(s)` command already ported separately
  // (`class-stereotype.ts#parseHideStereotypeDirective`) -- jar-verified
  // `kocupi-02-ripa662` (`hide object stereotypes`). See `ast.ts
  // #Classifier.hideStereotype`'s own doc comment for the consuming side.
  stereotype: 'stereotype',
  stereotypes: 'stereotype',
};

const VISIBILITY_GENDER_WORDS = new Set(['public', 'private', 'protected', 'package']);

/** `CommandHideShowByGender.TYPE_KEYWORDS` -- excluded from the entity-id
 *  alternative so the type-keyword GENDER form ({@link parseHideShowKindDirective},
 *  G3/O3) is left unmatched here rather than mis-read as a literal entity
 *  name. Six of these (the {@link KIND_GENDER_MAP} keys) ARE ported by that
 *  parser; the rest have no distinct `ClassifierKind` in this port and are
 *  simply never matched by either parser (silently dropped, same posture as
 *  any unrecognized directive). */
const TYPE_KEYWORD_GENDERS = new Set([
  'class',
  'object',
  'interface',
  'enum',
  'abstract',
  'annotation',
  'protocol',
  'struct',
  'exception',
  'metaclass',
  'dataclass',
  'record',
]);

/** `CommandHideShowByGender.TYPE_KEYWORDS` entries with a genuine 1:1
 *  {@link ClassifierKind} mapping in this port -- the other six upstream
 *  keywords (`protocol`/`struct`/`exception`/`metaclass`/`dataclass`/
 *  `record`) have no distinct `ClassifierKind` value here (see that type's
 *  own union), so `parseHideShowKindDirective` never matches those tokens. */
const KIND_GENDER_MAP: Record<string, HideShowKindDirective['classifierKind']> = {
  class: 'class',
  abstract: 'abstract',
  interface: 'interface',
  enum: 'enum',
  annotation: 'annotation',
  object: 'object',
};

/** A2s F-A / B2: the `<<.*>>` alternative is upstream's `<<stereotype>>`
 *  GENDER form (`CommandHideShowByGender`'s GENDER regex alternation
 *  `[%pLN_.]+|[%g][^%g]+[%g]|\<\<.*\>\>`, java:76) -- kept RAW (brackets
 *  included) in `entityId`, exactly as upstream stores the gender string
 *  and branches on `startsWith("<<")` at apply time (`HideOrShow.java:60-61`
 *  shape; the gender-portion matcher is `EntityGenderUtils#byStereotype`). */
const HIDE_SHOW_ENTITY_RE = /^(hide|show)\s+("[^"]+"|<<.*>>|[\p{L}\p{N}_.]+)\s+(\S+)\s*$/iu;

export function parseHideShowEntityDirective(line: string): HideShowEntityDirective | null {
  const m = HIDE_SHOW_ENTITY_RE.exec(line);
  if (m === null) return null;

  const action: 'hide' | 'show' = /^hide/i.test(m[1]!) ? 'hide' : 'show';
  const rawEntity = m[2]!;
  const entityLower = rawEntity.toLowerCase();
  if (VISIBILITY_GENDER_WORDS.has(entityLower) || TYPE_KEYWORD_GENDERS.has(entityLower)) return null;
  const target = ENTITY_PORTION_MAP[m[3]!.toLowerCase()];
  if (target === undefined) return null;

  const entityId = rawEntity.startsWith('"') ? rawEntity.slice(1, -1) : rawEntity;
  return { kind: 'hideshowentity', action, entityId, target };
}

/**
 * A2s F-A / B2: does `what` (a raw `<<...>>` gender token) match this
 * classifier's stereotype? Mirrors `EntityGenderUtils#byStereotype`
 * (abel/EntityGenderUtils.java:68-82): EXACT per-label equality over the
 * stereotype's `<<`-chunk list (`Stereotype#getLabels(DOUBLE_COMPARATOR)` →
 * `StereotypeDecoration#cutLabels`, which skips `<<<`-triple chunks) -- no
 * wildcard expansion, unlike `HideOrShow#match`'s `*` handling used by the
 * pattern/remove directives. Labels are compared with brackets stripped and
 * trimmed on BOTH sides because `Classifier.stereotype` stores the blob
 * outer-trimmed (see `class-stereotype.ts#splitStereotypeTokens`'s
 * reconstruction rationale).
 */
function stereotypeGenderMatches(stereotype: string | undefined, what: string): boolean {
  if (stereotype === undefined) return false;
  const pattern = what.slice(2, -2).trim();
  const re = /(<{2,3})(.*?)>{2,3}/g;
  const reconstructed = `<<${stereotype}>>`;
  let m: RegExpExecArray | null;
  while ((m = re.exec(reconstructed)) !== null) {
    // cutLabels: `if (group.startsWith("<<<") == false) result.add(...)`.
    if (m[1]!.length === 3) continue;
    if (m[2]!.trim() === pattern) return true;
  }
  return false;
}

/**
 * Apply `hide`/`show <entity> circle|members|fields|methods` directives (G2
 * N26) -- last-writer-wins per `(entityId, target)` pair (mirrors {@link
 * applyDirectives}'s per-target resolution, scoped down to one entity).
 * `members` sets BOTH `suppressFields`/`suppressMethods` -- jar-verified an
 * entity-scoped `hide X members` fully collapses the box exactly like
 * `hide fields` + `hide methods` together (`nirija-04-veti140`), not the
 * `member.hidden`-marking `applyDirectives` uses for the diagram-GLOBAL
 * `hide members` (per-row marking is unnecessary here: `preMeasureClassifiers`
 * (layout.ts) already drops a suppressed compartment's rows entirely).
 * An unresolvable `entityId` (typo, forward-reference to a namespace, …) is
 * silently a no-op, matching this port's established directive-application
 * posture elsewhere in this file.
 */
export function applyHideShowEntityDirectives(ast: ClassDiagramAST): void {
  const directives = ast.hideEntityDirectives;
  if (directives === undefined || directives.length === 0) return;

  // A2s R2g: scope keys the fold (scoped vs unscoped stay independent rules).
  const effective = new Map<string, HideShowEntityDirective>();
  for (const d of directives) {
    effective.set(`${d.entityId}\u0000${d.target}\u0000${d.scopeNsId ?? ''}`, d);
  }

  const byId = new Map(ast.classifiers.map((c) => [c.id, c] as const));
  for (const d of effective.values()) {
    const hide = d.action === 'hide';
    const { entityId, target } = d;
    // A2s F-A / B2: a `<<...>>` entityId is upstream's STEREOTYPE gender
    // (`EntityGenderUtils#byStereotype`) -- matches every classifier carrying
    // that exact stereotype label, not a single id. `show` EXPLICITLY sets
    // the flag to `false` instead of being skipped: `CucaDiagram#showPortion`
    // (net/atmp/CucaDiagram.java:570-580) is an ordered fold where the LAST
    // matching rule wins, so `hide class circled` + `show <<even>> circled`
    // must re-show the circle for `<<even>>` classifiers (jar-verified
    // `xofumu-51-jozi528`) -- which also requires this pass to run AFTER
    // `applyHideShowKindDirectives` (see the parser's call order). The fold
    // is still per-list, not source-interleaved across the kind/entity
    // lists -- a `show <<x>> p` line written BEFORE a `hide class p` line
    // would upstream re-hide; that ordering has zero corpus reach and is
    // the known limit of the split-list structure.
    // A2s R2g: group-scope gate (directiveAppliesTo) on every gender form.
    const matched = (
      entityId.startsWith('<<') && entityId.endsWith('>>')
        ? ast.classifiers.filter((c) => stereotypeGenderMatches(c.stereotype, entityId))
        : [byId.get(entityId)].filter((c) => c !== undefined)
    ).filter((c) => directiveAppliesTo(d, c));
    for (const classifier of matched) {
      if (target === 'circle') {
        classifier.hideCircle = hide;
        continue;
      }
      if (target === 'stereotype') {
        classifier.hideStereotype = hide;
        continue;
      }
      if (target === 'members') {
        classifier.suppressFields = hide;
        classifier.suppressMethods = hide;
        continue;
      }
      if (target === 'fields') {
        classifier.suppressFields = hide;
        continue;
      }
      classifier.suppressMethods = hide;
    }
  }
}

/**
 * `hide|show <TYPE_KEYWORD> circle|circles|circled|members|member|fields|
 * field|attributes|attribute|methods|method` (upstream
 * `CommandHideShowByGender`, the TYPE_KEYWORD GENDER alternative --
 * {@link HideShowKindDirective}'s own doc comment, G3/O3, `beruju-17-jigi548`).
 * SAME two-token grammar as {@link parseHideShowEntityDirective}, but the
 * first token must be a {@link KIND_GENDER_MAP} key rather than an
 * arbitrary entity id -- the two parsers are mutually exclusive by
 * construction (that parser explicitly REJECTS every `TYPE_KEYWORD_GENDERS`
 * token as an entity id), so callers may try either first with no collision.
 */
const HIDE_SHOW_KIND_RE = /^(hide|show)\s+(\S+)\s+(\S+)\s*$/i;

export function parseHideShowKindDirective(line: string): HideShowKindDirective | null {
  const m = HIDE_SHOW_KIND_RE.exec(line);
  if (m === null) return null;

  const action: 'hide' | 'show' = /^hide/i.test(m[1]!) ? 'hide' : 'show';
  const classifierKind = KIND_GENDER_MAP[m[2]!.toLowerCase()];
  if (classifierKind === undefined) return null;
  const target = ENTITY_PORTION_MAP[m[3]!.toLowerCase()];
  if (target === undefined) return null;

  return { kind: 'hideshowkind', action, classifierKind, target };
}

/**
 * Apply `hide`/`show <TYPE_KEYWORD> circle|members|fields|methods`
 * directives (G3/O3) -- last-writer-wins per `(classifierKind, target)`
 * pair, mirrors {@link applyHideShowEntityDirectives} exactly except the
 * match set is every classifier of the matching KIND (diagram-wide)
 * instead of a single entity id.
 */
export function applyHideShowKindDirectives(ast: ClassDiagramAST): void {
  const directives = ast.hideKindDirectives;
  if (directives === undefined || directives.length === 0) return;

  const effective = new Map<string, HideShowKindDirective>();
  for (const d of directives) {
    effective.set(`${d.classifierKind}\u0000${d.target}\u0000${d.scopeNsId ?? ''}`, d);
  }

  for (const d of effective.values()) {
    if (d.action !== 'hide') continue;
    const { classifierKind, target } = d;
    for (const classifier of ast.classifiers) {
      if (classifier.kind !== classifierKind) continue;
      if (!directiveAppliesTo(d, classifier)) continue; // A2s R2g scope gate
      if (target === 'circle') {
        classifier.hideCircle = true;
        continue;
      }
      if (target === 'stereotype') {
        classifier.hideStereotype = true;
        continue;
      }
      if (target === 'members') {
        classifier.suppressFields = true;
        classifier.suppressMethods = true;
        continue;
      }
      if (target === 'fields') {
        classifier.suppressFields = true;
        continue;
      }
      classifier.suppressMethods = true;
    }
  }
}

// Directive application + removal computation moved to a sibling module
// (line cap); re-exported so `from './class-directives.js'` is unchanged.
export {
  applyDirectives,
  computeRemovedIds,
  computeHiddenIds,
  filterRemovedEntities,
} from './class-directives-removal.js';

// Visibility hide/show directive family moved to a sibling module (line
// cap); re-exported so `from './class-directives.js'` is unchanged.
export { parseHideShowVisibilityDirective, applyVisibilityHideShow } from './class-directives-visibility.js';

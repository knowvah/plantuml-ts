/**
 * LeafType — the 51-value leaf-entity kind selector of the abel model:
 * which kind of leaf a `Quark`'s Entity is (class-family, usecase,
 * activity, state, Chen-ER, ports, ...).
 *
 * Upstream: abel/LeafType.java (51 values, :44-69). As-const object +
 * string union, not a TS `enum` (project convention — see
 * `src/core/skin/ActorStyle.ts`, `klimt/geom/HorizontalAlignment.ts`);
 * instance/static methods become free functions below.
 *
 * SI1/T2 (batch 1). The base gets its own faithful abel version per
 * ADR-1; existing engine leaf-kind unions (e.g. the class engine's AST
 * member kinds, `descriptive-keywords.ts`) are untouched.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/LeafType.java:44-69
 */
export const LeafType = {
  EMPTY_PACKAGE: 'EMPTY_PACKAGE',

  ABSTRACT_CLASS: 'ABSTRACT_CLASS',
  CLASS: 'CLASS',
  INTERFACE: 'INTERFACE',
  ANNOTATION: 'ANNOTATION',
  PROTOCOL: 'PROTOCOL',
  STRUCT: 'STRUCT',
  EXCEPTION: 'EXCEPTION',
  METACLASS: 'METACLASS',
  STEREOTYPE: 'STEREOTYPE',
  LOLLIPOP_FULL: 'LOLLIPOP_FULL',
  LOLLIPOP_HALF: 'LOLLIPOP_HALF',
  NOTE: 'NOTE',
  TIPS: 'TIPS',
  OBJECT: 'OBJECT',
  MAP: 'MAP',
  JSON: 'JSON',
  ASSOCIATION: 'ASSOCIATION',
  ENUM: 'ENUM',
  CIRCLE: 'CIRCLE',
  DATACLASS: 'DATACLASS',
  RECORD: 'RECORD',

  USECASE: 'USECASE',
  USECASE_BUSINESS: 'USECASE_BUSINESS',

  DESCRIPTION: 'DESCRIPTION',

  ARC_CIRCLE: 'ARC_CIRCLE',

  ACTIVITY: 'ACTIVITY',
  BRANCH: 'BRANCH',
  SYNCHRO_BAR: 'SYNCHRO_BAR',
  CIRCLE_START: 'CIRCLE_START',
  CIRCLE_END: 'CIRCLE_END',
  POINT_FOR_ASSOCIATION: 'POINT_FOR_ASSOCIATION',
  ACTIVITY_CONCURRENT: 'ACTIVITY_CONCURRENT',

  STATE: 'STATE',
  STATE_CONCURRENT: 'STATE_CONCURRENT',
  PSEUDO_STATE: 'PSEUDO_STATE',
  DEEP_HISTORY: 'DEEP_HISTORY',
  STATE_CHOICE: 'STATE_CHOICE',
  STATE_FORK_JOIN: 'STATE_FORK_JOIN',
  STATE_TRANSITION_LABEL: 'STATE_TRANSITION_LABEL',

  BLOCK: 'BLOCK',
  ENTITY: 'ENTITY',

  DOMAIN: 'DOMAIN',
  REQUIREMENT: 'REQUIREMENT',

  PORTIN: 'PORTIN',
  PORTOUT: 'PORTOUT',

  CHEN_ENTITY: 'CHEN_ENTITY',
  CHEN_RELATIONSHIP: 'CHEN_RELATIONSHIP',
  CHEN_ATTRIBUTE: 'CHEN_ATTRIBUTE',
  CHEN_CIRCLE: 'CHEN_CIRCLE',

  STILL_UNKNOWN: 'STILL_UNKNOWN',
} as const;
export type LeafType = (typeof LeafType)[keyof typeof LeafType];

/**
 * `LeafType.getLeafType(String)` — upper-cases the raw keyword
 * (`StringUtils.goUpperCase`, StringUtils.java:55-57 —
 * `toUpperCase(Locale.ENGLISH)`), maps the `ABSTRACT*`/`DIAMOND*`/
 * `STATIC*` prefixes, then falls back to `Enum.valueOf` (throws on an
 * unknown name, ported as a thrown `Error`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/LeafType.java:71-83
 */
export function getLeafType(type: string): LeafType {
  type = type.toUpperCase();
  if (type.startsWith('ABSTRACT')) return LeafType.ABSTRACT_CLASS;

  if (type.startsWith('DIAMOND')) return LeafType.STATE_CHOICE;

  if (type.startsWith('STATIC')) return LeafType.CLASS;

  const value = (LeafType as Record<string, LeafType>)[type];
  if (value === undefined)
    throw new Error(`No enum constant LeafType.${type}`);
  return value;
}

/**
 * `LeafType.LIKE_CLASS` — the 13 members rendered with the class-box
 * machinery (EnumSet, LeafType.java:85-92).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/LeafType.java:85-92
 */
const LIKE_CLASS: ReadonlySet<LeafType> = new Set([
  LeafType.ANNOTATION,
  LeafType.ABSTRACT_CLASS,
  LeafType.CLASS,
  LeafType.INTERFACE,
  LeafType.ENUM,
  LeafType.ENTITY,
  LeafType.PROTOCOL,
  LeafType.STRUCT,
  LeafType.EXCEPTION,
  LeafType.METACLASS,
  LeafType.STEREOTYPE,
  LeafType.DATACLASS,
  LeafType.RECORD,
]);

/**
 * `LeafType#isLikeClass()`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/LeafType.java:94-96
 */
export function isLikeClass(type: LeafType): boolean {
  return LIKE_CLASS.has(type);
}

/**
 * `LeafType#toHtml()` — name with `_` as spaces, lower-cased
 * (`StringUtils.goLowerCase`), then `StringUtils.capitalize`
 * (StringUtils.java:230-232: first char upper, rest lower).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/LeafType.java:99-102
 */
export function toHtml(type: LeafType): string {
  const html = type.replace(/_/g, ' ').toLowerCase();
  return html.substring(0, 1).toUpperCase() + html.substring(1).toLowerCase();
}

/**
 * LeafType.test.ts — SI1/T2: the 51-value `LeafType` enum
 * (abel/LeafType.java:44-69), `getLeafType` (:71-83), `isLikeClass`
 * (:85-96), `toHtml` (:99-102).
 */
import { describe, expect, it } from 'vitest';
import { LeafType, getLeafType, isLikeClass, toHtml } from '../../../../src/core/abel/LeafType.js';

/** Every value of abel/LeafType.java:44-69, in declaration order. */
const ALL_51 = [
  'EMPTY_PACKAGE',
  'ABSTRACT_CLASS',
  'CLASS',
  'INTERFACE',
  'ANNOTATION',
  'PROTOCOL',
  'STRUCT',
  'EXCEPTION',
  'METACLASS',
  'STEREOTYPE',
  'LOLLIPOP_FULL',
  'LOLLIPOP_HALF',
  'NOTE',
  'TIPS',
  'OBJECT',
  'MAP',
  'JSON',
  'ASSOCIATION',
  'ENUM',
  'CIRCLE',
  'DATACLASS',
  'RECORD',
  'USECASE',
  'USECASE_BUSINESS',
  'DESCRIPTION',
  'ARC_CIRCLE',
  'ACTIVITY',
  'BRANCH',
  'SYNCHRO_BAR',
  'CIRCLE_START',
  'CIRCLE_END',
  'POINT_FOR_ASSOCIATION',
  'ACTIVITY_CONCURRENT',
  'STATE',
  'STATE_CONCURRENT',
  'PSEUDO_STATE',
  'DEEP_HISTORY',
  'STATE_CHOICE',
  'STATE_FORK_JOIN',
  'STATE_TRANSITION_LABEL',
  'BLOCK',
  'ENTITY',
  'DOMAIN',
  'REQUIREMENT',
  'PORTIN',
  'PORTOUT',
  'CHEN_ENTITY',
  'CHEN_RELATIONSHIP',
  'CHEN_ATTRIBUTE',
  'CHEN_CIRCLE',
  'STILL_UNKNOWN',
] as const;

describe('LeafType values (java:44-69)', () => {
  it('has exactly the 51 upstream values, in declaration order', () => {
    expect(Object.keys(LeafType)).toEqual([...ALL_51]);
  });

  it('each value maps to its own name (as-const string union)', () => {
    for (const v of ALL_51) expect(LeafType[v]).toBe(v);
  });
});

describe('getLeafType (java:71-83)', () => {
  it('maps ABSTRACT* prefixes to ABSTRACT_CLASS', () => {
    expect(getLeafType('ABSTRACT')).toBe(LeafType.ABSTRACT_CLASS);
    expect(getLeafType('ABSTRACT_CLASS')).toBe(LeafType.ABSTRACT_CLASS);
    expect(getLeafType('abstract class')).toBe(LeafType.ABSTRACT_CLASS);
  });

  it('maps DIAMOND* prefixes to STATE_CHOICE', () => {
    expect(getLeafType('DIAMOND')).toBe(LeafType.STATE_CHOICE);
    expect(getLeafType('diamondxyz')).toBe(LeafType.STATE_CHOICE);
  });

  it('maps STATIC* prefixes to CLASS', () => {
    expect(getLeafType('STATIC')).toBe(LeafType.CLASS);
    expect(getLeafType('static_class')).toBe(LeafType.CLASS);
  });

  it('upper-cases the input before valueOf (StringUtils.goUpperCase)', () => {
    expect(getLeafType('class')).toBe(LeafType.CLASS);
    expect(getLeafType('usecase_business')).toBe(LeafType.USECASE_BUSINESS);
  });

  it('throws on an unknown name (Enum.valueOf semantics)', () => {
    expect(() => getLeafType('NO_SUCH_TYPE')).toThrow();
  });
});

describe('isLikeClass (java:85-96)', () => {
  const LIKE_CLASS: LeafType[] = [
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
  ];

  it('is true for exactly the 13 LIKE_CLASS members', () => {
    for (const v of LIKE_CLASS) expect(isLikeClass(v), v).toBe(true);
    const not = Object.values(LeafType).filter((v) => !LIKE_CLASS.includes(v));
    expect(not).toHaveLength(51 - 13);
    for (const v of not) expect(isLikeClass(v), v).toBe(false);
  });
});

describe('toHtml (java:99-102)', () => {
  it('lower-cases with underscores as spaces, then capitalizes', () => {
    expect(toHtml(LeafType.ABSTRACT_CLASS)).toBe('Abstract class');
    expect(toHtml(LeafType.CLASS)).toBe('Class');
    expect(toHtml(LeafType.USECASE_BUSINESS)).toBe('Usecase business');
    expect(toHtml(LeafType.POINT_FOR_ASSOCIATION)).toBe('Point for association');
  });
});

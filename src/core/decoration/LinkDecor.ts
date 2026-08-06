/**
 * LinkDecor — the 25-value link-extremity decoration enum: which
 * arrowhead/diamond/crowfoot/circle a link end carries, its dot-emit
 * data (margin, fill, arrowsize), the raw-token lookup tables the
 * arrow grammar uses, and the extremity-factory dispatch.
 *
 * Upstream: decoration/LinkDecor.java:71-100 (values + per-value
 * constructor data), placed under `src/core/abel/decoration/` because
 * this task's write-set is `src/core/abel/**` — the upstream package is
 * `net/sourceforge/plantuml/decoration/`, so the mirrored home would be
 * `src/core/decoration/` (flagged in the T2 report for the
 * orchestrator; a `git mv` + import fix moves it).
 *
 * As-const object + string union per project convention
 * (`src/core/skin/ActorStyle.ts`); methods become free functions.
 * SI1/T2 (batch 1); ADR-1 — the base's own faithful version. The
 * description engine's reachable-subset table
 * (`src/core/svek/extremity/link-decor.ts`) is untouched (overlap
 * journaled).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkDecor.java:71-100
 */
import type { Paint } from '../paint.js';
import type { ExtremityFactory } from '../svek/extremity/ExtremityFactory.js';
import { ExtremityFactoryArrow } from '../svek/extremity/ExtremityArrow.js';
import { ExtremityFactoryCircle } from '../svek/extremity/ExtremityCircle.js';
import { ExtremityFactoryCircleConnect } from '../svek/extremity/ExtremityCircleConnect.js';
import { ExtremityFactoryCircleCrowfoot } from '../svek/extremity/ExtremityCircleCrowfoot.js';
import { ExtremityFactoryCircleLine } from '../svek/extremity/ExtremityCircleLine.js';
import { ExtremityFactoryCrowfoot } from '../svek/extremity/ExtremityCrowfoot.js';
import { ExtremityFactoryDiamond } from '../svek/extremity/ExtremityDiamond.js';
import { ExtremityFactoryDoubleLine } from '../svek/extremity/ExtremityDoubleLine.js';
import { ExtremityFactoryExtendsLike } from '../svek/extremity/ExtremityExtendsLike.js';
import { ExtremityFactoryHalfArrow } from '../svek/extremity/ExtremityHalfArrow.js';
import { ExtremityFactoryLineCrowfoot } from '../svek/extremity/ExtremityLineCrowfoot.js';
import { ExtremityFactoryNotNavigable } from '../svek/extremity/ExtremityNotNavigable.js';
import { ExtremityFactoryParenthesis } from '../svek/extremity/ExtremityParenthesis.js';
import { ExtremityFactoryPlus } from '../svek/extremity/ExtremityPlus.js';
import { ExtremityFactorySquare } from '../svek/extremity/ExtremitySquare.js';
import { ExtremityFactoryTriangle } from '../svek/extremity/ExtremityTriangle.js';

export const LinkDecor = {
  NONE: 'NONE',
  EXTENDS: 'EXTENDS',
  COMPOSITION: 'COMPOSITION',
  AGGREGATION: 'AGGREGATION',
  NOT_NAVIGABLE: 'NOT_NAVIGABLE',
  REDEFINES: 'REDEFINES',
  DEFINEDBY: 'DEFINEDBY',
  CROWFOOT: 'CROWFOOT',
  CIRCLE_CROWFOOT: 'CIRCLE_CROWFOOT',
  CIRCLE_LINE: 'CIRCLE_LINE',
  DOUBLE_LINE: 'DOUBLE_LINE',
  LINE_CROWFOOT: 'LINE_CROWFOOT',
  ARROW: 'ARROW',
  ARROW_TRIANGLE: 'ARROW_TRIANGLE',
  ARROW_AND_CIRCLE: 'ARROW_AND_CIRCLE',
  CIRCLE: 'CIRCLE',
  CIRCLE_FILL: 'CIRCLE_FILL',
  CIRCLE_CONNECT: 'CIRCLE_CONNECT',
  PARENTHESIS: 'PARENTHESIS',
  SQUARE: 'SQUARE',
  CIRCLE_CROSS: 'CIRCLE_CROSS',
  PLUS: 'PLUS',
  HALF_ARROW_UP: 'HALF_ARROW_UP',
  HALF_ARROW_DOWN: 'HALF_ARROW_DOWN',
  SQUARE_toberemoved: 'SQUARE_toberemoved',
} as const;
export type LinkDecor = (typeof LinkDecor)[keyof typeof LinkDecor];

/** The per-value constructor data of LinkDecor.java:110-146
 *  (`decors1`, `decors2`, `margin`, `fill`, `arrowSize`). */
interface LinkDecorData {
  readonly decors1: readonly string[] | null;
  readonly decors2: readonly string[] | null;
  readonly margin: number;
  readonly fill: boolean;
  readonly arrowSize: number;
}

/**
 * LinkDecor.java:71-100 verbatim. `PARENTHESIS`'s arrowSize is
 * `GlobalConfig.USE_INTERFACE_EYE2 ? 0.5 : 1.0` with the flag a
 * compile-time `false` constant (cli/GlobalConfig.java:46), hence 1.0.
 */
const DATA: Record<LinkDecor, LinkDecorData> = {
  NONE: { decors1: null, decors2: null, margin: 2, fill: false, arrowSize: 0 },
  EXTENDS: { decors1: ['<|', '^'], decors2: ['|>', '^'], margin: 30, fill: false, arrowSize: 2 },
  COMPOSITION: { decors1: ['*'], decors2: ['*'], margin: 15, fill: true, arrowSize: 1.3 },
  AGGREGATION: { decors1: ['o'], decors2: ['o'], margin: 15, fill: false, arrowSize: 1.3 },
  NOT_NAVIGABLE: { decors1: ['x'], decors2: ['x'], margin: 1, fill: false, arrowSize: 0.5 },
  REDEFINES: { decors1: ['<||'], decors2: ['||>'], margin: 30, fill: false, arrowSize: 2 },
  DEFINEDBY: { decors1: ['<|:'], decors2: [':|>'], margin: 30, fill: false, arrowSize: 2 },
  CROWFOOT: { decors1: ['}'], decors2: ['{'], margin: 10, fill: true, arrowSize: 0.8 },
  CIRCLE_CROWFOOT: { decors1: ['}o'], decors2: ['o{'], margin: 14, fill: false, arrowSize: 0.8 },
  CIRCLE_LINE: { decors1: ['|o'], decors2: ['o|'], margin: 10, fill: false, arrowSize: 0.8 },
  DOUBLE_LINE: { decors1: ['||'], decors2: ['||'], margin: 7, fill: false, arrowSize: 0.7 },
  LINE_CROWFOOT: { decors1: ['}|'], decors2: ['|{'], margin: 10, fill: false, arrowSize: 0.8 },
  ARROW: { decors1: ['<', '<_'], decors2: ['>', '_>'], margin: 10, fill: true, arrowSize: 0.5 },
  ARROW_TRIANGLE: { decors1: ['<<'], decors2: ['>>'], margin: 10, fill: true, arrowSize: 0.8 },
  ARROW_AND_CIRCLE: { decors1: null, decors2: null, margin: 10, fill: false, arrowSize: 0.5 },
  CIRCLE: { decors1: ['0'], decors2: ['0'], margin: 0, fill: false, arrowSize: 0.5 },
  CIRCLE_FILL: { decors1: ['@'], decors2: ['@'], margin: 0, fill: false, arrowSize: 0.5 },
  CIRCLE_CONNECT: { decors1: ['0)'], decors2: ['(0'], margin: 0, fill: false, arrowSize: 0.5 },
  PARENTHESIS: { decors1: [')'], decors2: ['('], margin: 0, fill: false, arrowSize: 1.0 },
  SQUARE: { decors1: ['#'], decors2: ['#'], margin: 0, fill: false, arrowSize: 0.5 },
  CIRCLE_CROSS: { decors1: null, decors2: null, margin: 0, fill: false, arrowSize: 0.5 },
  PLUS: { decors1: ['+'], decors2: ['+'], margin: 0, fill: false, arrowSize: 1.5 },
  HALF_ARROW_UP: { decors1: null, decors2: ['\\\\'], margin: 0, fill: false, arrowSize: 1.5 },
  HALF_ARROW_DOWN: { decors1: null, decors2: ['//'], margin: 0, fill: false, arrowSize: 1.5 },
  SQUARE_toberemoved: { decors1: null, decors2: null, margin: 30, fill: false, arrowSize: 0 },
};

/**
 * The `DECORS1`/`DECORS2` token→decor maps (LinkDecor.java:117-118,
 * static block :148-158) — built by iterating declaration order, so
 * insertion order matches the enum.
 */
const DECORS1 = new Map<string, LinkDecor>();
const DECORS2 = new Map<string, LinkDecor>();
for (const decor of Object.values(LinkDecor)) {
  for (const s of DATA[decor].decors1 ?? []) DECORS1.set(s, decor);
  for (const s of DATA[decor].decors2 ?? []) DECORS2.set(s, decor);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkDecor.java:152-154 */
export function getMargin(decor: LinkDecor): number {
  return DATA[decor].margin;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkDecor.java:156-158 */
export function isFill(decor: LinkDecor): boolean {
  return DATA[decor].fill;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkDecor.java:160-162 */
export function getArrowSize(decor: LinkDecor): number {
  return DATA[decor].arrowSize;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkDecor.java:164-166 */
export function isExtendsLike(decor: LinkDecor): boolean {
  return (
    decor === LinkDecor.EXTENDS || decor === LinkDecor.REDEFINES || decor === LinkDecor.DEFINEDBY
  );
}

/**
 * `LinkDecor.lookupDecors1(String)` — `StringUtils.trin` (trim) then
 * `DECORS1.getOrDefault(s, NONE)`; null-safe.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkDecor.java:226-230
 */
export function lookupDecors1(s: string | null): LinkDecor {
  if (s === null) return LinkDecor.NONE;
  return DECORS1.get(s.trim()) ?? LinkDecor.NONE;
}

/**
 * `LinkDecor.lookupDecors2(String)`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkDecor.java:232-236
 */
export function lookupDecors2(s: string | null): LinkDecor {
  if (s === null) return LinkDecor.NONE;
  return DECORS2.get(s.trim()) ?? LinkDecor.NONE;
}

/** `Pattern.quote` equivalent — escape every regex metacharacter so the
 *  token matches literally (upstream wraps in `\Q...\E`). */
function quote(key: string): string {
  return key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * `LinkDecor.buildRegexFromDecorKeys(Set<String>)` — keys sorted by
 * descending length (prefix-conflict prevention, e.g. `||` before `|`),
 * each quoted, word-bounded when it starts/ends with `o` (so `o` decors
 * do not eat identifier letters), joined with `|` into one optional
 * group `(...)?`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkDecor.java:246-264
 */
function buildRegexFromDecorKeys(keys: Iterable<string>): string {
  const sorted = [...keys].sort((a, b) => b.length - a.length);
  const parts = sorted.map((key) => {
    const quoted = quote(key);
    const startsWithO = key.startsWith('o');
    const endsWithO = key.endsWith('o');
    if (startsWithO && endsWithO) return '\\b' + quoted + '\\b';
    if (startsWithO) return '\\b' + quoted;
    if (endsWithO) return quoted + '\\b';

    return quoted;
  });
  return '(' + parts.join('|') + ')?';
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkDecor.java:238-240 */
export function getRegexDecors1(): string {
  return buildRegexFromDecorKeys(DECORS1.keys());
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkDecor.java:242-244 */
export function getRegexDecors2(): string {
  return buildRegexFromDecorKeys(DECORS2.keys());
}

/**
 * The `getExtremityFactoryLegacy` switch (LinkDecor.java:175-224) as a
 * builder table (repo precedent: `svek/extremity/link-decor.ts` — a
 * 21-arm switch trips the lizard CCN budget). `backgroundColor` is
 * upstream's `HColor`, this port's `Paint`. Decors absent here fall to
 * upstream's `default: return null` (NONE, EXTENDS,
 * SQUARE_toberemoved). BLOCKED members (reported, not skipped):
 * `CIRCLE_CROSS` → `ExtremityFactoryCircleCross` and
 * `ARROW_AND_CIRCLE` → `ExtremityFactoryArrowAndCircle` are unported
 * repo-wide (both are token-unreachable — their `decors1`/`decors2` are
 * null) and their home `src/core/svek/extremity/` is outside this
 * task's write-set; those two branches throw until the classes land.
 */
const LEGACY_FACTORIES: Partial<Record<LinkDecor, (bg: Paint) => ExtremityFactory>> = {
  PLUS: (bg) => new ExtremityFactoryPlus(bg),
  REDEFINES: (bg) => new ExtremityFactoryExtendsLike(bg, false),
  DEFINEDBY: (bg) => new ExtremityFactoryExtendsLike(bg, true),
  HALF_ARROW_UP: () => new ExtremityFactoryHalfArrow(1),
  HALF_ARROW_DOWN: () => new ExtremityFactoryHalfArrow(-1),
  ARROW_TRIANGLE: () =>
    new ExtremityFactoryTriangle({ backgroundColor: null, xWing: 8, yAperture: 3, decorationLength: 8 }),
  CROWFOOT: () => new ExtremityFactoryCrowfoot(),
  CIRCLE_CROWFOOT: () => new ExtremityFactoryCircleCrowfoot(),
  LINE_CROWFOOT: () => new ExtremityFactoryLineCrowfoot(),
  CIRCLE_LINE: () => new ExtremityFactoryCircleLine(),
  DOUBLE_LINE: () => new ExtremityFactoryDoubleLine(),
  CIRCLE_CROSS: () => {
    throw new Error('ExtremityFactoryCircleCross not ported (SI1/T2 blocked member — see report)');
  },
  ARROW: () => new ExtremityFactoryArrow(),
  ARROW_AND_CIRCLE: () => {
    throw new Error(
      'ExtremityFactoryArrowAndCircle not ported (SI1/T2 blocked member — see report)',
    );
  },
  NOT_NAVIGABLE: () => new ExtremityFactoryNotNavigable(),
  AGGREGATION: () => new ExtremityFactoryDiamond(false),
  COMPOSITION: () => new ExtremityFactoryDiamond(true),
  CIRCLE: (bg) => new ExtremityFactoryCircle(false, bg),
  CIRCLE_FILL: (bg) => new ExtremityFactoryCircle(true, bg),
  SQUARE: (bg) => new ExtremityFactorySquare(bg),
  PARENTHESIS: () => new ExtremityFactoryParenthesis(),
  CIRCLE_CONNECT: (bg) => new ExtremityFactoryCircleConnect(bg),
};

/**
 * `LinkDecor#getExtremityFactoryComplete(HColor)` — `EXTENDS` gets the
 * 18/6/18 triangle; everything else defers to the legacy dispatch.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkDecor.java:168-173
 */
export function getExtremityFactoryComplete(
  decor: LinkDecor,
  backgroundColor: Paint,
): ExtremityFactory | null {
  if (decor === LinkDecor.EXTENDS)
    return new ExtremityFactoryTriangle({
      backgroundColor: null,
      xWing: 18,
      yAperture: 6,
      decorationLength: 18,
    });

  return getExtremityFactoryLegacy(decor, backgroundColor);
}

/**
 * `LinkDecor#getExtremityFactoryLegacy(HColor)` — see
 * {@link LEGACY_FACTORIES} for the dispatch and the two blocked
 * branches.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkDecor.java:175-224
 */
export function getExtremityFactoryLegacy(
  decor: LinkDecor,
  backgroundColor: Paint,
): ExtremityFactory | null {
  const builder = LEGACY_FACTORIES[decor];
  return builder === undefined ? null : builder(backgroundColor);
}

/**
 * A later `root` declaration of a colour beats every EARLIER declaration of
 * that colour, however specific its selector (unwind2-S5).
 *
 * Upstream's style store does not rank selectors by depth. Every value
 * carries its declaration counter (`ValueImpl.java:51-55`, fed by
 * `StyleBuilder#getNextInt`, `StyleBuilder.java:119-122`), and merging the
 * styles that match an element keeps, per property, the value with the
 * higher counter (`Style#mergeWith`, `Style.java:121-134` ->
 * `DarkString#mergeWith`, `DarkString.java:50-66`). `root` matches every
 * element, so a `root { FontColor }` written after `!theme amiga` (whose
 * `skinparam Activity { FontColor }` came first) colours the activity text;
 * a `skinparam defaultFontColor` -- which IS `root { FontColor }`,
 * `FromSkinparamToStyle.java:157` -- does the same.
 *
 * The port's `Theme` is flat: element fields win over `colors.text` by
 * construction. So, before the runs are applied, an earlier element-scoped
 * declaration of a colour that a later `root` redeclares is dropped -- it
 * cannot win upstream. Stereotype selectors are kept: their values carry
 * `DELTA_PRIORITY_FOR_STEREOTYPE` (`StyleLoader.java:61`) on top of the
 * counter and outrank any plain declaration.
 *
 * Granularity: each skinparam is one declaration; a run of consecutive
 * `<style>` blocks is one (its `root` is taken to precede its own element
 * selectors, the order every bundled theme writes them in).
 */

import { parseConditionalColor } from './klimt/color/HColorSet.js';
import type { StyleMap } from './skinparam.js';
import type { StyleSkinparamSegment } from './style-skinparam-segments.js';
import { convertSkinparam } from './style/FromSkinparamToStyle.js';
import { cleanForKeySlow } from './style/mindmap-style-builder.js';
import type { PName } from './style/PName.js';
import { StyleBuilder } from './style/StyleBuilder.js';

/** The root-cascade colours this applies to: `<style>` key and `PName`. */
const ROOT_COLOURS: readonly (readonly [string, PName])[] = [
  ['fontcolor', 'FontColor'],
  ['linecolor', 'LineColor'],
];

/** `StyleMap` selectors that ARE the root: `root` and bare top-level lines. */
const ROOT_SELECTORS: ReadonlySet<string> = new Set(['root', '']);

/** Where a skinparam's converted styles land, per colour. */
interface SkinparamTarget {
  /** Colours it declares on the bare `root` signature. */
  readonly root: ReadonlySet<PName>;
  /** Colours it declares on a narrower, stereotype-free signature. */
  readonly narrower: ReadonlySet<PName>;
  /** Whether it declares anything else (then it is never dropped). */
  readonly other: boolean;
}

/** `FromSkinparamToStyle` over every cleaned key (`SkinParam.java:227-234`). */
function skinparamTarget(key: string, value: string): SkinparamTarget {
  const root = new Set<PName>();
  const narrower = new Set<PName>();
  let other = false;
  for (const cleaned of cleanForKeySlow(key)) {
    for (const style of convertSkinparam(cleaned, value, new StyleBuilder())) {
      const signature = style.getSignature();
      const isRoot = signature.names.length === 1 && signature.names[0] === 'root';
      const stereotyped = signature.getStereotypes().size > 0;
      for (const [, pname] of ROOT_COLOURS) {
        if (!style.hasValue(pname)) continue;
        if (isRoot) root.add(pname);
        else if (!stereotyped) narrower.add(pname);
        else other = true;
      }
      other ||= ROOT_COLOURS.every(([, pname]) => !style.hasValue(pname));
    }
  }
  return { root, narrower, other };
}

/** A selector naming a stereotype: an empty dotted part (`.foo`, `class..bar`). */
function isStereotypeSelector(selector: string): boolean {
  return selector.split('.').some((part) => part === '');
}

/** One declaration: a skinparam entry, or a whole `<style>` run. */
type Unit =
  | { readonly kind: 'skinparam'; readonly key: string; readonly value: string; readonly target: SkinparamTarget }
  | { readonly kind: 'style'; readonly styleMap: StyleMap };

function unitsOf(segments: readonly StyleSkinparamSegment[]): Unit[][] {
  return segments.map((segment) =>
    segment.kind === 'style'
      ? [{ kind: 'style', styleMap: segment.styleMap }]
      : [...segment.entries].map(([key, value]) => ({
          kind: 'skinparam',
          key,
          value,
          target: skinparamTarget(key, value),
        })),
  );
}

/** Whether `unit` declares colour `[styleKey, pname]` on the root. */
function declaresRoot(unit: Unit, [styleKey, pname]: readonly [string, PName]): boolean {
  if (unit.kind === 'skinparam') return unit.target.root.has(pname);
  return [...ROOT_SELECTORS].some((selector) => unit.styleMap.get(selector)?.has(styleKey) === true);
}

/** `unit` with the shadowed colours removed; `undefined` when nothing is left. */
function withoutShadowed(unit: Unit, shadowed: ReadonlySet<string>): Unit | undefined {
  if (unit.kind === 'skinparam') {
    const pnames = ROOT_COLOURS.filter(([key]) => shadowed.has(key)).map(([, pname]) => pname);
    const dropped = !unit.target.other && unit.target.root.size === 0 && unit.target.narrower.size > 0;
    return dropped && [...unit.target.narrower].every((p) => pnames.includes(p)) ? undefined : unit;
  }
  const styleMap: StyleMap = new Map();
  unit.styleMap.forEach((props, selector) => {
    const keep = isStereotypeSelector(selector) && !ROOT_SELECTORS.has(selector);
    styleMap.set(selector, keep ? props : new Map([...props].filter(([k]) => !shadowed.has(k))));
  });
  return { kind: 'style', styleMap };
}

/** Back to segments, keeping the run boundaries (and empty runs) as they were. */
function segmentsOf(
  units: readonly (readonly (Unit | undefined)[])[],
  from: readonly StyleSkinparamSegment[],
): StyleSkinparamSegment[] {
  return from.map((segment, i): StyleSkinparamSegment => {
    const kept = units[i]!.filter((u): u is Unit => u !== undefined);
    const style = kept.find((u) => u.kind === 'style');
    if (style !== undefined) return style;
    if (segment.kind === 'style') return segment;
    return {
      kind: 'skinparam',
      entries: new Map(kept.flatMap((u) => (u.kind === 'skinparam' ? [[u.key, u.value]] : []))),
    };
  });
}

function lastIndexOf<T>(items: readonly T[], test: (item: T) => boolean): number {
  for (let i = items.length - 1; i >= 0; i--) if (test(items[i]!)) return i;
  return -1;
}

/**
 * The runs with every declaration a LATER root colour shadows removed (see
 * the module doc). Run boundaries are kept, so the application order of
 * what remains is unchanged.
 */
export function dropRootShadowed(segments: readonly StyleSkinparamSegment[]): StyleSkinparamSegment[] {
  const grouped = unitsOf(segments);
  const flat = grouped.flat();
  const lastRoot = new Map(
    ROOT_COLOURS.map((colour) => [colour[0], lastIndexOf(flat, (u) => declaresRoot(u, colour))]),
  );
  let position = 0;
  const filtered = grouped.map((units) =>
    units.map((unit) => {
      const at = position++;
      const shadowed = new Set([...lastRoot].filter(([, last]) => at < last).map(([key]) => key));
      return shadowed.size === 0 ? unit : withoutShadowed(unit, shadowed);
    }),
  );
  return segmentsOf(filtered, segments);
}

/**
 * The `root` colours a skinparam run declares, as `<style> root` entries:
 * `skinparam defaultFontColor` IS `root { FontColor }`
 * (`FromSkinparamToStyle.java:157`), so the merged `root` style the chrome
 * and element resolvers read must carry it at its position. A conditional
 * `#?light:dark` value is left out (see `build-theme.ts#rootCascadeSkinparams`).
 */
export function rootColoursOf(entries: ReadonlyMap<string, string>): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of entries) {
    if (parseConditionalColor(value) !== undefined) continue;
    const { root } = skinparamTarget(key, value);
    for (const [styleKey, pname] of ROOT_COLOURS) if (root.has(pname)) out.set(styleKey, value);
  }
  return out;
}

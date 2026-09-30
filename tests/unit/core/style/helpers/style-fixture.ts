/**
 * Builds port `Style`s from the jar-dumped storage fixtures in
 * `../fixtures/`, and reads them back into the same JSON shape for
 * comparison.
 *
 * The fixtures were dumped from the 1.2026.8beta1 oracle jar by a scratch
 * probe (reflection over `StyleBuilder.storage` / `Style.map` /
 * `ValueImpl.value`, then `Idea.getStyle()` on every parsed idea) — the
 * same jar and entry point as the T0c `StyleProbe`
 * (`plans/mindmap-engine-port/tools/probe/`). Each stored style is
 * `{ snames, level, star, stereotypes, values: { PName: [value1, value2,
 * priority] } }`: `snames` in `EnumSet` (ordinal) order, `stereotypes`
 * sorted, `level` -1 for "no level" (StyleKey.java:56).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Style } from '../../../../../src/core/style/Style.js';
import { StyleSignatureBasic } from '../../../../../src/core/style/StyleSignatureBasic.js';
import { ValueImpl } from '../../../../../src/core/style/ValueImpl.js';
import { enumSetOrder } from '../../../../../src/core/style/StyleKey.js';
import { PNAMES, type PName } from '../../../../../src/core/style/PName.js';
import type { SName } from '../../../../../src/core/style/SName.js';
import type { Value } from '../../../../../src/core/style/Value.js';

/** `[value1, value2, priority]` of one `DarkString`. */
export type DumpedValue = readonly [string | null, string | null, number];

export interface DumpedStyle {
  readonly snames: readonly SName[];
  readonly level: number;
  readonly star: boolean;
  readonly stereotypes: readonly string[];
  readonly values: Readonly<Partial<Record<PName, DumpedValue>>>;
}

export interface DumpedIdea {
  readonly branch: 'regular' | 'reverse';
  readonly label: string;
  readonly level: number;
  readonly style: DumpedStyle;
}

export interface DumpedScenario {
  readonly storage: readonly DumpedStyle[];
  readonly ideas: readonly DumpedIdea[];
}

const FIXTURES = new URL('../fixtures/', import.meta.url);

function readFixture(name: string): unknown {
  return JSON.parse(readFileSync(fileURLToPath(new URL(name, FIXTURES)), 'utf8'));
}

/** The jar's storage after loading `plantuml.skin` alone (`* r` source). */
export function skinStorageDump(): readonly DumpedStyle[] {
  return readFixture('plantuml-skin-storage.json') as readonly DumpedStyle[];
}

/** Per scenario: the jar's full storage and every idea's `Idea.getStyle()`. */
export function ideaScenarioDump(name: 'depth' | 'stereo'): DumpedScenario {
  return (readFixture('mindmap-idea-styles.json') as Record<string, DumpedScenario>)[name] as DumpedScenario;
}

/** A counter that always yields `priority` (feeds `ValueImpl.dark`). */
function fixedPriority(priority: number): { getNextInt(): number } {
  return { getNextInt: () => priority };
}

/** One `ValueImpl` holding exactly the dumped `DarkString`. */
export function valueFromDump([value1, value2, priority]: DumpedValue): Value {
  if (value1 === null) return ValueImpl.dark(value2 as string, fixedPriority(priority));
  const regular = ValueImpl.regular(value1, priority);
  // regular + dark combine keeping the regular priority (DarkString.java:59-62)
  if (value2 === null) return regular;
  return regular.mergeWith(ValueImpl.dark(value2, fixedPriority(priority)));
}

/** The signature a `Context.push` declaration would carry. */
export function signatureFromDump(d: Omit<DumpedStyle, 'values'>): StyleSignatureBasic {
  let sig = StyleSignatureBasic.of(...d.snames);
  if (d.level !== -1) sig = sig.addLevel(d.level);
  for (const s of d.stereotypes) sig = sig.addStereotype(s);
  if (d.star) sig = sig.addStar();
  return sig;
}

export function styleFromDump(d: DumpedStyle): Style {
  const map = new Map<PName, Value>();
  for (const name of PNAMES) {
    const v = d.values[name];
    if (v !== undefined) map.set(name, valueFromDump(v));
  }
  return new Style(signatureFromDump(d), map);
}

/** Reads `value.toString()` (`DarkString#toString`, "v1/v2 (p)") back into a tuple. */
function dumpValue(v: Value): DumpedValue {
  const m = /^(.*)\/(.*) \((-?\d+)\)$/.exec(v.toString());
  if (m === null) throw new Error(`not a DarkString: ${v.toString()}`);
  const orNull = (s: string | undefined): string | null => (s === 'null' || s === undefined ? null : s);
  return [orNull(m[1]), orNull(m[2]), Number(m[3])];
}

/** The inverse of {@link styleFromDump}, for whole-style comparison. */
export function dumpStyle(style: Style): DumpedStyle {
  const key = style.getSignature().getKey();
  const values: Partial<Record<PName, DumpedValue>> = {};
  for (const name of PNAMES) if (style.hasValue(name)) values[name] = dumpValue(style.value(name));
  return {
    snames: enumSetOrder(key.snames),
    level: key.level,
    star: key.isStared,
    stereotypes: [...style.getSignature().getStereotypes()].sort(),
    values,
  };
}

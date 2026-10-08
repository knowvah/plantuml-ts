/**
 * unwind2-S4: `create`, `return` and the after-delay refusal, pinned against
 * jar renders.
 *
 *  - A create message (`AbstractMessage#isCreate`) ends at the created head's
 *    edge, draws that head at its tile top, and starts its lifeline there
 *    (`teoz/CommunicationTile.java:186-190,347-371,395-426`,
 *    `teoz/LivingSpace.java:150-167,194-196`).
 *  - `return` replies along the latest ACTIVATING message and deactivates it
 *    (`command/CommandReturn.java:103-160`, `SequenceDiagram.java:352-413`).
 *  - `SequenceDiagram#activate` refuses any life event right after a delay
 *    (`:368-369`), and `addMessage` refuses a message that cannot take a
 *    pending create (`:207-211`).
 *
 * Each `tests/fixtures/unwind2-S4/<name>.puml` sits beside the jar's
 * `<name>.svg`, rendered by `scripts/oracle-render.sh`. The sequence engine is
 * not yet `compareSvg`-conformant, so geometry is pinned as the ordered list
 * of every rect/line/ellipse/polygon's numbers.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/unwind2-S4');
const RE_SHAPE = /<(rect|line|ellipse|polygon) ([^>]*)\/>/g;
const RE_TEXT = /<text[^>]*>([^<]*)<\/text>/g;
const ASSUMED = / \(Assumed diagram type: \w+\)$/;
const GEOMETRY: Record<string, readonly string[]> = {
  rect: ['x', 'y', 'width', 'height'],
  line: ['x1', 'y1', 'x2', 'y2'],
  ellipse: ['cx', 'cy'],
  polygon: ['points'],
};
const Y_ONLY: Record<string, readonly string[]> = {
  rect: ['y', 'height'],
  line: ['y1', 'y2'],
  ellipse: ['cy'],
  polygon: [],
};

function source(name: string): string {
  return readFileSync(join(FIXTURES, `${name}.puml`), 'utf-8');
}

function jar(name: string): string {
  return readFileSync(join(FIXTURES, `${name}.svg`), 'utf-8');
}

function ours(name: string): string {
  return renderSync(source(name), { measurer: new WidthTableMeasurer() });
}

function shapesOf(svg: string, attrs: Record<string, readonly string[]>): string[] {
  return [...svg.matchAll(RE_SHAPE)].map((m) => {
    const values = attrs[m[1]!]!.map((a) => new RegExp(`\\b${a}="([^"]*)"`).exec(m[2]!)?.[1]);
    return `${m[1]!} ${values.join(',')}`;
  });
}

function heightOf(svg: string): string | undefined {
  return /height="(\d+)px"/.exec(svg)?.[1];
}

function expectGeometryLikeJar(name: string, attrs = GEOMETRY): void {
  const [o, j] = [ours(name), jar(name)];
  expect(heightOf(o)).toBe(heightOf(j));
  expect(shapesOf(o, attrs)).toEqual(shapesOf(j, attrs));
}

/** The message the jar's error page draws last, without the routing suffix. */
function jarError(name: string): string {
  const texts = [...jar(name).matchAll(RE_TEXT)].map((m) => m[1]!);
  return texts.at(-1)!.replace(ASSUMED, '');
}

function ourRefusal(name: string): string | undefined {
  const lines = source(name)
    .split('\n')
    .filter((l) => !l.startsWith('@'));
  const result = parseSequence(lines);
  return 'refused' in result ? result.message : undefined;
}

describe('unwind2-S4: create', () => {
  it('draws the created heads in the body, starts their lifelines there', () => {
    expectGeometryLikeJar('create-message');
  });

  it('a right-to-left create ends at the head`s far edge (posD)', () => {
    expectGeometryLikeJar('create-reverse');
  });

  it('`A -> C **` after a delay is refused silently: C is a plain participant', () => {
    expectGeometryLikeJar('delay-arrow-create');
  });

  it('a self message cannot take a pending create', () => {
    expect(ourRefusal('create-self-error')).toBe(jarError('create-self-error'));
    const texts = [...ours('create-self-error').matchAll(RE_TEXT)].map((m) => m[1]!);
    expect(texts.at(-1)).toBe([...jar('create-self-error').matchAll(RE_TEXT)].at(-1)![1]);
  });
});

describe('unwind2-S4: return', () => {
  // y only: the x of an activated lifeline still diverges (`LivingSpace
  // #getPosC2`), which is the participant row's, not the return's.
  it('closes the activation the return replies along, innermost first', () => {
    expectGeometryLikeJar('return-activation', Y_ONLY);
  });

  it('with nothing activating, replies to the last message without deactivating', () => {
    expectGeometryLikeJar('return-last-message', Y_ONLY);
  });

  it('an exo message is nowhere to return to', () => {
    expect(ourRefusal('return-exo-error')).toBe(jarError('return-exo-error'));
  });
});

describe('unwind2-S4: life events after a delay are refused', () => {
  it('`activate` right after `...`', () => {
    expect(ourRefusal('delay-activate-error')).toBe(jarError('delay-activate-error'));
  });

  it('`create` right after `...`', () => {
    expect(ourRefusal('delay-create-error')).toBe(jarError('delay-create-error'));
  });

  it('a bare `deactivate` with nothing activating', () => {
    expect(ourRefusal('deactivate-nothing-error')).toBe(jarError('deactivate-nothing-error'));
  });
});

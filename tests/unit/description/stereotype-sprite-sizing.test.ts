/**
 * F4-f: a `<<$name>>` stereotype must resolve to its SPRITE, not fall back to
 * being measured as `«name»` guillemet TEXT.
 *
 * These assertions are NOT covered by the description size ratchet: the four
 * archimate fixtures are pinned at their pre-fix deltas (0.242882 and up), so
 * a regression back to the text fallback would still measure BELOW its pin and
 * report `unchanged` rather than `widened`. The ratchet only ever tightens
 * when a pin is deleted, and these pins cannot be deleted while the oracle-jar
 * skew documented in `plans/s1l-tail-fix/findings/svg-sprite-ceil-vs-floor.md`
 * stands. Hence a direct test.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';
import { buildSpriteAssetsStore } from '../../helpers/sprite-assets-store.js';

/** `DotInputGraph` node dims are already in PIXELS (not inches). */
function nodeDims(markup: string): { width: number; height: number }[] {
  const graphs: DotInputGraph[] = [];
  setLayoutInputObserver((g) => graphs.push(g));
  try {
    renderSync(markup, { measurer: new WidthTableMeasurer(), assetStore: buildSpriteAssetsStore() });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return (graphs[0]?.nodes ?? []).map((n) => ({ width: n.width, height: n.height }));
}

const HEAD = '@startuml\nskinparam rectangle {\n  Shadowing False\n}\n';
const TAIL = '@enduml\n';
const plain = `${HEAD}rectangle "Technology Interface" as A\nrectangle "z" as Z\n${TAIL}`;
const sprited = `${HEAD}rectangle "Technology Interface" as A <<$archimate/interface>>\nrectangle "z" as Z\n${TAIL}`;
const scaled = `${HEAD}rectangle "Technology Interface" as A <<$archimate/interface{scale=2}>>\nrectangle "z" as Z\n${TAIL}`;

describe('stereotype sprite sizing (F4-f)', () => {
  it('adds the sprite box height, not a text line', () => {
    const before = nodeDims(plain)[0]!;
    const after = nodeDims(sprited)[0]!;
    // `archimate/interface` declares viewBox "0 0 19.995 19.928" -> a 20x20
    // declared box (UImageSvg#getData, Math.ceil). A text fallback would add
    // one 14px stereotype line instead -- the bug this guards.
    const addedPx = Math.round(after.height - before.height);
    expect(addedPx).toBe(20);
  });

  it('does not widen the node when the sprite is narrower than the label', () => {
    // The text fallback widened this node to fit `«interface»`; the sprite
    // (20px) is far narrower than the 146.787px label, so width must not move.
    expect(nodeDims(sprited)[0]!.width).toBeCloseTo(nodeDims(plain)[0]!.width, 9);
  });

  it('scales the sprite contribution by the requested scale', () => {
    const before = nodeDims(plain)[0]!;
    const added = (n: { height: number }): number => Math.round(n.height - before.height);
    expect(added(nodeDims(scaled)[0]!)).toBe(40);
  });

  it('leaves a plain text stereotype on the text path', () => {
    const before = nodeDims(plain)[0]!;
    const textStereo = nodeDims(`${HEAD}rectangle "Technology Interface" as A <<foo>>\nrectangle "z" as Z\n${TAIL}`)[0]!;
    // One stereotype line at the default 14px font — jar-verified (48 vs 34).
    expect(Math.round(textStereo.height - before.height)).toBe(14);
  });
});

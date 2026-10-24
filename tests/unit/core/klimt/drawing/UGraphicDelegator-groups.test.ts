/**
 * T8p piece 1 — `UGraphicDelegator#startGroup`/`#closeGroup`
 * (UGraphicDelegator.java:88-94): a decorator over any graphic must forward
 * the pair, or the `<g><title>` `ComponentRoseLine.java:80` opens under
 * `UGraphicHandwritten` is lost.
 */
import { describe, expect, it } from 'vitest';
import { UGraphicDelegator } from '../../../../../src/core/klimt/drawing/UGraphicDelegator.js';
import { UGraphicSvg } from '../../../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import type { StringBounder } from '../../../../../src/core/klimt/drawing/svg/driver-text-svg.js';
import { UGroup, UGroupType } from '../../../../../src/core/klimt/shape/UGroup.js';
import { URectangle } from '../../../../../src/core/klimt/shape/URectangle.js';
import type { UChange } from '../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';

const GROUP_ID = 'ent0001';
const bounder: StringBounder = { calculateDimension: () => ({ width: 1 }) };

/** The minimal concrete decorator: `apply` re-wraps, as `UGraphicHandwritten` does. */
class PassThrough extends UGraphicDelegator {
  apply(change: UChange): UGraphic {
    return new PassThrough(this.getUg().apply(change));
  }
}

/** A recording stand-in for the wrapped graphic. */
function recorder(log: string[]): UGraphic {
  const ug = {
    apply: (): UGraphic => ug,
    draw: (): void => undefined,
    getParam: (): never => {
      throw new Error('unused');
    },
    getTranslate: (): never => {
      throw new Error('unused');
    },
    getStringBounder: (): never => {
      throw new Error('unused');
    },
    startGroup: (g: UGroup): void => {
      log.push(`start:${JSON.stringify([...g.asMap()])}`);
    },
    closeGroup: (): void => {
      log.push('close');
    },
  };
  return ug;
}

describe('UGraphicDelegator group forwarding (UGraphicDelegator.java:88-94)', () => {
  it('forwards startGroup(group) then closeGroup() to the wrapped graphic, in order', () => {
    const log: string[] = [];
    const group = new UGroup();
    group.put(UGroupType.TITLE, 'Alice');
    new PassThrough(recorder(log)).startGroup(group);
    expect(log).toEqual([`start:${JSON.stringify([...group.asMap()])}`]);
    new PassThrough(recorder(log)).closeGroup();
    expect(log.at(-1)).toBe('close');
    expect(log).toHaveLength(2);
  });

  it('a wrapped graphic without the pair silently draws ungrouped (as the url pair does)', () => {
    const plain = recorder([]) as Partial<UGraphic> & Record<string, unknown>;
    delete plain['startGroup'];
    delete plain['closeGroup'];
    const wrapper = new PassThrough(plain as UGraphic);
    expect(() => {
      wrapper.startGroup(new UGroup());
      wrapper.closeGroup();
    }).not.toThrow();
  });

  it('over a real UGraphicSvg the draw lands inside the <g> the group opened', () => {
    const root = UGraphicSvg.build(0, basicSvgOption(), '$version$', bounder);
    const wrapper = new PassThrough(root);
    const group = new UGroup();
    group.put(UGroupType.DATA_UID, GROUP_ID);
    wrapper.startGroup(group);
    wrapper.draw(URectangle.build(4, 4));
    wrapper.closeGroup();
    expect(root.getSvgString()).toMatch(new RegExp(`<g id="${GROUP_ID}"><rect [^>]*/></g>`));
  });
});

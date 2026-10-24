import type { StringBounder } from '../../../../../../src/core/klimt/font/StringBounder.js';
import type { UChange } from '../../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../../src/core/klimt/UGraphic.js';
import type { UParam } from '../../../../../../src/core/klimt/UParam.js';
import type { UShape } from '../../../../../../src/core/klimt/UShape.js';
import type { UTranslate } from '../../../../../../src/core/klimt/UTranslate.js';

const UNUSED = 'not used in these tests';

const PARAM: UParam = {
  getStroke: () => {
    throw new Error(UNUSED);
  },
  getColor: () => '#000000',
  getBackcolor: () => '#FFFFFF',
  getTranslate: () => {
    throw new Error(UNUSED);
  },
};

const BOUNDER: StringBounder = {
  calculateDimension: () => {
    throw new Error(UNUSED);
  },
};

/** Immutable `UGraphic` double: `apply` returns a new instance, `draw` records on a shared list. */
export class FakeUGraphic implements UGraphic {
  constructor(
    readonly drawn: UShape[] = [],
    readonly applied: readonly UChange[] = [],
  ) {}

  apply(change: UChange): UGraphic {
    return new FakeUGraphic(this.drawn, [...this.applied, change]);
  }

  draw(shape: UShape): void {
    this.drawn.push(shape);
  }

  getParam(): UParam {
    return PARAM;
  }

  getTranslate(): UTranslate {
    throw new Error(UNUSED);
  }

  getStringBounder(): StringBounder {
    return BOUNDER;
  }
}

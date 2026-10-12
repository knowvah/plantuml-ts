/** Shared support for the salt element-factory tests: a token stream built
 *  by the ported tokeniser (`DataSourceImpl`) and the preferred dimension of
 *  a built element at the jar's measurer. */
import { DataSourceImpl } from '../../../../src/diagrams/salt/DataSourceImpl.js';
import type { Element } from '../../../../src/diagrams/salt/element/Element.js';
import type { Terminated } from '../../../../src/diagrams/salt/Terminated.js';
import { stringBounder } from '../salt-test-support.js';

export function source(...lines: string[]): DataSourceImpl {
  return new DataSourceImpl(lines);
}

export function dimensionOf(built: Terminated<Element>): [number, number] {
  const dim = built.getElement().getPreferredDimension(stringBounder, 0, 0);
  return [dim.getWidth(), dim.getHeight()];
}

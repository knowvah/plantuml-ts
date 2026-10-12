/**
 * `WrappedElement` (WrappedElement.java:42-58): delegates to the wrapped
 * element, always measuring it at (0, 0).
 */
import { describe, expect, it } from 'vitest';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import type { UGraphic } from '../../../../src/core/klimt/UGraphic.js';
import type { Element } from '../../../../src/diagrams/salt/element/Element.js';
import { WrappedElement } from '../../../../src/diagrams/salt/element/WrappedElement.js';
import { stringBounder } from '../salt-test-support.js';

/** Records what it was asked; its dimension echoes the requested (x, y). */
class Recorder implements Element {
  readonly measured: [number, number][] = [];
  readonly drawn: [UGraphic, number, XDimension2D][] = [];

  getPreferredDimension(_sb: StringBounder, x: number, y: number): XDimension2D {
    this.measured.push([x, y]);
    return new XDimension2D(x + 10, y + 20);
  }

  drawU(ug: UGraphic, zIndex: number, dimToUse: XDimension2D): void {
    this.drawn.push([ug, zIndex, dimToUse]);
  }
}

describe('WrappedElement', () => {
  it('measures the wrapped element at (0, 0), whatever (x, y) it is given (java:50-52)', () => {
    const inner = new Recorder();
    const dim = new WrappedElement(inner).getPreferredDimension(stringBounder, 7, 9);
    expect(inner.measured).toEqual([[0, 0]]);
    expect([dim.getWidth(), dim.getHeight()]).toEqual([10, 20]);
  });

  it('draws the wrapped element with the same graphic, z-index and dimension (java:54-56)', () => {
    const inner = new Recorder();
    const ug = {} as UGraphic;
    const dim = new XDimension2D(3, 4);
    new WrappedElement(inner).drawU(ug, 1, dim);
    expect(inner.drawn).toEqual([[ug, 1, dim]]);
    expect(inner.drawn[0]?.[0]).toBe(ug);
  });
});

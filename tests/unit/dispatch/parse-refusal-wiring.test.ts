/**
 * The `ParseRefusal` arm of `plugin.parse()`, end to end (T3 / AC4).
 *
 * T1 built the refusal type and T3 widened the contract to
 * `AST | ParseRefusal`, but no engine returns one until batch 3a. A branch
 * nobody has seen fire is not a contract, and a typecheck alone would not
 * catch the pipeline dropping the refusal on the floor and handing
 * `layoutSync` an object with no AST fields. So this file supplies the
 * refusing plugin the engines do not yet provide.
 *
 * It routes through the REAL `registry` and the REAL `renderSync`, using the
 * `object` slot: `'object'` is in this port's `DiagramType` union but no
 * object plugin is registered, so `@startobject` reaches tier 1 of `resolve()`
 * (its candidate set is the singleton `{OBJECT}`, which is not one of the
 * three types `accepts()` must arbitrate) and lands on the plugin registered
 * here. Nothing else in the suite renders `@startobject`, and vitest isolates
 * per file, so the registration cannot leak.
 */
import { describe, it, expect } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { registry, parseRefusalOf } from '../../../src/core/dispatcher.js';
import type { SyncPlugin } from '../../../src/core/dispatcher.js';
import { refuse } from '../../../src/core/parse-refusal.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fullDescription } from '../../../src/core/version.js';

const REFUSAL_MESSAGE = 'Syntax Error?';
const REFUSED_LINE = 1;

const refusingPlugin: SyncPlugin = {
  type: 'object',
  accepts: () => false,
  parse: () => refuse('syntax', REFUSED_LINE, 1, REFUSAL_MESSAGE),
  layoutSync: () => {
    throw new Error('layoutSync must never run on a refused source');
  },
  render: () => {
    throw new Error('render must never run on a refused source');
  },
};

registry.register(refusingPlugin);

const SOURCE = ['@startobject', 'object Foo', 'nonsense here', '@endobject'].join('\n');

function render(): string {
  return renderSync(SOURCE, { measurer: new DeterministicMeasurer() });
}

describe('parse() refusal — reaches the error diagram', () => {
  it('routes @startobject to the refusing plugin rather than throwing', () => {
    expect(() => render()).not.toThrow();
  });

  it('renders a PSystemError page, not a diagram', () => {
    expect(render()).toContain(`>${fullDescription()}</text>`);
    expect(render()).not.toContain('data-diagram-type=');
  });

  it("carries the refusal's own message and the refusing engine's type", () => {
    // `DiagramRefusal` -> `ErrorUml#getError` (`ErrorUml.java:63-66`), which
    // appends the assumed type. Both halves must survive the hand-off, or a
    // refusal renders as an anonymous crash.
    expect(render()).toContain(REFUSAL_MESSAGE);
    expect(render()).toContain('Assumed diagram type: object');
  });

  it('attributes the error to the line the refusal named, not the last line', () => {
    // `errorSvg` cuts the listing at the offending line, so the source AFTER
    // it is not drawn -- upstream prints the executed source "up to and
    // including" that line.
    const svg = render();
    expect(svg).toContain('object Foo');
    expect(svg).not.toContain('nonsense here');
  });
});

describe('parseRefusalOf — the narrowing the registry erases AST types for', () => {
  it('recognises a refusal', () => {
    const r = refuse('execution', 3, 2, 'boom', 7);
    expect(parseRefusalOf(r)).toBe(r);
  });

  it('does not fire on an AST that merely has fields', () => {
    expect(parseRefusalOf({ participants: [], events: [] })).toBeUndefined();
  });

  it('does not fire on null, undefined or a primitive', () => {
    expect(parseRefusalOf(null)).toBeUndefined();
    expect(parseRefusalOf(undefined)).toBeUndefined();
    expect(parseRefusalOf('refused')).toBeUndefined();
    expect(parseRefusalOf(0)).toBeUndefined();
  });
});

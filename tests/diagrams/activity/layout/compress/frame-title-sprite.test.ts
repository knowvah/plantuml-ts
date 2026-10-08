/**
 * add4 merge-T2b regression: a container whose title is a lone sprite
 * (`rectangle <$react{scale=1}>`, dot-cache/unknown/bezogu-47-vevu307 and
 * four siblings) has no `UText` ink. `SlotFinder#drawText`
 * (`klimt/compress/SlotFinder.java:127-135`) only registers a slot for a
 * drawn `UText`, so the frame title contributes no slot; registering a
 * zero-width one made `new Slot(10, 10)` throw (`Slot.java:44-46`) and the
 * source newly misrouted ACTIVITY -> NONE.
 */
import { describe, expect, it } from 'vitest';

import { renderSync } from '../../../../../src/index.js';
import { DeterministicMeasurer } from '../../../../../src/core/measurer-deterministic.js';

const SOURCE = [
  '@startuml',
  'sprite react <svg viewBox="0 0 230 230">',
  '<circle cx="115" cy="102" r="20.5" fill="#61dafb"/>',
  '</svg>',
  '',
  'rectangle <$react{scale=1}>',
  '@enduml',
].join('\n');

describe('frame title with no text ink (SlotFinder.java:127-135)', () => {
  it('renders the ACTIVITY diagram instead of an error page', () => {
    const svg = renderSync(SOURCE, { measurer: new DeterministicMeasurer() });
    expect(/data-diagram-type="([A-Z]+)"/.exec(svg)?.[1]).toBe('ACTIVITY');
  });
});

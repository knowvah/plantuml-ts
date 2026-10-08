/**
 * add4-T3g: a `""mono""` run keeps its own `monospaced` family
 * (`SkinParam.java:1068-1070`, emitted by `SvgGraphics.java:720-722`).
 */
import { describe, expect, it } from 'vitest';
import { drawActivityText } from '../../../src/diagrams/activity/activity-renderer-text.js';

const STYLE = { fontFamily: 'sans-serif', fontSize: 12, fill: '#000' } as const;

describe('drawActivityText run family', () => {
  it('emits font-family="monospace" on a ""mono"" run only', () => {
    const svg = drawActivityText(10, 20, 'Get ""Id""', STYLE);
    expect(svg).toContain('font-family="monospace">Id</text>');
    expect(svg.match(/font-family=/g)).toHaveLength(1);
  });
});

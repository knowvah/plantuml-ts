import { describe, expect, it } from 'vitest';

import { edgeColorTokens, edgeLinkStyle } from '../../../../src/diagrams/activity/layout/edge-link-style.js';

describe('edgeLinkStyle (HtmlColorAndStyle.java:86-106)', () => {
  it('is normal without a COLOR group', () => {
    expect(edgeLinkStyle({}).toString()).toBe('NORMAL(null)');
  });

  it('reads the style keyword among colour tokens', () => {
    expect(edgeLinkStyle({ color: '#red,dashed' }).toString()).toBe('DASHED(null)');
  });

  it('reads only the first rainbow member', () => {
    expect(edgeLinkStyle({ color: '#red;#blue,hidden' }).isInvisible()).toBe(false);
    expect(edgeColorTokens({ color: '#red,bold;#blue' })).toEqual(['#red', 'bold']);
  });
});

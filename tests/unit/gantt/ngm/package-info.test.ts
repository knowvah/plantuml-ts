import { describe, expect, it } from 'vitest';
import * as packageInfo from '../../../../src/diagrams/gantt/ngm/package-info.js';

// ngm/package-info.java declares no symbol.
describe('ngm/package-info', () => {
  it('exports nothing', () => {
    expect(Object.keys(packageInfo)).toEqual([]);
  });
});

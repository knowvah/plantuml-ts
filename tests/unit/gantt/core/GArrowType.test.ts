import { describe, expect, it } from 'vitest';
import { GArrowType } from '../../../../src/diagrams/gantt/core/GArrowType.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/GArrowType.java:33-35
describe('GArrowType', () => {
  it('has exactly INCOMING and OUTGOING, in declaration order', () => {
    expect(Object.values(GArrowType)).toEqual(['INCOMING', 'OUTGOING']);
  });
});

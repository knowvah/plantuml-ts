import { expect, it } from 'vitest';
import { Today } from '../../../src/diagrams/gantt/Today.js';

it('is an empty class with no own members (Today.java:38-40)', () => {
  expect(Object.getOwnPropertyNames(new Today())).toEqual([]);
  expect(Object.getOwnPropertyNames(Today.prototype)).toEqual(['constructor']);
});

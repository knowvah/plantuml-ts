import { describe, expect, it } from 'vitest';
import { MergeStrategy } from '../../../../src/core/style/MergeStrategy.js';

describe('MergeStrategy (MergeStrategy.java:38)', () => {
  it('has exactly the two upstream constants', () => {
    expect(Object.values(MergeStrategy)).toEqual(['KEEP_EXISTING_VALUE_OF_STEREOTYPE', 'OVERWRITE_EXISTING_VALUE']);
  });
});

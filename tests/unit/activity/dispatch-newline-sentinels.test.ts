import { describe, expect, it } from 'vitest';
import { decodeNewlineSentinels } from '../../../src/diagrams/activity/dispatch-newline-sentinels.js';
import {
  BLOCK_E1_NEWLINE,
  BLOCK_E1_NEWLINE_LEFT_ALIGN,
  BLOCK_E1_NEWLINE_RIGHT_ALIGN,
} from '../../../src/core/tim/builtin/jaws-constants.js';

// `activity-divergence-drive-3` T2a, family PCTN: `%n()`/`%newline()`
// already expand to `BLOCK_E1_NEWLINE` at the TIM/preprocessor stage --
// this is the FOLLOW-UP that decodes the sentinel into a real line break
// for an activity action label (`Display.java:315-339`).
describe('decodeNewlineSentinels', () => {
  it('decodes a plain BLOCK_E1_NEWLINE sentinel to a real newline', () => {
    expect(decodeNewlineSentinels(`a${BLOCK_E1_NEWLINE}b`)).toBe('a\nb');
  });

  it('decodes BOTH occurrences in one string', () => {
    expect(decodeNewlineSentinels(`1 ${BLOCK_E1_NEWLINE} fprintf( hello${BLOCK_E1_NEWLINE} , %s)`)).toBe(
      '1 \n fprintf( hello\n , %s)',
    );
  });

  it('decodes the LEFT/RIGHT-align sentinel variants to the same plain newline', () => {
    expect(decodeNewlineSentinels(`a${BLOCK_E1_NEWLINE_LEFT_ALIGN}b${BLOCK_E1_NEWLINE_RIGHT_ALIGN}c`)).toBe('a\nb\nc');
  });

  it('is a no-op on text with no sentinel', () => {
    expect(decodeNewlineSentinels('plain text')).toBe('plain text');
  });
});

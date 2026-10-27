import { describe, expect, it } from 'vitest';
import { Capture } from '../../../../src/core/ubrex/Capture.js';
import { Challenge } from '../../../../src/core/ubrex/Challenge.js';
import { ChallengeResult } from '../../../../src/core/ubrex/ChallengeResult.js';

describe('ChallengeResult (ChallengeResult.java)', () => {
  it('constants (:41-43)', () => {
    expect(ChallengeResult.NO_MATCH.getFullCaptureLength()).toBe(Challenge.NO_MATCH);
    expect(ChallengeResult.ZERO.getFullCaptureLength()).toBe(0);
    expect(ChallengeResult.ONE.getFullCaptureLength()).toBe(1);
    expect(ChallengeResult.ONE.getCapture()).toBe(Capture.EMPTY);
  });
  it('toString (:49)', () => {
    expect(new ChallengeResult(2, Capture.EMPTY.withEntry('k', 'v')).toString()).toBe('fullCaptureLength=2 [k=v]');
    expect(ChallengeResult.ZERO.toString()).toBe('fullCaptureLength=0 []');
  });
  it('delegates to the capture (:66-78)', () => {
    const cap = Capture.EMPTY.withEntry('p/a', '1').withEntry('p/a', '2');
    const r = new ChallengeResult(3, cap);
    expect(r.findValuesByKey('p/a')).toEqual(['1', '2']);
    expect(r.findFirstValuesByKeyPrefix('p')).toEqual(['1', '2']);
    expect(r.findFirstValuesByKeyPrefix('q')).toBeUndefined();
    expect(r.extractByPrefix('p').toString()).toBe('[a=1, a=2]');
    expect(r.getCapture()).toBe(cap);
  });
});

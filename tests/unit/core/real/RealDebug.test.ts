import { describe, expect, it } from 'vitest';
import { RealDebug } from '../../../../src/core/real/RealDebug.js';

describe('RealDebug', () => {
  it('create() returns null: the capture flag is the constant false (java:80-91)', () => {
    expect(RealDebug.create()).toBeNull();
  });

  it('printCreationStackTrace tolerates the null a Real holds (java:101-106)', () => {
    expect(RealDebug.printCreationStackTrace(null)).toBeUndefined();
  });

  it('the capture branch builds a Throwable-like creation point (java:94-97)', () => {
    const flag = RealDebug as unknown as { CAPTURE_CREATION_POINT: boolean };
    const original = flag.CAPTURE_CREATION_POINT;
    Object.defineProperty(RealDebug, 'CAPTURE_CREATION_POINT', { value: true, configurable: true });
    try {
      const captured = RealDebug.create();
      expect(captured).not.toBeNull();
      expect(captured?.creationPoint).toBeInstanceOf(Error);
      expect(RealDebug.printCreationStackTrace(captured)).toBeUndefined();
    } finally {
      Object.defineProperty(RealDebug, 'CAPTURE_CREATION_POINT', { value: original, configurable: true });
    }
  });
});

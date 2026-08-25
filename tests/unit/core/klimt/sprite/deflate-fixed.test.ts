/**
 * Unit tests for `deflateFixed` (src/core/klimt/sprite/deflate-fixed.ts) --
 * the fixed-Huffman LZ77 DEFLATE block the PNG encoder emits.
 *
 * Node's `zlib.inflateRawSync` is used ONLY as a test oracle: it decodes a
 * raw DEFLATE stream, so a round-trip through it proves the bitstream is
 * spec-legal. The encoder itself stays browser-safe with zero Node deps.
 */
import { describe, it, expect } from 'vitest';
import { inflateRawSync, deflateRawSync } from 'node:zlib';
import { deflateFixed } from '../../../../../src/core/klimt/sprite/deflate-fixed.js';

const roundTrip = (data: Uint8Array): Uint8Array =>
  new Uint8Array(inflateRawSync(Buffer.from(deflateFixed(data))));

describe('deflateFixed — round-trips through a real inflater', () => {
  it('reproduces highly repetitive data exactly', () => {
    const data = new Uint8Array(4096).fill(0xab);
    expect(roundTrip(data)).toEqual(data);
  });

  it('reproduces data shorter than the 3-byte minimum match', () => {
    for (const n of [1, 2, 3]) {
      const data = Uint8Array.from({ length: n }, (_, i) => i + 1);
      expect(roundTrip(data)).toEqual(data);
    }
  });

  it('reproduces incompressible data exactly', () => {
    // Deterministic pseudo-random: a fixed LCG, no Math.random.
    let seed = 12345;
    const data = Uint8Array.from({ length: 2048 }, () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed >>> 16) & 0xff;
    });
    expect(roundTrip(data)).toEqual(data);
  });

  it('reproduces input longer than the 32K window', () => {
    const data = Uint8Array.from({ length: 70000 }, (_, i) => (i * 7) & 0xff);
    expect(roundTrip(data)).toEqual(data);
  });

  // The whole point of the change: sprite scanlines are runs of identical
  // RGBA pixels, and STORED blocks paid 21x the jar for them.
  it('actually compresses RGBA-shaped runs', () => {
    const row = new Uint8Array(64 * 4);
    for (let i = 0; i < row.length; i += 4) row.set([0x20, 0x40, 0x60, 0xff], i);
    const data = new Uint8Array(65 * row.length);
    for (let y = 0; y < 65; y++) data.set(row, y * row.length);
    const out = deflateFixed(data);
    expect(out.length).toBeLessThan(data.length / 20);
    expect(roundTrip(data)).toEqual(data);
  });
});

describe('deflateFixed — determinism', () => {
  it('produces identical bytes for identical input', () => {
    const data = Uint8Array.from({ length: 5000 }, (_, i) => (i * 13) & 0xff);
    expect(deflateFixed(data)).toEqual(deflateFixed(data));
  });

  // Determinism is the encoder's founding requirement, and it is why this
  // uses FIXED Huffman codes rather than dynamic ones: no frequency pass and
  // no code-length table means no room for a heuristic to drift. zlib's own
  // output is a different (valid) encoding of the same bytes; only OUR output
  // has to be stable.
  it('is not required to match zlib byte-for-byte, only to inflate to the same bytes', () => {
    const data = new Uint8Array(1024).fill(7);
    expect(deflateFixed(data)).not.toEqual(new Uint8Array(deflateRawSync(Buffer.from(data))));
    expect(roundTrip(data)).toEqual(data);
  });
});

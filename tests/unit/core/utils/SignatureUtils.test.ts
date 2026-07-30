/**
 * SignatureUtils.test.ts — T8b: unit coverage for `SignatureUtils`
 * (utils/SignatureUtils.java), relocated out of `svek/Ports.ts` (T8).
 *
 * MD5 vectors are the standard RFC 1321 §A.5 suite (same vectors T8 used
 * in `Ports.test.ts`, carried here to their new home). SHA-512 vectors are
 * the standard NIST/FIPS 180-4 examples — cross-checked against Node's
 * `node:crypto` (`createHash('sha512')`), the same technique already used
 * elsewhere in this repo (`tests/unit/stdlib-packages.test.ts`), to rule
 * out a transcription typo rather than trusting a hand-copied literal.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { SignatureUtils } from '../../../../src/core/utils/SignatureUtils.js';

describe('SignatureUtils.getMD5Hex', () => {
  it('matches the RFC 1321 §A.5 test suite', () => {
    expect(SignatureUtils.getMD5Hex('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(SignatureUtils.getMD5Hex('abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(SignatureUtils.getMD5Hex('message digest')).toBe('f96b697d7cb7938d525a2f31aaf161d0');
  });

  it('matches the well-known "The quick brown fox..." MD5 vector', () => {
    expect(SignatureUtils.getMD5Hex('The quick brown fox jumps over the lazy dog')).toBe(
      '9e107d9d372bb6826bd81d3542a419d6',
    );
  });

  it('cross-checks against node:crypto for an arbitrary string', () => {
    const s = 'plantuml-ts SignatureUtils relocation (T8b)';
    expect(SignatureUtils.getMD5Hex(s)).toBe(createHash('md5').update(s, 'utf8').digest('hex'));
  });
});

describe('SignatureUtils.getMD5raw', () => {
  it('returns the 16 raw digest bytes underlying getMD5Hex', () => {
    const raw = SignatureUtils.getMD5raw('abc');
    expect(raw).toHaveLength(16);
    expect(SignatureUtils.toHexString(raw)).toBe(SignatureUtils.getMD5Hex('abc'));
  });
});

describe('SignatureUtils.toHexString', () => {
  it('renders each byte as two lowercase hex digits, in order', () => {
    expect(SignatureUtils.toHexString(new Uint8Array([0x00, 0x0f, 0xff, 0xa1]))).toBe('000fffa1');
  });

  it('returns an empty string for an empty array', () => {
    expect(SignatureUtils.toHexString(new Uint8Array([]))).toBe('');
  });
});

describe('SignatureUtils.getSignature / toString(byte[])', () => {
  // Fixture values generated from THIS repo's already-ported, independently
  // tested `AsciiEncoder` (src/core/klimt/sprite/AsciiEncoder.ts) applied to
  // an MD5 digest computed via node:crypto -- not derived from
  // SignatureUtils itself, so this is not a tautological self-check.
  it.each([
    ['', 'r1sCsOy0iWJfW0cOxFX2VW00'],
    ['abc', 'a05Gc3pIJx3MbZzzAE5_SW00'],
    ['message digest', '-MjfVNotaurIMYyngl5Xq000'],
  ])('AsciiEncoder-encodes the MD5 digest of %j', (input, expected) => {
    expect(SignatureUtils.getSignature(input)).toBe(expected);
  });

  it('toString(byte[]) is the same AsciiEncoder path getSignature uses internally', () => {
    const raw = SignatureUtils.getMD5raw('abc');
    expect(SignatureUtils.toString(raw)).toBe(SignatureUtils.getSignature('abc'));
  });
});

describe('SignatureUtils.getSHA512Hex', () => {
  it('matches the standard NIST/FIPS 180-4 empty-string vector', () => {
    expect(SignatureUtils.getSHA512Hex('')).toBe(
      'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
    );
  });

  it('matches the standard NIST/FIPS 180-4 "abc" vector', () => {
    expect(SignatureUtils.getSHA512Hex('abc')).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    );
  });

  it('cross-checks against node:crypto for "message digest" and a long string', () => {
    for (const s of ['message digest', 'The quick brown fox jumps over the lazy dog']) {
      expect(SignatureUtils.getSHA512Hex(s)).toBe(createHash('sha512').update(s, 'utf8').digest('hex'));
    }
  });

  it('cross-checks against node:crypto for a multi-block (>128 byte) input', () => {
    const s = 'x'.repeat(300);
    expect(SignatureUtils.getSHA512Hex(s)).toBe(createHash('sha512').update(s, 'utf8').digest('hex'));
  });
});

describe('SignatureUtils.getSHA512raw', () => {
  it('returns the 64 raw digest bytes underlying getSHA512Hex', () => {
    const raw = SignatureUtils.getSHA512raw('abc');
    expect(raw).toHaveLength(64);
    expect(SignatureUtils.toHexString(raw)).toBe(SignatureUtils.getSHA512Hex('abc'));
  });
});

describe('SignatureUtils.purge', () => {
  it('strips the directory prefix and numeric cache-busting suffix from <img src="...">', () => {
    expect(SignatureUtils.purge('<img src="foo/bar/image123.png"/>')).toBe('<img src="image.png"/>');
  });

  it('is case-insensitive on the tag/attribute name (matching Java\'s "(?i)")', () => {
    expect(SignatureUtils.purge('before <IMG SRC="image7.PNG"/> after')).toBe('before <img src="image.PNG"/> after');
  });

  it('strips the numeric suffix from a bare image="..." attribute', () => {
    expect(SignatureUtils.purge('style: image="icons/star42.svg"; other')).toBe('style: image="star.svg"; other');
  });

  it('leaves text with no matching tag unchanged', () => {
    expect(SignatureUtils.purge('plain text, no image tag')).toBe('plain text, no image tag');
  });
});

describe('SignatureUtils.getSignatureWithoutImgSrc', () => {
  it('hashes identically for two images differing only by numeric suffix', () => {
    const a = '<img src="icons/logo1.png"/>';
    const b = '<img src="icons/logo2.png"/>';
    expect(SignatureUtils.getSignatureWithoutImgSrc(a)).toBe(SignatureUtils.getSignatureWithoutImgSrc(b));
  });

  it('hashes differently when the purged content actually differs', () => {
    const a = '<img src="icons/logo1.png"/>';
    const b = '<img src="icons/other1.png"/>';
    expect(SignatureUtils.getSignatureWithoutImgSrc(a)).not.toBe(SignatureUtils.getSignatureWithoutImgSrc(b));
  });

  it('equals getSignature(purge(s)) directly', () => {
    const s = '<img src="a/b/pic99.jpg"/> plus image="c/d/star5.svg"';
    expect(SignatureUtils.getSignatureWithoutImgSrc(s)).toBe(SignatureUtils.getSignature(SignatureUtils.purge(s)));
  });
});

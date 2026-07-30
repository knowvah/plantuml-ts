/**
 * SignatureUtils — hex/MD5/SHA-512 digest helpers upstream shares across
 * `UmlSource`, `klimt/shape/UImageSvg`, `version/Version`, `version/
 * FutureVersion`, and (license/keygen, out of this port's roadmap)
 * `version/PLSSignature`, `version/LicenseInfo`. Ported here (T8b) out of
 * `svek/Ports.ts`, which had inlined a scoped MD5-only copy (T8) —
 * consolidated so the next caller (`UImageSvg`, `UmlSource`) reuses this
 * module instead of writing a second hash implementation.
 *
 * Upstream: utils/SignatureUtils.java. Ported: `toHexString`, `getMD5Hex`,
 * `getMD5raw`, `getSignature(String)`, `toString(byte[])`,
 * `getSHA512Hex`, `getSHA512raw(String)`, `getSignatureWithoutImgSrc`,
 * `purge`.
 *
 * NOT ported — `md5Native` (SignatureUtils.java:210-272): a `@JSBody`
 * inline-JS MD5 used ONLY on the TeaVM (Java-to-JS transpile) runtime
 * path (`TeaVM.isTeaVM()`). This port has no TeaVM branch at all — its
 * single `getMD5Hex` implementation below is already pure TypeScript,
 * running identically in Node and the browser, so there is no second
 * runtime path to port.
 *
 * NOT PORTED — `getSignatureSha512(SFile)` (SignatureUtils.java:152-156).
 * BLOCKED ON THE FILE SEAM: reads bytes via `SFile#openFile()`, a
 * filesystem handle. `src/` is browser-only (CLAUDE.md's architecture
 * notes: no Node built-ins, no filesystem) and has no file-reading seam
 * for this today — unlike `include-resolver.ts`'s callback seam for
 * `!include` text, no caller in this port's roadmap needs to hash an
 * on-disk file, so no such seam has been introduced. Add one (an
 * `ArrayBuffer`/`Uint8Array` parameter, mirroring `include-resolver.ts`'s
 * pattern) if/when a caller needs it — this is a documented gap, not a
 * silent drop.
 *
 * NOT PORTED — `getSignatureSha512(InputStream)` (SignatureUtils.java:
 * 158-174). BLOCKED ON THE FILE SEAM for the same reason: streams bytes
 * from an open file handle one at a time. Same gap as above.
 *
 * NOT PORTED — `getSignature(SFile)` (SignatureUtils.java:189-208).
 * BLOCKED ON THE FILE SEAM for the same reason (MD5 of a file's bytes,
 * not a string).
 *
 * NOT PORTED — `salting(String, byte[])` (SignatureUtils.java:98-107).
 * NOT a file-seam block — it takes a password string and salt bytes, no
 * filesystem access. It needs PBKDF2WithHmacSHA1, a keyed-derivation
 * primitive this port has never built. Its only upstream caller is
 * `version/PLSSignature.java` (license-key generation/verification),
 * which is outside this port's tracked roadmap (CLAUDE.md has no
 * license-verification feature). Implementing PBKDF2/HMAC-SHA1 from
 * scratch to relocate a method with zero in-scope callers would silently
 * widen this task's write-set well past "move the existing MD5". Add it,
 * with its own NIST/RFC test vectors, if a real caller emerges.
 */

/** RFC 1321 / FIPS 180-4 hex encoding — each byte becomes two lowercase hex
 *  digits, in array order. Upstream: `SignatureUtils#toHexString`
 *  (SignatureUtils.java:63-69), `String.format("%02x", b)` per byte. */
function bytesToHex(data: Uint8Array): string {
  let out = '';
  for (const byte of data) out += byte.toString(16).padStart(2, '0');
  return out;
}

// ---------------------------------------------------------------------------
// MD5 (RFC 1321) — moved verbatim from T8's `svek/Ports.ts`, refactored to
// return the raw 16-byte digest so `getMD5Hex` and `getMD5raw` share one
// computation (Ports.ts previously only needed the hex form).
// ---------------------------------------------------------------------------

/** Left-rotates a 32-bit unsigned value by `bits`. */
function rotateLeft32(value: number, bits: number): number {
  return ((value << bits) | (value >>> (32 - bits))) >>> 0;
}

/** Upstream: `MD5Cycle`'s per-round `K[i] = floor(abs(sin(i+1)) * 2^32)`
 *  (RFC 1321 §3.4) — computed rather than transcribed, to keep this table
 *  provably correct against the spec instead of a 64-entry literal that
 *  could silently typo. */
const MD5_K: readonly number[] = Array.from({ length: 64 }, (_unused, i) =>
  Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0,
);

/** Upstream: RFC 1321 §3.4's per-round left-rotate amounts, 4 values
 *  repeated 4 times per round. */
const MD5_S: readonly number[] = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15,
  21,
];

/** RFC 1321 §3.1-3.2: pads `bytes` to a multiple of 64 bytes — a single
 *  `0x80` bit, zero bytes up to `56 mod 64`, then the ORIGINAL bit length
 *  as a little-endian 64-bit integer (this port never hashes anything long
 *  enough to overflow 2^32 bits, so the high 32 bits are always 0). */
function md5Pad(bytes: Uint8Array): Uint8Array {
  const bitLength = bytes.length * 8;
  const paddedLength = ((bytes.length + 8) >> 6) * 64 + 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, bitLength >>> 0, true);
  view.setUint32(paddedLength - 4, Math.floor(bitLength / 2 ** 32), true);
  return padded;
}

/** RFC 1321 §3.4's main compression loop, one 512-bit (16-word) chunk. */
function md5ProcessChunk(state: Uint32Array, chunk: DataView, chunkOffset: number): void {
  const m: number[] = [];
  for (let j = 0; j < 16; j++) m.push(chunk.getUint32(chunkOffset + j * 4, true));

  let [a, b, c, d] = [state[0] as number, state[1] as number, state[2] as number, state[3] as number];
  for (let i = 0; i < 64; i++) {
    let f: number;
    let g: number;
    if (i < 16) {
      f = (b & c) | (~b & d);
      g = i;
    } else if (i < 32) {
      f = (d & b) | (~d & c);
      g = (5 * i + 1) % 16;
    } else if (i < 48) {
      f = b ^ c ^ d;
      g = (3 * i + 5) % 16;
    } else {
      f = c ^ (b | ~d);
      g = (7 * i) % 16;
    }
    f = (f + a + (MD5_K[i] as number) + (m[g] as number)) >>> 0;
    a = d;
    d = c;
    c = b;
    b = (b + rotateLeft32(f, MD5_S[i] as number)) >>> 0;
  }
  state[0] = (state[0] as number) + a;
  state[1] = (state[1] as number) + b;
  state[2] = (state[2] as number) + c;
  state[3] = (state[3] as number) + d;
}

/** MD5 raw digest of `s`'s UTF-8 bytes, as a 16-byte array in the same byte
 *  order as Java's `MessageDigest.getInstance("MD5").digest()` — each
 *  32-bit working register written little-endian. Upstream:
 *  `SignatureUtils#getMD5raw` (SignatureUtils.java:91-96). */
function md5Raw(s: string): Uint8Array {
  const bytes = new TextEncoder().encode(s);
  const padded = md5Pad(bytes);
  const view = new DataView(padded.buffer);
  const state = Uint32Array.from([0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476]);
  for (let offset = 0; offset < padded.length; offset += 64) md5ProcessChunk(state, view, offset);

  const digest = new Uint8Array(16);
  const digestView = new DataView(digest.buffer);
  for (let i = 0; i < 4; i++) digestView.setUint32(i * 4, state[i] as number, true);
  return digest;
}

// ---------------------------------------------------------------------------
// SHA-512 (FIPS 180-4). Round/initial-hash constants are COMPUTED (fractional
// bits of the square/cube roots of the first primes, per FIPS 180-4 §5.3.5 /
// §4.2.3) rather than transcribed as 80 hex literals, for the same
// provable-correctness reason as `MD5_K` above. `bigint` carries the 64-bit
// words natively; JS's `number` cannot losslessly hold them.
// ---------------------------------------------------------------------------

const MASK64 = (1n << 64n) - 1n;

function isPrime(n: number): boolean {
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return n >= 2;
}

function firstPrimes(count: number): number[] {
  const result: number[] = [];
  for (let candidate = 2; result.length < count; candidate++) if (isPrime(candidate)) result.push(candidate);
  return result;
}

/** Integer square root of a nonnegative `bigint`, via Newton's method. */
function bigIntSqrt(value: bigint): bigint {
  if (value < 2n) return value;
  let x = value;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + value / x) / 2n;
  }
  return x;
}

/** Integer cube root of a nonnegative `bigint`, via Newton's method
 *  (`x' = (2x + N/x^2) / 3`). */
function bigIntCubeRoot(value: bigint): bigint {
  if (value < 2n) return value;
  let x = value;
  let y = (2n * x + 1n) / 3n;
  while (y < x) {
    x = y;
    y = (2n * x + value / (x * x)) / 3n;
  }
  return x;
}

const SHA512_PRIMES = firstPrimes(80);

/** First 64 bits of the fractional part of `sqrt(p)`, for the first 8
 *  primes — FIPS 180-4 §5.3.5's SHA-512 initial hash values `H(0)`. */
const SHA512_H0: readonly bigint[] = SHA512_PRIMES.slice(0, 8).map((p) => bigIntSqrt(BigInt(p) << 128n) & MASK64);

/** First 64 bits of the fractional part of `cbrt(p)`, for the first 80
 *  primes — FIPS 180-4 §4.2.3's SHA-512 round constants `K`. */
const SHA512_K: readonly bigint[] = SHA512_PRIMES.map((p) => bigIntCubeRoot(BigInt(p) << 192n) & MASK64);

function rotr64(x: bigint, n: bigint): bigint {
  return ((x >> n) | (x << (64n - n))) & MASK64;
}

function add64(...values: bigint[]): bigint {
  return values.reduce((sum, v) => (sum + v) & MASK64, 0n);
}

/** FIPS 180-4 §5.1.2: pads `bytes` to a multiple of 128 bytes — a single
 *  `0x80` bit, zero bytes up to `112 mod 128`, then the original bit length
 *  as a big-endian 128-bit integer (this port never hashes anything close
 *  to overflowing 64 bits of length, so the upper 64 bits are always 0). */
function sha512Pad(bytes: Uint8Array): Uint8Array {
  const bitLength = BigInt(bytes.length) * 8n;
  let paddedLength = bytes.length + 1 + 16;
  const remainder = paddedLength % 128;
  if (remainder !== 0) paddedLength += 128 - remainder;

  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setBigUint64(paddedLength - 8, bitLength & MASK64, false);
  view.setBigUint64(paddedLength - 16, bitLength >> 64n, false);
  return padded;
}

/** FIPS 180-4 §6.4.2's message-schedule expansion: 16 chunk words extended
 *  to 80 via `sigma0`/`sigma1`. Split out of `sha512ProcessChunk` to keep
 *  each function under this repo's 30-NLOC cap. */
function sha512MessageSchedule(view: DataView, offset: number): bigint[] {
  const w = new Array<bigint>(80);
  for (let t = 0; t < 16; t++) w[t] = view.getBigUint64(offset + t * 8, false);
  for (let t = 16; t < 80; t++) {
    const wt2 = w[t - 2] as bigint;
    const wt15 = w[t - 15] as bigint;
    const s1 = rotr64(wt2, 19n) ^ rotr64(wt2, 61n) ^ (wt2 >> 6n);
    const s0 = rotr64(wt15, 1n) ^ rotr64(wt15, 8n) ^ (wt15 >> 7n);
    w[t] = add64(w[t - 16] as bigint, s0, w[t - 7] as bigint, s1);
  }
  return w;
}

/** FIPS 180-4 §6.4.2's main compression loop, one 1024-bit (16-word) chunk. */
function sha512ProcessChunk(state: bigint[], view: DataView, offset: number): void {
  const w = sha512MessageSchedule(view, offset);
  let [a, b, c, d, e, f, g, h] = state as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
  for (let t = 0; t < 80; t++) {
    const bigSigma1 = rotr64(e, 14n) ^ rotr64(e, 18n) ^ rotr64(e, 41n);
    const ch = (e & f) ^ (~e & MASK64 & g);
    const t1 = add64(h, bigSigma1, ch, SHA512_K[t] as bigint, w[t] as bigint);
    const bigSigma0 = rotr64(a, 28n) ^ rotr64(a, 34n) ^ rotr64(a, 39n);
    const maj = (a & b) ^ (a & c) ^ (b & c);
    const t2 = add64(bigSigma0, maj);
    h = g;
    g = f;
    f = e;
    e = add64(d, t1);
    d = c;
    c = b;
    b = a;
    a = add64(t1, t2);
  }
  state[0] = add64(state[0] as bigint, a);
  state[1] = add64(state[1] as bigint, b);
  state[2] = add64(state[2] as bigint, c);
  state[3] = add64(state[3] as bigint, d);
  state[4] = add64(state[4] as bigint, e);
  state[5] = add64(state[5] as bigint, f);
  state[6] = add64(state[6] as bigint, g);
  state[7] = add64(state[7] as bigint, h);
}

/** SHA-512 raw digest of `data`'s bytes, as a 64-byte array — matches
 *  Java's `MessageDigest.getInstance("SHA-512").digest()` byte order.
 *  Upstream: `SignatureUtils#getSHA512raw(byte[])`
 *  (SignatureUtils.java:145-150). Not exported: the only in-scope caller
 *  is `getSHA512raw(String)` below (the `byte[]` overload's only other
 *  upstream caller is `version/PLSSignature`, out of this port's scope). */
function sha512Raw(data: Uint8Array): Uint8Array {
  const padded = sha512Pad(data);
  const view = new DataView(padded.buffer);
  const state = [...SHA512_H0];
  for (let offset = 0; offset < padded.length; offset += 128) sha512ProcessChunk(state, view, offset);

  const digest = new Uint8Array(64);
  const digestView = new DataView(digest.buffer);
  for (let i = 0; i < 8; i++) digestView.setBigUint64(i * 8, state[i] as bigint, false);
  return digest;
}

// ---------------------------------------------------------------------------
// `purge` (SignatureUtils.java:181-187) — two regex rewrites that strip a
// numeric cache-busting suffix off image filenames before hashing
// (`getSignatureWithoutImgSrc`), so two renders differing only by that
// suffix hash identically. Ported as `RegExp` literals, not string-built
// patterns, matching the Java regex/replacement 1:1 (`$1`/`$2` group refs
// are identical between Java and JS `String#replace`).
// ---------------------------------------------------------------------------

const IMG_SRC_ATTR = /<img\s+src="(?:[^"]+[/\\])?([^/\\\d.]+)\d*(\.\w+)"\/>/gi;
const IMAGE_ATTR = /image="(?:[^"]+[/\\])?([^/\\\d.]+)\d*(\.\w+)"/gi;

export class SignatureUtils {
  /** Upstream: `SignatureUtils#toHexString` (SignatureUtils.java:63-69). */
  static toHexString(data: Uint8Array): string {
    return bytesToHex(data);
  }

  /** Upstream: `SignatureUtils#getMD5Hex` (SignatureUtils.java:71-89), minus
   *  the TeaVM `md5Native` branch (see file-header note). */
  static getMD5Hex(s: string): string {
    return bytesToHex(md5Raw(s));
  }

  /** Upstream: `SignatureUtils#getMD5raw` (SignatureUtils.java:91-96). */
  static getMD5raw(s: string): Uint8Array {
    return md5Raw(s);
  }

  /** Upstream: `SignatureUtils#getSignature` (SignatureUtils.java:109-120) —
   *  the MD5 digest, `AsciiEncoder`-encoded (NOT hex; see `toString`
   *  below), matching `klimt/sprite/AsciiEncoder.ts`'s already-ported
   *  6-bit alphabet. */
  static getSignature(s: string): string {
    return SignatureUtils.toString(md5Raw(s));
  }

  /** Upstream: `SignatureUtils#toString(byte[])` (SignatureUtils.java:
   *  122-125) — delegates to `AsciiEncoder#encode`. */
  static toString(data: Uint8Array): string {
    return new AsciiEncoder().encode(data);
  }

  /** Upstream: `SignatureUtils#getSHA512Hex` (SignatureUtils.java:127-139). */
  static getSHA512Hex(s: string): string {
    return bytesToHex(sha512Raw(new TextEncoder().encode(s)));
  }

  /** Upstream: `SignatureUtils#getSHA512raw(String)`
   *  (SignatureUtils.java:141-143). */
  static getSHA512raw(s: string): Uint8Array {
    return sha512Raw(new TextEncoder().encode(s));
  }

  /** Upstream: `SignatureUtils#getSignatureWithoutImgSrc`
   *  (SignatureUtils.java:176-179). */
  static getSignatureWithoutImgSrc(s: string): string {
    return SignatureUtils.getSignature(SignatureUtils.purge(s));
  }

  /** Upstream: `SignatureUtils#purge` (SignatureUtils.java:181-187). */
  static purge(s: string): string {
    return s.replace(IMG_SRC_ATTR, '<img src="$1$2"/>').replace(IMAGE_ATTR, 'image="$1$2"');
  }
}

import { AsciiEncoder } from '../klimt/sprite/AsciiEncoder.js';

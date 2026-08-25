/**
 * DEFLATE with fixed Huffman codes (BTYPE=01) and LZ77 matching — RFC 1951.
 *
 * `png-encoder.ts` originally emitted STORED blocks only, on the stated
 * grounds that "PlantUML sprites are tiny (~64x64), so the size cost of
 * skipping LZ77/Huffman coding is negligible". Measured on
 * `birocu-87-xubi808`'s 64x64 sprite that cost is **21x**: 16516 bytes
 * against the jar's 777 for pixel data of identical shape (both 8-bit RGBA,
 * both filter 0, both 16448 bytes raw). Sprite rows are long runs of
 * identical RGBA pixels, which is precisely what LZ77 removes.
 *
 * Fixed Huffman rather than dynamic: it needs no code-length table in the
 * stream and no frequency pass, so the output stays deterministic by
 * construction — the encoder's founding requirement, since the same pixels
 * must always produce the same bytes. Matching is greedy with a bounded
 * chain walk, so it is deterministic too.
 *
 * @see https://www.rfc-editor.org/rfc/rfc1951 sections 3.2.5 (length/distance
 *      codes), 3.2.6 (the fixed code table)
 */

/** RFC 1951 3.2.5: first length for each length code 257..285. */
const LENGTH_BASE = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67,
  83, 99, 115, 131, 163, 195, 227, 258,
];
/** Extra bits carried after each length code above. */
const LENGTH_EXTRA = [
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5,
  5, 5, 0,
];
/** RFC 1951 3.2.5: first distance for each distance code 0..29. */
const DIST_BASE = [
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769,
  1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577,
];
/** Extra bits carried after each distance code above. */
const DIST_EXTRA = [
  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11,
  11, 12, 12, 13, 13,
];

const WINDOW_SIZE = 32768;
const MIN_MATCH = 3;
const MAX_MATCH = 258;
/** Bound on the hash-chain walk per position. Caps worst-case time; the
 *  choice is fixed, so output stays deterministic. */
const MAX_CHAIN = 128;
const HASH_BITS = 15;
const HASH_SIZE = 1 << HASH_BITS;
const NO_POS = -1;

/**
 * LSB-first bit sink, as DEFLATE requires: Huffman codes are fed
 * most-significant-bit first, everything else least-significant first
 * (RFC 1951 section 3.1.1).
 */
class BitWriter {
  private readonly bytes: number[] = [];
  private bitBuffer = 0;
  private bitCount = 0;

  /** Write `count` low bits of `value`, LSB first. */
  writeBits(value: number, count: number): void {
    this.bitBuffer |= (value & ((1 << count) - 1)) << this.bitCount;
    this.bitCount += count;
    while (this.bitCount >= 8) {
      this.bytes.push(this.bitBuffer & 0xff);
      this.bitBuffer >>>= 8;
      this.bitCount -= 8;
    }
  }

  /** Write a Huffman code MSB first. */
  writeCode(code: number, length: number): void {
    for (let i = length - 1; i >= 0; i--) this.writeBits((code >>> i) & 1, 1);
  }

  finish(): Uint8Array {
    if (this.bitCount > 0) this.bytes.push(this.bitBuffer & 0xff);
    return Uint8Array.from(this.bytes);
  }
}

/** RFC 1951 3.2.6's fixed literal/length code table, as (code, bitLength). */
function fixedLiteralCode(symbol: number): { code: number; length: number } {
  if (symbol < 144) return { code: 0x30 + symbol, length: 8 };
  if (symbol < 256) return { code: 0x190 + (symbol - 144), length: 9 };
  if (symbol < 280) return { code: symbol - 256, length: 7 };
  return { code: 0xc0 + (symbol - 280), length: 8 };
}

function writeLiteral(w: BitWriter, byte: number): void {
  const { code, length } = fixedLiteralCode(byte);
  w.writeCode(code, length);
}

/** Largest index whose base is <= `value` — the code for a length or distance. */
function codeFor(bases: readonly number[], value: number): number {
  let i = bases.length - 1;
  while (i > 0 && bases[i]! > value) i--;
  return i;
}

function writeMatch(w: BitWriter, length: number, distance: number): void {
  const lc = codeFor(LENGTH_BASE, length);
  const { code, length: bits } = fixedLiteralCode(257 + lc);
  w.writeCode(code, bits);
  w.writeBits(length - LENGTH_BASE[lc]!, LENGTH_EXTRA[lc]!);
  const dc = codeFor(DIST_BASE, distance);
  // Distance codes are a flat 5-bit fixed code (RFC 1951 section 3.2.6).
  w.writeCode(dc, 5);
  w.writeBits(distance - DIST_BASE[dc]!, DIST_EXTRA[dc]!);
}

/** Rolling 3-byte hash, matching zlib's shape. */
function hashAt(data: Uint8Array, i: number): number {
  return ((data[i]! << 10) ^ (data[i + 1]! << 5) ^ data[i + 2]!) & (HASH_SIZE - 1);
}

interface Match {
  readonly length: number;
  readonly distance: number;
}

/** Longest match for `pos`, walking the chain head-first (most recent first)
 *  so ties resolve to the SHORTEST distance, which encodes smaller. */
function findMatch(data: Uint8Array, pos: number, head: Int32Array, prev: Int32Array): Match | undefined {
  const maxLen = Math.min(MAX_MATCH, data.length - pos);
  if (maxLen < MIN_MATCH) return undefined;
  let best = 0;
  let bestDist = 0;
  let candidate = head[hashAt(data, pos)]!;
  for (let n = 0; n < MAX_CHAIN && candidate !== NO_POS; n++) {
    const dist = pos - candidate;
    if (dist <= 0 || dist > WINDOW_SIZE) break;
    let len = 0;
    while (len < maxLen && data[candidate + len] === data[pos + len]) len++;
    if (len > best) {
      best = len;
      bestDist = dist;
      if (len === maxLen) break;
    }
    candidate = prev[candidate & (WINDOW_SIZE - 1)]!;
  }
  return best >= MIN_MATCH ? { length: best, distance: bestDist } : undefined;
}

function insert(data: Uint8Array, pos: number, head: Int32Array, prev: Int32Array): void {
  if (pos + MIN_MATCH > data.length) return;
  const h = hashAt(data, pos);
  prev[pos & (WINDOW_SIZE - 1)] = head[h]!;
  head[h] = pos;
}

/**
 * Compress `data` into a single fixed-Huffman DEFLATE block (BFINAL=1,
 * BTYPE=01). Returns the raw deflate stream — the caller supplies the zlib
 * wrapper and Adler-32.
 */
export function deflateFixed(data: Uint8Array): Uint8Array {
  const w = new BitWriter();
  w.writeBits(1, 1); // BFINAL
  w.writeBits(1, 2); // BTYPE = 01, fixed Huffman
  const head = new Int32Array(HASH_SIZE).fill(NO_POS);
  const prev = new Int32Array(WINDOW_SIZE).fill(NO_POS);
  let pos = 0;
  while (pos < data.length) {
    const match = findMatch(data, pos, head, prev);
    if (match === undefined) {
      writeLiteral(w, data[pos]!);
      insert(data, pos, head, prev);
      pos++;
      continue;
    }
    writeMatch(w, match.length, match.distance);
    for (let i = 0; i < match.length; i++) insert(data, pos + i, head, prev);
    pos += match.length;
  }
  const { code, length } = fixedLiteralCode(256); // end-of-block
  w.writeCode(code, length);
  return w.finish();
}

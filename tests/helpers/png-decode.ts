/**
 * Test-only PNG reader for comparing this port's sprite rasters with the
 * jar's: 8-bit, non-interlaced, colour types 2 (RGB) and 6 (RGBA), every
 * scanline filter. Uses `node:zlib`, so it never ships in `src/`.
 */
import { inflateSync } from 'node:zlib';

export interface DecodedPng {
  readonly width: number;
  readonly height: number;
  readonly colorType: number;
  readonly chunkTypes: readonly string[];
  /** Unfiltered samples, `width * bytesPerPixel` per row. */
  readonly pixels: Uint8Array;
}

const SIGNATURE_LENGTH = 8;
const CHUNK_OVERHEAD = 12;

function readChunks(png: Uint8Array): { type: string; data: Uint8Array }[] {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const chunks: { type: string; data: Uint8Array }[] = [];
  for (let p = SIGNATURE_LENGTH; p < png.length;) {
    const length = view.getUint32(p);
    const type = String.fromCharCode(...png.subarray(p + 4, p + 8));
    chunks.push({ type, data: png.subarray(p + 8, p + 8 + length) });
    p += CHUNK_OVERHEAD + length;
  }
  return chunks;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

function predict(filter: number, a: number, b: number, c: number): number {
  if (filter === 1) return a;
  if (filter === 2) return b;
  if (filter === 3) return Math.floor((a + b) / 2);
  if (filter === 4) return paeth(a, b, c);
  return 0;
}

function unfilter(raw: Uint8Array, width: number, height: number, bpp: number): Uint8Array {
  const stride = width * bpp;
  const out = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]!;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[y * stride + x - bpp]! : 0;
      const b = y > 0 ? out[(y - 1) * stride + x]! : 0;
      const c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp]! : 0;
      out[y * stride + x] = (raw[y * (stride + 1) + 1 + x]! + predict(filter, a, b, c)) & 0xff;
    }
  }
  return out;
}

export function decodePng(png: Uint8Array): DecodedPng {
  const chunks = readChunks(png);
  const ihdr = new DataView(chunks[0]!.data.buffer, chunks[0]!.data.byteOffset, 13);
  const width = ihdr.getUint32(0);
  const height = ihdr.getUint32(4);
  const colorType = chunks[0]!.data[9]!;
  const bpp = colorType === 6 ? 4 : 3;
  const idat = Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data));
  const pixels = unfilter(new Uint8Array(inflateSync(idat)), width, height, bpp);
  return { width, height, colorType, chunkTypes: chunks.map((c) => c.type), pixels };
}

/** Every `data:image/png;base64` payload in an SVG, in document order. */
export function pngPayloads(svg: string): Uint8Array[] {
  return [...svg.matchAll(/data:image\/png;base64,([^"]+)/g)].map((m) => new Uint8Array(Buffer.from(m[1]!, 'base64')));
}

/**
 * Minimal ZIP reader for pulling named entries out of the oracle jar
 * (`oracle/dist/plantuml-oracle.jar`) without a zip dependency (T0d: the
 * package has none, and adding one is a stop-and-report). Node built-ins
 * only (`node:fs`, `node:zlib`) -- walks the End Of Central Directory
 * record, then the Central Directory, then each entry's Local File Header,
 * per the PKZIP APPNOTE.TXT format (section 4.3).
 *
 * Handles STORED (method 0) and DEFLATE (method 8) entries, which covers
 * every entry a `jar`-packaged build produces; ZIP64 and encryption are
 * unsupported (the oracle jar needs neither).
 */
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIR_SIGNATURE = 0x02014b50;
const LOCAL_HEADER_SIGNATURE = 0x04034b50;

const EOCD_MIN_SIZE = 22;
const EOCD_MAX_COMMENT = 0xffff;
const CENTRAL_DIR_HEADER_SIZE = 46;
const LOCAL_HEADER_SIZE = 30;

const COMPRESSION_STORED = 0;
const COMPRESSION_DEFLATE = 8;

interface CentralDirEntry {
  readonly name: string;
  readonly compressionMethod: number;
  readonly compressedSize: number;
  readonly localHeaderOffset: number;
}

/** Scans backward for the EOCD signature -- it sits after an optional comment. */
function findEndOfCentralDirectory(buf: Buffer): number {
  const searchStart = Math.max(0, buf.length - EOCD_MIN_SIZE - EOCD_MAX_COMMENT);
  for (let i = buf.length - EOCD_MIN_SIZE; i >= searchStart; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIGNATURE) return i;
  }
  throw new Error('not a zip file: End Of Central Directory record not found');
}

/** Reads one 46-byte-fixed Central Directory File Header at `offset`. */
function readCentralDirEntry(buf: Buffer, offset: number): { entry: CentralDirEntry; nextOffset: number } {
  if (buf.readUInt32LE(offset) !== CENTRAL_DIR_SIGNATURE) {
    throw new Error(`not a zip file: expected Central Directory signature at offset ${String(offset)}`);
  }
  const compressionMethod = buf.readUInt16LE(offset + 10);
  const compressedSize = buf.readUInt32LE(offset + 20);
  const nameLength = buf.readUInt16LE(offset + 28);
  const extraLength = buf.readUInt16LE(offset + 30);
  const commentLength = buf.readUInt16LE(offset + 32);
  const localHeaderOffset = buf.readUInt32LE(offset + 42);
  const nameStart = offset + CENTRAL_DIR_HEADER_SIZE;
  const name = buf.toString('utf8', nameStart, nameStart + nameLength);
  const nextOffset = nameStart + nameLength + extraLength + commentLength;
  return { entry: { name, compressionMethod, compressedSize, localHeaderOffset }, nextOffset };
}

/** Walks every Central Directory entry starting right after the EOCD's `cdOffset`. */
function readCentralDirectory(buf: Buffer, eocdOffset: number): CentralDirEntry[] {
  const totalEntries = buf.readUInt16LE(eocdOffset + 10);
  let offset = buf.readUInt32LE(eocdOffset + 16);
  const entries: CentralDirEntry[] = [];
  for (let i = 0; i < totalEntries; i++) {
    const { entry, nextOffset } = readCentralDirEntry(buf, offset);
    entries.push(entry);
    offset = nextOffset;
  }
  return entries;
}

/** Reads and decompresses one entry's data, using its own Local File Header. */
function readEntryData(buf: Buffer, entry: CentralDirEntry): Buffer {
  const offset = entry.localHeaderOffset;
  if (buf.readUInt32LE(offset) !== LOCAL_HEADER_SIGNATURE) {
    throw new Error(`not a zip file: expected Local File Header for ${entry.name}`);
  }
  const nameLength = buf.readUInt16LE(offset + 26);
  const extraLength = buf.readUInt16LE(offset + 28);
  const dataStart = offset + LOCAL_HEADER_SIZE + nameLength + extraLength;
  const compressed = buf.subarray(dataStart, dataStart + entry.compressedSize);
  if (entry.compressionMethod === COMPRESSION_STORED) return Buffer.from(compressed);
  if (entry.compressionMethod === COMPRESSION_DEFLATE) return inflateRawSync(compressed);
  throw new Error(`unsupported zip compression method ${String(entry.compressionMethod)} for ${entry.name}`);
}

/**
 * Reads `names` out of the zip/jar at `jarPath`. Missing names are simply
 * absent from the result map -- callers that require an entry check for it.
 */
export function readZipEntries(jarPath: string, names: readonly string[]): ReadonlyMap<string, Buffer> {
  const buf = readFileSync(jarPath);
  const eocdOffset = findEndOfCentralDirectory(buf);
  const wanted = new Set(names);
  const result = new Map<string, Buffer>();
  for (const entry of readCentralDirectory(buf, eocdOffset)) {
    if (wanted.has(entry.name)) result.set(entry.name, readEntryData(buf, entry));
  }
  return result;
}

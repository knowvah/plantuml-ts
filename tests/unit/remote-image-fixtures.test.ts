import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { remoteImageKey } from '../../src/core/remote-image-store.js';
import { remoteImageFixtureStore } from '../oracle/svg-conformance/remote-image-fixtures.js';

const FOO1_URL = 'http://beta.plantuml.net/foo1.svg';
const GOLDEN = 'test-results/dot-cache/sequence/fifasu-62-pipo979/in.svg';
const DATA_URI_PREFIX = 'data:image/svg+xml;base64,';

describe('remoteImageFixtureStore', () => {
  it('serves foo1.svg as image/svg+xml', () => {
    const payload = remoteImageFixtureStore().get(remoteImageKey(FOO1_URL));
    expect(payload?.mimeType).toBe('image/svg+xml');
    expect(payload?.bytes.byteLength).toBe(2753);
    expect(remoteImageFixtureStore().has(remoteImageKey(FOO1_URL))).toBe(true);
  });

  it('serves nothing for any other key', () => {
    const store = remoteImageFixtureStore();
    expect(store.get(remoteImageKey('http://beta.plantuml.net/other.svg'))).toBeUndefined();
    expect(store.get(FOO1_URL)).toBeUndefined();
    expect(store.has('remote-image:nope')).toBe(false);
  });

  // The golden is gitignored (a corpus symlink), so skip where it is absent.
  it.skipIf(!existsGolden())('re-encodes to the golden data-URI payload exactly', () => {
    const svg = readFileSync(GOLDEN, 'utf8');
    const start = svg.indexOf(DATA_URI_PREFIX) + DATA_URI_PREFIX.length;
    const payloadB64 = svg.slice(start, svg.indexOf('"', start));
    const bytes = remoteImageFixtureStore().get(remoteImageKey(FOO1_URL))!.bytes;
    expect(Buffer.from(bytes).toString('base64')).toBe(payloadB64);
  });
});

function existsGolden(): boolean {
  try {
    readFileSync(GOLDEN);
    return true;
  } catch {
    return false;
  }
}

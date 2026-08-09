/**
 * The json family's structural conformance gate.
 *
 * See `json-family-structural.ts` for what "structural" means here and why
 * this family is gated differently from its siblings. In short: its layout
 * geometry is an accepted, verified divergence, so a byte-exact bar would
 * measure ~19,760 restatements of one decision and drown the ~266 real
 * defects underneath.
 *
 * Shrink-only. A fixture in the manifest must stay clean; a fixture that
 * becomes clean should be added to it.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readManifest, structuralDiffs } from './json-family-structural.js';

const CACHE = join(dirname(fileURLToPath(import.meta.url)), '../../../test-results/dot-cache');
const TYPES = ['json', 'yaml', 'hcl'] as const;

describe('json family — structural conformance', () => {
  const manifest = readManifest();

  it('pins a non-empty set of fixtures', () => {
    // Guards the whole suite against silently degrading to a no-op if the
    // manifest is ever emptied or fails to parse.
    expect(manifest.clean.length).toBeGreaterThan(0);
  });

  for (const entry of manifest.clean) {
    const [type, slug] = entry.split('/') as [string, string];
    it(`${entry} has no non-positional diff`, () => {
      const { diffs } = structuralDiffs(type, slug);
      // The message carries the diffs themselves: a failure here names the
      // attribute that regressed, which is the whole point of this gate.
      expect(diffs, `${entry}\n  ${diffs.slice(0, 10).join('\n  ')}`).toEqual([]);
    });
  }

  it('every structurally clean fixture is pinned', () => {
    // The ratchet only tightens if newly-clean fixtures get added. This fails
    // when one is missing rather than letting the gate quietly stop growing.
    const pinned = new Set(manifest.clean);
    const missing: string[] = [];
    for (const type of TYPES) {
      const dir = join(CACHE, type);
      if (!existsSync(dir)) continue;
      for (const slug of readdirSync(dir).sort()) {
        const entry = `${type}/${slug}`;
        if (pinned.has(entry) || !existsSync(join(dir, slug, 'in.svg'))) continue;
        if (structuralDiffs(type, slug).diffs.length === 0) missing.push(entry);
      }
    }
    expect(missing, `newly clean — add to oracle/goldens/json-family-structural.json:\n  ${missing.join('\n  ')}`).toEqual([]);
  });
});

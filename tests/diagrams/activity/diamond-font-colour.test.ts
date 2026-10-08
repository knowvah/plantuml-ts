/**
 * add4-T2d (KLIMT-FLOOR fill): `activityDiamond()` = root/element/
 * activityDiagram/activity/diamond (`StyleSignatureBasic.java:271-273`), so
 * an `activity` FontColor -- `skinparam activityFontColor`
 * (`FromSkinparamToStyle.java:144`) or `<style> activityDiagram { activity
 * {...} }` -- reaches the diamond label; the arrow label keeps its own.
 * Each `<case>/in.svg` is the jar's own render (`scripts/oracle-render.sh`).
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderActivityFixture } from '../../helpers/activity-text-position.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T2d');

function fills(svg: string): string[] {
  return [...svg.matchAll(/<text [^>]*fill="([^"]*)"[^>]*>([^<]*)<\/text>/g)].map((m) => `${m[2]}=${m[1]}`);
}

describe('diamond label inherits the activity FontColor', () => {
  for (const name of ['skinparam-activity-fontcolor', 'style-activity-fontcolor']) {
    it(`${name}: text fills equal the jar's`, () => {
      const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
      expect(fills(golden)).toEqual(['go=#F00', 'yes=#000', 'cond?=#F00']);
      expect(fills(ours)).toEqual(fills(golden));
    });
  }
});

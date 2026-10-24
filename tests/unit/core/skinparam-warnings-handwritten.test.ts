/**
 * sdd3-T8f: `withWarningBanner` draws the banner through
 * `UGraphicHandwritten` when the diagram is handwritten.
 *
 * Java: `TextBlockExporter.java:172-175` translates by the margin, THEN wraps
 * (`ug = new UGraphicHandwritten(ug)`), and `DiagramChromeFactory.java:128`
 * draws the banner (`addWarnings`) inside that wrap. The jar's
 * `skinparam handwritten true` banner is a jiggled `<polygon>`, not a `<rect>`
 * (T8a `diagnosis/handwritten.md`, F4; the golden's coordinates are pinned
 * end to end in `tests/unit/sequence/renderer-handwritten-ug.test.ts`).
 */
import { describe, it, expect } from 'vitest';
import type { RenderFragment } from '../../../src/core/dispatcher.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { withWarningBanner } from '../../../src/core/skinparam-warnings.js';
import { Warning } from '../../../src/core/warning/Warning.js';

const HANDWRITTEN_WARNING = "Please use '!option handwritten true' to enable handwritten ";
const MARGIN = { top: 5, right: 5, bottom: 5, left: 5 };
const UID = 'handwritten-banner-test';
const measurer = new DeterministicMeasurer();
const fragment: RenderFragment = { body: '', width: 60, height: 40, preChromeWidth: 50, preChromeHeight: 30 };
const banner = (handwritten?: boolean): RenderFragment =>
  handwritten === undefined
    ? withWarningBanner(fragment, [new Warning(HANDWRITTEN_WARNING)], measurer, MARGIN, UID)
    : withWarningBanner(fragment, [new Warning(HANDWRITTEN_WARNING)], measurer, MARGIN, UID, handwritten);

describe('withWarningBanner handwritten flag (TextBlockExporter.java:174-175)', () => {
  it('draws the banner rect as a jiggled polygon when handwritten', () => {
    const out = banner(true);
    expect(out.body).not.toContain('<rect');
    expect(out.body).toContain('<polygon ');
    expect(out.body).toContain('fill="#FFC"');
  });

  it('keeps the plain rect for a non-handwritten banner, whether the flag is false or absent', () => {
    for (const out of [banner(false), banner(undefined)]) {
      expect(out.body).toContain('<rect ');
      expect(out.body).not.toContain('<polygon');
    }
    expect(banner(false).body).toBe(banner(undefined).body);
  });

  it('draws the banner text unchanged (UGraphicHandwritten passes UText through, :64-82)', () => {
    const text = (body: string): string[] => body.match(/<text [^>]*>[^<]*<\/text>/g) ?? [];
    expect(text(banner(true).body)).toEqual(text(banner(false).body));
    expect(text(banner(true).body)).toHaveLength(1);
  });
});

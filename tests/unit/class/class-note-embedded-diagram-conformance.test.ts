/**
 * class-note-embedded-diagram-conformance.test.ts — CDD B7FU-R2 item 3:
 * wires `note-layout-measure-rows.ts#consumeEmbeddedRow` to the SAME
 * registered nested-diagram renderer `class-nested-diagram-renderer.ts`
 * built for T27's class-body embeds, for the class engine's OWN note
 * `{{ ... }}` regions (`R2b`'s original seam, left unwired since).
 *
 * xadado-92-lazo250 (`test-results/dot-cache/class/xadado-92-lazo250/`) is
 * the ONLY class-corpus fixture with a `{{ }}` note region (grepped every
 * cached `in.puml` under `test-results/dot-cache/class/`). Its jar golden
 * holds TWO real nested renders (`detailsNote1` 122x124 sequence diagram,
 * `detailsNote2` 105x96 class diagram) — R2b's original "42x42 catch
 * fallback" finding is CORRECT for the note's own SIZING (box geometry,
 * `.agent-notes/cdd-B7FU-R2.md`'s "sizing/drawing asymmetry" section, the
 * SAME mechanism `class-body-enhanced-embeds.ts#renderEmbed` documents for
 * class bodies) but the DRAWN `<image>` is real, not a 42x42 placeholder —
 * this task adds that missing `<image>`, independent of sizing.
 *
 * xadado is NOT ratchet-pinned (`oracle/goldens/svg-class/ratchet.json`
 * has no entry for it) and has large, UNRELATED pre-existing divergence
 * (a component-cluster/DOT layout gap, ~340 numeric diffs before this
 * task) that this task does not and cannot close — the assertions below
 * are scoped to the two embedded images alone, jar-verified byte-exact on
 * size, matching the mission's own instruction ("if a golden now holds a
 * real nested render like moxobo's, the wiring should move it toward the
 * jar... never pin a rise" — structural diffs for this fixture fell 3->1,
 * both closed diffs were exactly these two missing `<image>` elements).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function cachedPuml(slug: string): string {
  return readFileSync(join(REPO_ROOT, 'test-results/dot-cache/class', slug, 'in.puml'), 'utf-8');
}

function imageTags(svg: string): string[] {
  return svg.match(/<image[^>]*>/g) ?? [];
}

function attr(tag: string, name: string): string | undefined {
  return new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1];
}

function decodeHref(href: string): string {
  return Buffer.from(href.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf-8');
}

describe('xadado-92-lazo250 — class-body note {{ }} regions draw real <image>s (CDD B7FU-R2)', () => {
  const svg = renderSync(cachedPuml('xadado-92-lazo250'), { measurer: new WidthTableMeasurer() });
  const images = imageTags(svg);

  it('draws exactly two <image> elements (one per {{ }} note region)', () => {
    expect(images).toHaveLength(2);
  });

  it('detailsNote1 embeds a real 122x124 SEQUENCE render (participant MyA/B), not the (42,42) fallback', () => {
    const seq = images.find((tag) => attr(tag, 'width') === '122');
    expect(seq).toBeDefined();
    expect(attr(seq!, 'height')).toBe('124');
    const decoded = decodeHref(attr(seq!, 'xlink:href')!);
    expect(decoded).toContain('title>MyA');
  });

  it('detailsNote2 embeds a real 105x96 CLASS render (class Object), not the (42,42) fallback', () => {
    const cls = images.find((tag) => attr(tag, 'width') === '105');
    expect(cls).toBeDefined();
    expect(attr(cls!, 'height')).toBe('96');
    const decoded = decodeHref(attr(cls!, 'xlink:href')!);
    expect(decoded).toContain('data-qualified-name="Object"');
  });
});

// ---------------------------------------------------------------------------
// Documented, not silently skipped — see .agent-notes/cdd-B7FU-R2.md
// ---------------------------------------------------------------------------

describe('named-open residual — see .agent-notes/cdd-B7FU-R2.md', () => {
  it.todo(
    'xadado-92-lazo250 full conformance -- blocked on an UNRELATED, pre-existing component-cluster/DOT ' +
      'layout divergence (a ~11-109px positional drift affecting every element in the diagram, not just the ' +
      'two embedded-diagram note regions this task wired) that predates this task and is outside its write-set ' +
      '(class-dot-graph.ts/class-namespace-*.ts own the component/cluster layout, neither listed). The two ' +
      "note images' own SIZE is already byte-exact against the jar (see the describe block above); only their " +
      'X/Y position inherits the same pre-existing drift every other element in this fixture already carries.',
  );
});

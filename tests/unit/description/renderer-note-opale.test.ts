/**
 * renderer-note-opale.test.ts — T1e (opale note port, tefeco-12-rato895
 * mechanism (b)): `note right: <text>` attached to a leaf entity draws
 * `EntityImageNote.java:207-243`'s opale fold-outline + corner triangle
 * (`Opale.ts#resolveOpaleConnector`, `layout-geo-post.ts#applyOpaleNote`,
 * `renderer-note-opale.ts#drawOpaleShape`) instead of a plain box +
 * separately-drawn dashed connector (`SvekEdge#drawU`'s `if (opale)
 * return;`).
 *
 * Oracle-verified 2026-09-30, re-probed under oracle seam #4 v2
 * (`scripts/oracle-render.sh`, deterministic text, `cloud cloud` / `note right:
 * cloud's note`; tests/fixtures/isw-T2-cls/opale-note.svg -- the note is wider
 * now that its space counts): the outline/corner path coordinates below are
 * byte-exact against the jar. The note's own
 * `fill` color is NOT asserted here — `theme.colors.noteBackground`
 * (`#FEFECE`) already diverges from the jar's actual default (`#FEFFDD`,
 * confirmed via the same oracle probe on a floating note) for EVERY note
 * in this port, opale or plain; that is a separate, pre-existing,
 * out-of-scope divergence, not part of this row's mechanism.
 *
 * @see ~/git/plantuml/.../svek/image/EntityImageNote.java:207-243
 * @see ~/git/plantuml/.../svek/GraphvizImageBuilder.java#isOpalisable (:133-146)
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

/** Same deterministic-text call `scripts/oracle-render.sh`'s jar flag and
 *  `plans/class-divergence-drive/tools/render-diff.mts#renderFixture`
 *  both target — without it, text-derived numbers measure real platform
 *  font metrics, not the port (`CLAUDE.md`'s "Render oracles" note). */
function render(src: string): string {
  return renderSync(src, { measurer: new DeterministicMeasurer() });
}

describe('description note — Opale connector (T1e)', () => {
  it('a note attached to one entity draws the Opale fold-outline + corner triangle', () => {
    const svg = render("@startuml\ncloud cloud\nnote right: cloud's note\n@enduml");

    expect(svg).toContain(
      'M108.708,15.195 L108.708,22.695 L73.628,26.695 L108.708,30.695 L108.708,38.195 ' +
        'A0,0 0 0 0 108.708,38.195 L198.689,38.195 A0,0 0 0 0 198.689,38.195 ' +
        'L198.689,25.195 L188.689,15.195 L108.708,15.195 A0,0 0 0 0 108.708,15.195',
    );
    expect(svg).toContain('M188.689,15.195 L188.689,25.195 L198.689,25.195 L188.689,15.195');
    expect(svg).toContain('stroke-width:0.5');
    expect(svg).toContain("cloud's note");
  });

  it('draws no separate connector line for an opalised note (SvekEdge#drawU: if (opale) return;)', () => {
    const svg = render("@startuml\ncloud cloud\nnote right: cloud's note\n@enduml");

    expect(svg).not.toContain('class="link"');
    expect(svg).not.toContain('stroke-dasharray');
  });

  it('a freestanding note (no attachment) still draws a plain box, not an Opale outline', () => {
    // `cloud x` forces DESCRIPTION dispatch -- a bare `note as N1` alone
    // routes to the (already-correct) CLASS engine instead, per
    // `descriptive-keywords.ts`'s own dispatch table.
    const svg = render('@startuml\ncloud x\nnote as N1\nplain note\nend note\n@enduml');

    // The note itself draws exactly one `<rect>` (its plain fallback box);
    // the only `<path>` in the document is `x`'s own cloud shape -- no
    // Opale outline/corner path for the note.
    expect(svg).toContain('<rect');
    expect(svg.match(/<path/g)).toHaveLength(1);
  });

  it('a note linked to ANOTHER note does not opalise (isOpalisable: other end not NOTE)', () => {
    const svg = render(
      '@startuml\ncloud x\nnote as N1\nfirst\nend note\nnote as N2\nsecond\nend note\nN1 --> N2\n@enduml',
    );

    // Both notes stay plain rects; the N1->N2 link still draws its own line.
    expect(svg).toContain('<rect');
    expect(svg).toContain('class="link"');
  });

  it('a note touched by two links does not opalise (isOpalisable: onlyOneLink)', () => {
    const svg = render('@startuml\ncloud a\ncloud b\nnote "shared" as N\na .. N\nb --> N\n@enduml');

    // N stays a plain rect; both links to it still draw as separate lines.
    expect(svg).toContain('<rect');
    expect(svg).toContain('class="link"');
  });
});

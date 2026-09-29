/**
 * T3c (D8, `smetana-pragma-ignored`): `renderEdge`'s STRUCTURAL draw shape
 * for `geo.smetana === true` -- mirrors `SmetanaEdge#drawU`
 * (`sdot/SmetanaEdge.java:106-253`) instead of `SvekEdge#drawU`'s default:
 *
 * 1. extremities draw BEFORE the connecting path (`printExtremityAtStart`/
 *    `printExtremityAtEnd` precede `draw(dotPath)`, `:215-217`) -- SvekEdge
 *    draws the path first.
 * 2. the path carries no `id`/`codeLine` (`SmetanaEdge#drawU` never calls
 *    `Link#idCommentForSvg()`).
 * 3. a `[[url]]` wraps ONLY the extremities+path core, not the label
 *    (`ug.startUrl(url)` / `printExtremityAtStart/End` / `draw(dotPath)` /
 *    `ug.closeUrl()` all run BEFORE the label is drawn, `:200-224`) --
 *    SvekEdge wraps the whole group body.
 *
 * `geo.smetana` is undefined/false for every existing fixture (the flag is
 * a carry-only copy of `ast.layoutEngine === 'smetana'`, not yet wired
 * through `class-edge-geo.ts#buildEdgeGeos` -- see this task's own report),
 * so these tests construct the `EdgeGeo` literal directly, the same
 * "direct unit test of a pure function" precedent
 * `renderer-arrowhead.test.ts`'s own module doc comment states.
 */
import { describe, it, expect } from 'vitest';
import { renderEdge } from '../../../src/diagrams/class/renderer-edge.js';
import type { EdgeGeo } from '../../../src/diagrams/class/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { scaleClassTheme } from '../../../src/diagrams/class/class-scale-geo.js';

const theme = scaleClassTheme(defaultTheme, 1);

/** A fresh `RenderEdgeContext` per call -- `ids` is a diagram-wide
 *  collision set `linkIdForSvg` mutates on every non-smetana render, so a
 *  shared module-level instance would leak a `-1` suffix into whichever
 *  test runs second (`uniqLinkId`'s own doc comment). */
function makeCtx(): { ids: Set<string>; syntheticNames: Map<string, string> } {
  return { ids: new Set<string>(), syntheticNames: new Map<string, string>() };
}

function makeEdgeGeo(overrides?: Partial<EdgeGeo>): EdgeGeo {
  return {
    id: 'edge-0',
    points: [
      { x: 70, y: 70 },
      { x: 70, y: 140 },
    ],
    targetDecor: 'none',
    sourceDecor: 'none',
    dashed: false,
    from: 'A',
    to: 'B',
    ...overrides,
  };
}

describe('renderEdge — smetana draw shape (T3c, D8)', () => {
  it('draws extremities (tail then head) BEFORE the connecting path', () => {
    const geo = makeEdgeGeo({ sourceDecor: 'triangle', targetDecor: 'square', smetana: true });
    const { body } = renderEdge(geo, theme, makeCtx());
    expect(body.indexOf('<polygon')).toBeLessThan(body.indexOf('<rect'));
    expect(body.indexOf('<rect')).toBeLessThan(body.indexOf('<path'));
  });

  it('draws the connecting path FIRST (before extremities) when not smetana — regression', () => {
    const geo = makeEdgeGeo({ sourceDecor: 'triangle', targetDecor: 'square' });
    const { body } = renderEdge(geo, theme, makeCtx());
    expect(body.indexOf('<path')).toBeLessThan(body.indexOf('<polygon'));
    expect(body.indexOf('<polygon')).toBeLessThan(body.indexOf('<rect'));
  });

  it('omits id/codeLine on the path when smetana', () => {
    const geo = makeEdgeGeo({ smetana: true, sourceLine: 3 });
    const { body } = renderEdge(geo, theme, makeCtx());
    expect(body).toBe('<path d="M70,70 L70,140" fill="none" stroke="#181818" stroke-width="1"/>');
  });

  it('keeps id/codeLine on the path when NOT smetana — regression', () => {
    const geo = makeEdgeGeo({ sourceLine: 3 });
    const { body } = renderEdge(geo, theme, makeCtx());
    expect(body).toBe('<path d="M70,70 L70,140" fill="none" stroke="#181818" stroke-width="1" id="A-B" codeLine="3"/>');
  });

  it('a [[url]] wraps ONLY the core (extremities+path), not the label', () => {
    const geo = makeEdgeGeo({
      smetana: true,
      url: { url: 'http://x', tooltip: 'y', label: 'y' },
      label: { text: 'foo', x: 50, y: 96, width: 18 },
    });
    const { body } = renderEdge(geo, theme, makeCtx());
    expect(body).toBe(
      '<a target="_top" href="http://x" xlink:href="http://x" xlink:type="simple" xlink:actuate="onRequest" xlink:show="new" title="y" xlink:title="y">' +
        '<path d="M70,70 L70,140" fill="none" stroke="#181818" stroke-width="1"/></a>' +
        '<text x="50" y="96" font-size="13" fill="#000" textLength="18">foo</text>',
    );
  });

  it('a [[url]] wraps the WHOLE body (path+label) when NOT smetana — regression', () => {
    const geo = makeEdgeGeo({
      url: { url: 'http://x', tooltip: 'y', label: 'y' },
      label: { text: 'foo', x: 50, y: 96, width: 18 },
    });
    const { body } = renderEdge(geo, theme, makeCtx());
    expect(body.startsWith('<a target="_top"')).toBe(true);
    expect(body.endsWith('</a>')).toBe(true);
    expect(body).toContain('<text x="50" y="96"');
  });
});

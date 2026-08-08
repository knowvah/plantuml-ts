/**
 * T5b — the root `<g>`'s hoisted text attributes, and the two
 * document-shell seams that have to agree about them.
 *
 * The SVG-size-reduction port (rule 3) moved `font-family="sans-serif"`
 * and `lengthAdjust="spacing"` off every `<text>` and onto the document's
 * root `<g>` — jar-verified for class, state, object AND description
 * against the pinned oracle jar, which emits exactly
 * `<g font-family="sans-serif" lengthAdjust="spacing">` as the first
 * element after `<defs>`.
 *
 * Two consequences pinned here:
 *  1. `unwrapContentG` must accept an ATTRIBUTED content `<g>` (klimt now
 *     emits one) while still rejecting a body that carries no `<g>`
 *     wrapper at all — the error exists because a malformed klimt document
 *     that slips through fails far downstream instead.
 *  2. `assembleDocumentShell` is the ONE place the three klimt-shaped
 *     shells (class/state/description) get those attributes onto their
 *     root `<g>`, so all four `assembleSvg` paths agree.
 */
import { describe, it, expect } from 'vitest';
import {
  assembleDocumentShell,
  extractFlatContent,
  unwrapContentG,
} from '../../../../src/core/klimt/document-shell.js';
import { ROOT_GROUP_OPEN } from '../../../../src/core/svg.js';

const INNER = '<rect x="1" y="2" width="3" height="4"/>';
const CLOSE = '</g>';

function shell(body: string): string {
  return assembleDocumentShell({ body, width: 100, height: 50 }, 'CLASS');
}

/** Everything the assembled document places between its `<defs>` block and
 *  the closing `</svg>`. */
function afterDefs(svg: string): string {
  const end = svg.indexOf('</defs>');
  expect(end).toBeGreaterThan(-1);
  return svg.slice(end + '</defs>'.length, svg.lastIndexOf('</svg>'));
}

describe('unwrapContentG — attributed vs. malformed content <g>', () => {
  it('returns the inner markup for an ATTRIBUTED root <g>', () => {
    expect(unwrapContentG(ROOT_GROUP_OPEN + INNER + CLOSE)).toBe(INNER);
  });

  it('still returns the inner markup for a bare root <g>', () => {
    expect(unwrapContentG('<g>' + INNER + CLOSE)).toBe(INNER);
  });

  it('strips klimt’s leading processing instruction first', () => {
    const body = '<?plantuml $version$?>' + ROOT_GROUP_OPEN + INNER + CLOSE;
    expect(unwrapContentG(body)).toBe(INNER);
  });

  it('throws when the body carries no root <g> at all', () => {
    expect(() => unwrapContentG(INNER)).toThrow(/malformed klimt SVG output/);
  });

  it('throws when the root <g> is never closed', () => {
    expect(() => unwrapContentG(ROOT_GROUP_OPEN + INNER)).toThrow(
      /malformed klimt SVG output/,
    );
  });

  it('does not mistake a different element name for the content <g>', () => {
    expect(() => unwrapContentG('<glyph x="1">' + INNER + CLOSE)).toThrow(
      /malformed klimt SVG output/,
    );
  });

  it('round-trips a klimt document whose content <g> is attributed', () => {
    const doc = shell('<g>' + INNER + CLOSE);
    expect(extractFlatContent(doc)).toEqual({ body: INNER, extraDefs: '' });
  });
});

describe('assembleDocumentShell — root <g> text attributes', () => {
  it('emits the jar’s exact root <g> as the first element after <defs>', () => {
    expect(afterDefs(shell('<g>' + INNER + CLOSE))).toBe(
      '<g font-family="sans-serif" lengthAdjust="spacing">' + INNER + CLOSE,
    );
  });

  it('reaches that markup through the ONE shared definition', () => {
    expect(afterDefs(shell('<g>' + INNER + CLOSE)).startsWith(ROOT_GROUP_OPEN)).toBe(true);
  });

  it('leaves an already-attributed root <g> untouched (idempotent)', () => {
    const body = ROOT_GROUP_OPEN + INNER + CLOSE;
    expect(afterDefs(shell(body))).toBe(body);
  });

  it('preserves the content <g>’s first child position when upgrading', () => {
    const first = '<rect x="0" y="0" width="100" height="50" fill="#EEE"/>';
    expect(afterDefs(shell('<g>' + first + INNER + CLOSE))).toBe(
      ROOT_GROUP_OPEN + first + INNER + CLOSE,
    );
  });
});

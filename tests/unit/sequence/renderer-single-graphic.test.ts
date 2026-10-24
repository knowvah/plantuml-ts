/**
 * sdd3-T8e: the whole sequence page is drawn into ONE `UGraphicSvg`, as the
 * jar draws it (`TextBlockExporter.java:169-177`), and no sequence module
 * still returns a shape string. After this move `drawPaginated` is one
 * `openSequenceGraphic` and a sequence of `draw...(g.ug, ...)` calls in the
 * five-pass order (`PlayingSpaceWithParticipants.java:218-227`).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, it, expect, vi } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { renderSequence, renderSequencePage } from '../../../src/diagrams/sequence/renderer.js';
import type * as RendererUg from '../../../src/diagrams/sequence/renderer-ug.js';
import { layoutBody } from './frame-paint-fixtures.js';
import { tagsOf } from '../../helpers/svg-tags.js';

const opened = vi.hoisted(() => ({ count: 0, minDims: [] as Array<{ width: number; height: number }> }));

vi.mock('../../../src/diagrams/sequence/renderer-ug.js', async (importOriginal) => {
  const original = await importOriginal<typeof RendererUg>();
  return {
    ...original,
    openSequenceGraphic: (...args: Parameters<typeof original.openSequenceGraphic>) => {
      opened.count += 1;
      opened.minDims.push({ ...args[1] });
      return original.openSequenceGraphic(...args);
    },
  };
});

const MEASURER = new DeterministicMeasurer();

/** A document with a box, a frame with an else, a note, a divider and a link:
 *  every region the move converted. */
const PAGE = [
  'box "Group" #LightBlue',
  'participant A',
  'end box',
  'participant B',
  '{start} A -> B : a',
  'alt x',
  'B -> A : b',
  'else y',
  'A -> B : c',
  'end',
  'note right of B : n',
  '== Init ==',
  '{end} B -> A : d',
  '{start} <-> {end} : some time',
].join('\n');

describe('the page is one graphic', () => {
  it('opens exactly one UGraphicSvg per rendered page, floored at the page extent', () => {
    const geo = layoutBody(PAGE, MEASURER);
    opened.count = 0;
    opened.minDims.length = 0;
    const { body } = renderSequence(geo, defaultTheme, MEASURER);
    expect(opened.count).toBe(1);
    expect(opened.minDims).toEqual([{ width: geo.totalWidth, height: geo.totalHeight }]);
    // Every region reached the one document: box, frame outline, note, divider.
    expect(tagsOf(body, 'rect').length).toBeGreaterThan(6);
    expect(tagsOf(body, 'path').length).toBeGreaterThan(1);
  });

  it('opens one more for each further page of a paginated document', () => {
    const geo = layoutBody('A -> B : a\nnewpage\nB -> A : b', MEASURER);
    opened.count = 0;
    renderSequencePage(geo, defaultTheme, 0, MEASURER);
    renderSequencePage(geo, defaultTheme, 1, MEASURER);
    expect(opened.count).toBe(2);
  });

  it('draws the five passes in the jar order on that one document', () => {
    const { body } = renderSequence(layoutBody(PAGE, MEASURER), defaultTheme, MEASURER);
    // Pass 0 (boxes), pass 1 (the link anchors close `drawUInternal`, so the
    // anchor head precedes the lifelines), pass 2 (the lifelines), passes 3-4
    // (heads, footers), pass 5 (the foreground tiles: the last message head).
    const boxAt = body.indexOf('fill="#ADD8E6"');
    const firstAnchorHeadAt = body.indexOf('<polygon');
    const lifelineAt = body.indexOf('<g><title>');
    const headAt = body.indexOf('fill="#E2E2F0"');
    const lastMessageHeadAt = body.lastIndexOf('<polygon');
    expect(boxAt).toBeGreaterThanOrEqual(0);
    expect([boxAt, firstAnchorHeadAt, lifelineAt, headAt, lastMessageHeadAt]).toEqual(
      [boxAt, firstAnchorHeadAt, lifelineAt, headAt, lastMessageHeadAt].sort((x, y) => x - y),
    );
  });
});

describe('the page defs', () => {
  it('carry the font @import once, as the jar writes it into <defs> (SvgGraphics#addRoboto)', () => {
    const geo = layoutBody('<style>\nroot {\n FontName Roboto\n}\n</style>\nA -> B : x\nB -> A : y', MEASURER);
    const fragment = renderSequence(geo, defaultTheme, MEASURER);
    expect(fragment.extraDefs?.match(/@import/g)).toHaveLength(1);
    expect(fragment.body).not.toContain('@import');
  });

  it('carry nothing for a document that never names the font', () => {
    const fragment = renderSequence(layoutBody('A -> B : x', MEASURER), defaultTheme, MEASURER);
    expect(fragment.extraDefs).toBeUndefined();
  });
});

describe('no sequence module returns a shape string', () => {
  const SRC = 'src/diagrams/sequence';
  const MODULES = [...readdirSync(SRC).filter((f) => /^renderer[\w-]*\.ts$/.test(f)), 'sequence-text.ts'];
  /** The SVG string emitters of `core/svg.ts` / `core/svg-shapes.ts`. */
  const EMITTERS = ['line', 'rect', 'path', 'polygon', 'ellipse', 'text', 'image', 'linkWrap', 'decorationLines'];

  it.each(MODULES)('%s imports no string shape emitter and exports no render<X> markup function', async (file) => {
    const source = readFileSync(`${SRC}/${file}`, 'utf8');
    for (const [, names] of source.matchAll(/import \{([^}]*)\} from '\.\.\/\.\.\/core\/svg(?:-shapes)?\.js'/g)) {
      const imported = names!.split(',').map((n) => n.trim().split(' as ')[0]);
      expect(
        imported.filter((n) => EMITTERS.includes(n!)),
        file,
      ).toEqual([]);
    }
    const module = (await import(`../../../${SRC}/${file.replace(/\.ts$/, '.js')}`)) as Record<string, unknown>;
    const exports = Object.keys(module);
    const renderers = exports.filter((name) => /^render[A-Z]/.test(name) && !/^renderSequence(Page)?$/.test(name));
    expect(renderers, file).toEqual([]);
    // sdd3-T8g: the migration bridge is gone with the wrappers it served.
    expect(exports, file).not.toContain('drawToString');
  });
});

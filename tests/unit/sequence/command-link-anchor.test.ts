/**
 * sdd2 T2e: `CommandLinkAnchor` (`CommandLinkAnchor.java:55-63,85-90`) and the
 * draw pass `PlayingSpace.java:129-134` -> `LinkAnchor.java:82-123`.
 *
 * Geometry expectations are the jar's own `in.svg` for `zoturo-25-jima978`
 * (`{start} Alice -> Bob` ... `{end} Bob -> Alice`, `{start} <-> {end} : some
 * time`): the link at x=138.8 from y=68 to y=145, an up head at 68, a down
 * head at 145, the label at x=142.8, baseline 110.111.
 */
import { attrsOf, tagsOf, type TagAttrs } from '../../helpers/svg-tags.js';
import { describe, expect, it } from 'vitest';
import { assembleSvg } from '../../../src/core/assemble-svg.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import { linkAnchorCommand } from '../../../src/diagrams/sequence/command-link-anchor.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { renderSequence } from '../../../src/diagrams/sequence/renderer.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

const measurer = new DeterministicMeasurer();

const ZOTURO = [
  '{start} Alice -> Bob : start doing things during duration',
  'Bob -> Max : something',
  'Max -> Bob : something else',
  '{end} Bob -> Alice : finish',
  '',
  '{start} <-> {end} : some time',
];

function parse(lines: readonly string[]): SequenceDiagramAST {
  return astOrThrow(parseSequence(sequenceSource(lines)), 'sequence');
}

const render = (lines: readonly string[]): string =>
  renderSequence(layoutSequence(parse(lines), defaultTheme, measurer), defaultTheme, measurer).body;

describe('linkAnchorCommand pattern (CommandLinkAnchor.java:55-63)', () => {
  it('captures both anchors and the label after the colon', () => {
    const full = linkAnchorCommand.pattern.exec('{a1} <-> {é2}  :   5 s');
    expect([full?.[1], full?.[2], full?.[3]]).toEqual(['a1', 'é2', '5 s']);
  });

  it('refuses a space inside the braces', () => {
    expect(linkAnchorCommand.pattern.test('{a 1} <-> {b}')).toBe(false);
  });

  it('leaves the message undefined when the line has no colon', () => {
    const m = linkAnchorCommand.pattern.exec('{a1}<->{a2}');
    expect([m?.[1], m?.[2], m?.[3]]).toEqual(['a1', 'a2', undefined]);
  });
});

describe('parsing', () => {
  it('records a link anchor node and emits no event for it', () => {
    const ast = parse(ZOTURO);
    expect(ast.linkAnchors).toEqual([{ anchor1: 'start', anchor2: 'end', message: 'some time' }]);
    expect(ast.events.map((e) => e.kind)).toEqual(['message', 'message', 'message', 'message']);
  });
});

describe('layout and draw (zoturo-25-jima978 in.svg)', () => {
  const geo = layoutSequence(parse(ZOTURO), defaultTheme, measurer);

  it('places the link between the two contact lines, inset by 2', () => {
    const link = geo.linkAnchors?.[0];
    expect(link?.x).toBeCloseTo(138.8, 2);
    expect([link?.yStart, link?.yEnd, link?.thickness]).toEqual([68, 145, 1]);
  });

  it('emits shaft, up head, down head and label, in the jar order', () => {
    const body = render(ZOTURO);
    const tags = [...body.matchAll(/<(line|polygon|text)\b[^>]*>/g)].map((m): TagAttrs => ({
      ...attrsOf(m[0]),
      name: m[1]!,
    }));
    const isShaft = (t: TagAttrs): boolean => t.name === 'line' && t.x1 === '138.8' && t.y1 === '68' && t.y2 === '145';
    const at = [
      tags.findIndex(isShaft),
      tags.findIndex((t) => t.points === '134.8,78,138.8,68,142.8,78,138.8,74'),
      tags.findIndex((t) => t.points === '134.8,135,138.8,145,142.8,135,138.8,139'),
      tags.findIndex((t) => t.name === 'text' && t.x === '142.8' && t.y === '110.111'),
    ];
    expect(at.every((i) => i >= 0)).toBe(true);
    expect(at).toEqual([...at].sort((a, b) => a - b));
    expect(tags[at[0]!]).toMatchObject({ stroke: '#181818', 'stroke-width': '1' });
  });

  it('draws the link in both the background and the foreground pass', () => {
    const shafts = tagsOf(render(ZOTURO), 'line').filter((t) => t.x1 === '138.8' && t.y1 === '68' && t.y2 === '145');
    expect(shafts).toHaveLength(2);
  });

  it('draws nothing when an anchor matches no message', () => {
    const lines = ['A -> B : x', '{a} <-> {b} : lost'];
    expect(layoutSequence(parse(lines), defaultTheme, measurer).linkAnchors).toBeUndefined();
  });

  it('finds an anchored message inside a group (nizuzi-32-babe798)', () => {
    const lines = ['group G', ...ZOTURO.map((l) => ` ${l}`), 'end'];
    expect(layoutSequence(parse(lines), defaultTheme, measurer).linkAnchors).toHaveLength(1);
  });

  it('takes the middle of an exo-from-left tile from border 1 (fojomu-60-cuda302)', () => {
    const lines = [
      '{start} [-> Bob : start doing things during duration',
      'Bob -> Max : something',
      'Max -> Bob : something else',
      '{end} [-> Alice : finish',
      '{start} <-> {end} : some time',
    ];
    const link = layoutSequence(parse(lines), defaultTheme, measurer).linkAnchors?.[0];
    expect(link?.x).toBeCloseTo(76.884, 2);
    expect([link?.yStart, link?.yEnd]).toEqual([68, 145]);
  });

  it('emits no label for a link without a message', () => {
    const lines = ['{a} A -> B : x', '{b} B -> A : y', '{a} <-> {b}'];
    const link = layoutSequence(parse(lines), defaultTheme, measurer).linkAnchors?.[0];
    expect(link?.labelRuns).toEqual([]);
  });

  it('scales every length at emission', () => {
    const scaled = { ...defaultTheme };
    const scaledGeo = layoutSequence(parse(['scale 2', ...ZOTURO]), scaled, measurer);
    // The scale is the exporter's (`core/TextBlockExporter.ts#exportTo`), so read the assembled document.
    const body = assembleSvg(renderSequence(scaledGeo, scaled, measurer));
    expect(body).toContain('x1="277.6" y1="136" x2="277.6" y2="290"');
  });
});

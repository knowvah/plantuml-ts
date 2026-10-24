/**
 * sdd1 T3f: an `else` is an `ElseTile`, one of its group's child tiles
 * (`GroupingTile.java:162-170,280-281`), so it is drawn among them, in tile
 * order, and paints from its own leaf style (`ElseTile.java:92-101`).
 * Expected orders and colours are the jar's (`scripts/oracle-render.sh`,
 * deterministic text) on the `ALT3` body below.
 */
import { describe, expect, it } from 'vitest';
import { assembleSvg } from '../../../src/core/assemble-svg.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { ElseGeo, FrameGeo, SequenceGeometry } from '../../../src/diagrams/sequence/ast.js';
import { renderSequence } from '../../../src/diagrams/sequence/renderer.js';
import { fmt } from '../../../src/core/svg-format.js';
import { layoutBody } from './frame-paint-fixtures.js';

const measurer = new DeterministicMeasurer();

/** Three branches, and a border colour set between the 2nd and 3rd. */
const ALT3 = [
  'Alice -> Bob : hello',
  'alt x',
  'Bob -> Alice : yes',
  'else y',
  'Bob -> Alice : no',
  'skinparam sequenceGroupBorderColor red',
  'else z',
  'Bob -> Alice : maybe',
  'end',
].join('\n');

function render(geo: SequenceGeometry): string {
  return renderSequence(geo, defaultTheme, measurer).body;
}

function elses(geo: SequenceGeometry): ElseGeo[] {
  return geo.events.filter((e): e is ElseGeo => e.kind === 'else');
}

/** Each drawn element's tag and the text it carries, in document order. */
function drawOrder(body: string): string[] {
  return [...body.matchAll(/<(text|line|polygon|rect|path)\b[^>]*?(?:\/>|>([^<]*)<\/text>)/g)].map((m) =>
    m[1] === 'text' ? `text:${m[2]}` : m[1]!,
  );
}

describe('else tile order (GroupingTile.java:280-281, ElseTile#drawU)', () => {
  it('places each else in the event stream after the branch it closes', () => {
    const kinds = layoutBody(ALT3, measurer).events.map((e) => e.kind);
    expect(kinds).toEqual(['message', 'frame', 'message', 'else', 'message', 'else', 'message']);
  });

  it('draws each else rule and condition between the messages around it', () => {
    const order = drawOrder(render(layoutBody(ALT3, measurer)));
    const at = (s: string): number => order.indexOf(s);
    // Jar: ... text:yes, line (dashed), text:[y], polygon, line, text:no, line, text:[z], ...
    expect(at('text:[y]')).toBe(at('text:yes') + 2);
    expect(order[at('text:yes') + 1]).toBe('line');
    expect(at('text:no')).toBeGreaterThan(at('text:[y]'));
    expect(at('text:[z]')).toBe(at('text:no') + 2);
    expect(at('text:maybe')).toBeGreaterThan(at('text:[z]'));
  });

  it('spans the frame and sits one pixel below the else tile top (ComponentRoseGroupingElse.java:106-107)', () => {
    const geo = layoutBody(ALT3, measurer);
    const frame = geo.events.find((e): e is FrameGeo => e.kind === 'frame')!;
    const [first] = elses(geo);
    expect(first!.x).toBe(frame.x);
    expect(first!.width).toBe(frame.width);
    expect(first!.y).toBe(frame.branchSeparators[0]!.y);
    const y = fmt(first!.y + 1);
    expect(render(geo)).toContain(
      `<line x1="${fmt(frame.x)}" y1="${y}" x2="${fmt(frame.x + frame.width)}" y2="${y}" stroke="#000" stroke-width="1" stroke-dasharray="2,2"/>`,
    );
  });

  it('scales an else tile at emission under `scale 2` (SvgGraphics.java:466-468,555-561)', () => {
    const geo = layoutBody(`scale 2\n${ALT3}`, measurer);
    const [first] = elses(geo);
    const frame = geo.events.find((e): e is FrameGeo => e.kind === 'frame')!;
    const y = fmt(2 * (first!.y + 1));
    // The scale is the exporter's (`core/TextBlockExporter.ts#exportTo`), so read the assembled document.
    const svg = assembleSvg(renderSequence(geo, defaultTheme, measurer));
    expect(svg).toContain(
      `<line x1="${fmt(2 * frame.x)}" y1="${y}" x2="${fmt(2 * (frame.x + frame.width))}" y2="${y}" stroke="#000" stroke-width="2" stroke-dasharray="4,4"/>`,
    );
    const condition = first!.runs[0]!;
    expect(svg).toContain(`y="${fmt(2 * condition.y)}"`);
  });

  it('draws nothing for an else in the background pass', () => {
    const body = render(layoutBody(ALT3, measurer));
    expect(body.match(/stroke-dasharray="2,2"/g)).toHaveLength(2);
  });
});

describe('else paint (ElseTile.java:92-101, ComponentRoseGroupingElse.java:64-72)', () => {
  it('strokes each else rule with its own leaf style, so a mid-branch border colour reaches only the later else', () => {
    const geo = layoutBody(ALT3, measurer);
    const [y, z] = elses(geo);
    // Jar: the `[y]` rule `stroke:#000`, the `[z]` rule `stroke:#F00`.
    expect(y!.paint.stroke).toBe('#000000');
    expect(z!.paint.stroke).toBe('#FF0000');
    const body = render(geo);
    const rule = (e: ElseGeo, stroke: string): string =>
      `y1="${fmt(e.y + 1)}" x2="${fmt(e.x + e.width)}" y2="${fmt(e.y + 1)}" stroke="${stroke}" stroke-width="1" stroke-dasharray="2,2"/>`;
    expect(body).toContain(rule(y!, '#000'));
    expect(body).toContain(rule(z!, '#F00'));
    // The frame itself keeps the opener's colour (GroupingStart's own builder).
    const frame = geo.events.find((e): e is FrameGeo => e.kind === 'frame')!;
    expect(frame.paint!.stroke).toBe('#000000');
  });

  it('keeps the stroke at 1 whatever the leaf LineThickness (stroke(ug, 2, 2, 1), ComponentRoseGroupingElse.java:106)', () => {
    const geo = layoutBody(`skinparam sequenceGroupBorderThickness 3\n${ALT3}`, measurer);
    const [y] = elses(geo);
    expect(y!.paint.thickness).toBe(3);
    expect(render(geo)).toContain(`y2="${fmt(y!.y + 1)}" stroke="#000" stroke-width="1" stroke-dasharray="2,2"/>`);
  });
});

/** Every `<text>` of `body` as `[x, text, font-size]`, in document order. */
function texts(body: string): [string, string, string][] {
  return [...body.matchAll(/<text x="([^"]*)"[^>]*font-size="([^"]*)"[^>]*>([^<]*)<\/text>/g)].map((m) => [
    m[1]!,
    m[3]!,
    m[2]!,
  ]);
}

describe('group header comment (CommandGrouping.java:139-149, ComponentRoseGroupingHeader.java:84-91)', () => {
  const GROUPS = ['Alice -> Bob : hello', 'group Title [the comment]', 'Bob -> Alice : yes', 'end'];

  it('draws `group T [c]` as title T and a [c] comment at the body font, LEFT, beside the tab', () => {
    const geo = layoutBody(GROUPS.join('\n'), measurer);
    const frame = geo.events.find((e): e is FrameGeo => e.kind === 'frame')!;
    expect(frame.tabText).toBe('Title ');
    expect(frame.tabComment).toBe('the comment');
    // Jar: `<text x="31.225" ... font-size="13">Title</text>`, then
    // `<text x="104.419" ... font-size="11">[the comment]</text>`; the tab
    // path ends at x 89.419, i.e. the title's width keeps its space.
    const drawn = texts(render(geo)).filter(([, t]) => t === 'Title' || t === '[the comment]');
    expect(drawn.map(([, t, size]) => [t, size])).toEqual([
      ['Title', '13'],
      ['[the comment]', '11'],
    ]);
    expect(Number(drawn[1]![0]) - Number(drawn[0]![0])).toBeCloseTo(frame.tabWidth, 3);
  });

  it('draws `group [c]` with an empty title: a tab two pixels tall and the comment beside it', () => {
    const geo = layoutBody(['Alice -> Bob : hello', 'group [only]', 'Bob -> Alice : no', 'end'].join('\n'), measurer);
    const frame = geo.events.find((e): e is FrameGeo => e.kind === 'frame')!;
    // Jar: `M16.225,148 L61.225,148 L61.225,140 L51.225,150 L16.225,150` --
    // an empty title is a `TextBlockEmpty` (AbstractTextualComponent.java:
    // 87-88), so the tab is its padding alone: 45 wide, 1 + 1 tall.
    expect(frame.tabHeight).toBe(2);
    expect(frame.tabWidth).toBe(45);
    const [comment] = texts(render(geo)).filter(([, t]) => t === '[only]');
    expect(Number(comment![0])).toBeCloseTo(frame.x + 15 + 45, 3);
  });
});

/**
 * unwind2-S3: a tab in a label advances to the next tab stop, in every
 * engine, exactly as the jar draws it.
 *
 * Upstream: `Display#getWithNewlines` turns the `\t` escape into a real tab
 * (`klimt/creole/Display.java:305-306`) and keeps `%tab()`'s
 * `Jaws.BLOCK_E1_REAL_TABULATION` verbatim (`Display.java:315-317`). Every
 * text run is then an `AtomText` (creole) or `TileText`, whose `drawU`
 * tokenizes on both characters (`AtomText.java:210-233`,
 * `TileText.java:94-117`): each tab advances `x` to the next multiple of
 * the tab stop (`x += tabSize - x % tabSize`) and draws nothing; every other
 * token draws its own `<text>` at `x`. The width is the same walk
 * (`AtomText.java:239-256`).
 *
 * Each `tests/fixtures/unwind2-S3/<name>.puml` sits beside the jar's own
 * `<name>.svg`, rendered by `scripts/oracle-render.sh` (deterministic text).
 *
 *  - `conformant`: `compareSvg` passes outright.
 *  - `texts`: every drawn `<text>` (content, x, y, textLength) and the
 *    canvas width match the jar's, in order -- for sequence, whose engine is
 *    not yet conformant on unrelated chrome (stroke-width, rx), so a full
 *    compare would measure that, not the tab stops.
 *  - `lineShapes`: per baseline, each `<text>`'s offset from the line's
 *    first one -- for sequence notes, whose box x is off the jar's by the
 *    note padding (10 here, 15 upstream: `sequence-layout-events.ts
 *    #handleNoteEvent`), a tab-free defect the tab stops do not depend on.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderSync } from '../../../../../src/index.js';
import { DeterministicMeasurer } from '../../../../../src/core/measurer-deterministic.js';
import { compareSvg } from '../../../../oracle/svg-conformance/compare.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../../../../fixtures/unwind2-S3');
const RE_TEXT = /<text([^>]*)>([^<]*)<\/text>/g;
const RE_SVG_WIDTH = /<svg[^>]* width="([^"]*)"/;
const TEXT_ATTRS = ['x', 'y', 'textLength'] as const;

function load(name: string): { ours: string; jar: string } {
  const source = readFileSync(join(FIXTURES, `${name}.puml`), 'utf-8');
  const ours = renderSync(source, { measurer: new DeterministicMeasurer() });
  return { ours, jar: readFileSync(join(FIXTURES, `${name}.svg`), 'utf-8') };
}

function attr(attrs: string, key: string): string | undefined {
  return new RegExp(` ${key}="([^"]*)"`).exec(attrs)?.[1];
}

/** Every `<text>` as `content@x,y[textLength]` plus the canvas width. */
function textGeometry(svg: string): string[] {
  const texts = [...svg.matchAll(RE_TEXT)].map((m) => {
    const [x, y, len] = TEXT_ATTRS.map((k) => attr(m[1]!, k) ?? '');
    return `${m[2]!}@${x},${y}[${len}]`;
  });
  return [`width=${RE_SVG_WIDTH.exec(svg)?.[1] ?? ''}`, ...texts];
}

/** Per baseline `y`: `content+dx[textLength]`, dx from the line's first run. */
function lineShapes(svg: string): string[][] {
  const lines = new Map<string, { x: number; label: string }[]>();
  for (const m of svg.matchAll(RE_TEXT)) {
    const y = attr(m[1]!, 'y') ?? '';
    const row = lines.get(y) ?? [];
    row.push({ x: Number(attr(m[1]!, 'x')), label: `${m[2]!}[${attr(m[1]!, 'textLength') ?? ''}]` });
    lines.set(y, row);
  }
  return [...lines.values()].map((row) => row.map((r) => `${r.label}+${(r.x - row[0]!.x).toFixed(3)}`));
}

function expectConformant(name: string): void {
  const { ours, jar } = load(name);
  expect(compareSvg(ours, jar, 'deterministic').diffs).toEqual([]);
}

function expectTextsLikeJar(name: string): void {
  const { ours, jar } = load(name);
  expect(textGeometry(ours)).toEqual(textGeometry(jar));
}

describe('unwind2-S3: tab stops (AtomText.java:210-256)', () => {
  it.each([
    'class-member-tab',
    'class-note-tab',
    'class-header-table-tab',
    'activity-action-tab',
    'activity-note-tab',
    'state-tab',
    'usecase-tab',
  ])('%s: tabs advance to the next stop, conformant with the jar', (name) => {
    expectConformant(name);
  });

  it("sequence-note-tab: each note line places its tokens at the jar's stops", () => {
    const { ours, jar } = load('sequence-note-tab');
    expect(lineShapes(ours)).toEqual(lineShapes(jar));
  });

  it.each(['sequence-message-tab', 'sequence-participant-tab', 'sequence-dashed-arrow-tab', 'sequence-tab-builtin'])(
    '%s: every <text> sits where the jar draws it',
    (name) => {
      expectTextsLikeJar(name);
    },
  );
});

describe('unwind2-S3: tabs in link labels', () => {
  // The class link label is `Display.getWithNewlines` + `create0`
  // (`svek/SvekEdge.java:288-300`): AtomText runs, sized and drawn through
  // the tab walk (`class-layout-edge-labels.ts`, `renderer-edge-label.ts`).
  it('class-link-tab: tabs advance to the next stop, conformant with the jar', () => {
    expectConformant('class-link-tab');
  });

  // OPEN, not tab defects: these labels never reach `Display#getWithNewlines`
  // at all, so the `\t` escape is drawn as a literal backslash-t (and `\n`
  // does not break -- the unwind-U3 `newline-usecase`/`newline-state`
  // `it.fails`). A map cell is `Display.getWithNewlines(pragma, key)`
  // (`cucadiagram/TextBlockMap.java:176`); a description link label is drawn
  // as one raw `UText` by `core/svek/SvekEdge.ts#drawLabels`; a state
  // transition label keeps its raw text for drawing. `it.fails` turns red the
  // day a consumer is fixed -- move it up then.
  it.fails.each(['usecase-link-tab', 'state-transition-tab', 'class-map-tab'])(
    '%s: consumer does not decode the \\t escape yet',
    (name) => {
      expectConformant(name);
    },
  );
});

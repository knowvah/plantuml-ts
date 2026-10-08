/**
 * add4-T1c: `floating note` -- `NoteType.defaultType("floating note")` is
 * `FLOATING_NOTE` (`sequencediagram/NoteType.java:43-48`), and
 * `FtileWithNoteOpale.java:132-133` forces `withLink = false` for it: the
 * Opale is drawn as the plain (spike-less) polygon. `in.svg` was rendered
 * through `scripts/oracle-render.sh`.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { activityPlugin } from '../../../src/diagrams/activity/index.js';
import type { ActivityDiagramAST } from '../../../src/diagrams/activity/ast.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { parseAst } from '../../helpers/parse-ast.js';
import { renderActivityFixture } from '../../helpers/activity-text-position.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T1c');

function notesOf(lines: readonly string[]): ActivityDiagramAST['nodes'] {
  const block: UmlSource = { lines, type: 'activity' };
  return parseAst(activityPlugin, block).nodes.filter((n) => n.kind === 'note');
}

/** Every `<path d="...">`, document order. */
function pathDs(svg: string): string[] {
  return [...svg.matchAll(/<path\b[^>]*?\sd="([^"]*)"/g)].map((m) => m[1]!);
}

describe('floating note -- parse', () => {
  it('single-line and multi-line `floating note` set floating; a plain note omits it', () => {
    const notes = notesOf([':a;', 'floating note right: f', 'floating note left', 'm', 'end note', 'note right: n']);
    expect(notes.map((n) => ('floating' in n ? n.floating : undefined))).toEqual([true, true, undefined]);
  });
});

describe('floating note -- rendered (note-floating fixture)', () => {
  const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, 'note-floating');

  it('two floating notes draw no spike, the linked one does -- every note path d equals the jar', () => {
    const jar = pathDs(golden);
    expect(jar).toHaveLength(6);
    expect(jar[0]).not.toContain('A0,0');
    expect(jar[4]).toContain('A0,0');
    expect(pathDs(ours).map((d) => d.replace(/\d+\.\d+/g, (v) => String(Number(Number(v).toFixed(3)))))).toEqual(jar);
  });

  it('canvas width equals the jar (no spike ink widening the floating notes)', () => {
    const width = (svg: string): string | undefined => /<svg\b[^>]*?\swidth="([^"]*)"/.exec(svg)?.[1];
    expect(width(ours)).toBe(width(golden));
    expect(width(golden)).toBe('216px');
  });
});

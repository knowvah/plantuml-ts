/**
 * End-to-end (parse -> tile -> layout) coverage for NOTE-MULTI
 * (`FtileWithNoteOpale.create`'s own `notes.size() > 1` arm) and
 * GROUPNOTE (`InstructionGroup#createFtile`) -- mission
 * `activity-divergence-drive-3` T2a. Parses real source (through the
 * SAME `activityPlugin`/`parseActivity` seam `parser.test.ts` uses),
 * never hand-built AST: GROUPNOTE's own leading-note extraction
 * (`group-dispatch.ts#extractLeadingGroupNote`) happens at PARSE time,
 * so the AST itself already carries it on `ActivityGroup.note`;
 * NOTE-MULTI's own merge (`tile-layout-structural.ts#tileNote`/
 * `mergeIntoWithNotes`) happens at TILE-BUILDING time instead -- the AST
 * keeps both notes as ordinary flow siblings. Both are exercised
 * end-to-end via `layoutActivity`.
 */

import { describe, expect, it } from 'vitest';
import { activityPlugin } from '../../../../src/diagrams/activity/index.js';
import { parseAst } from '../../../helpers/parse-ast.js';
import type { UmlSource } from '../../../../src/core/block-extractor.js';
import { layoutActivity } from '../../../../src/diagrams/activity/layout/tile-layout.js';
import { FormulaMeasurer } from '../../../../src/core/measurer.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';

const measurer = new FormulaMeasurer();
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

function parse(lines: readonly string[]) {
  const block: UmlSource = { lines, type: 'activity' };
  return parseAst(activityPlugin, block);
}

describe('NOTE-MULTI — two notes on one action merge into ONE note-count pair of nodes, never a floating third', () => {
  const ast = parse([':run;', 'note right', 'right text', 'end note', 'note left', 'left text', 'end note']);

  it('the AST itself keeps both notes as ordinary flow siblings -- the merge is a TILE-building concern (tileNote), not a parse-time one', () => {
    expect(ast.nodes.filter((n) => n.kind === 'action')).toHaveLength(1);
    expect(ast.nodes.filter((n) => n.kind === 'note')).toHaveLength(2);
  });

  it('layoutActivity renders exactly TWO note nodes (one per side), not a floating third', () => {
    const geo = layoutActivity(ast, theme, measurer);
    const notes = geo.nodes.filter((n) => n.kind === 'note');
    expect(notes).toHaveLength(2);
    expect(notes.map((n) => n.label).sort()).toEqual(['left text', 'right text']);
  });

  it('neither note carries a spike (FtileWithNotes always withLink=false)', () => {
    const geo = layoutActivity(ast, theme, measurer);
    const notes = geo.nodes.filter((n) => n.kind === 'note');
    for (const n of notes) expect(n.spikeTip).toBeUndefined();
  });
});

describe("GROUPNOTE — a note as the partition/group's first line wraps the body, not a floating sibling", () => {
  const ast = parse(['partition P1 {', 'note left', 'group note text', 'end note', ':act2;', ':act3;', '}']);

  it('layoutActivity renders exactly one note node', () => {
    const geo = layoutActivity(ast, theme, measurer);
    const notes = geo.nodes.filter((n) => n.kind === 'note');
    expect(notes).toHaveLength(1);
    expect(notes[0]!.label).toBe('group note text');
  });

  it('every action node still renders (the note did not swallow the body)', () => {
    const geo = layoutActivity(ast, theme, measurer);
    const actions = geo.nodes.filter((n) => n.kind === 'action');
    expect(actions.map((n) => n.label).sort()).toEqual(['act2', 'act3']);
  });
});

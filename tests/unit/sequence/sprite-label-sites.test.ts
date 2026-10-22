/**
 * sdd2 T6f: the diagram's sprite registry reaches the delay, box, englober
 * and `ref` label sites. Each site's label is built by the same creole seam
 * as a message label (`AbstractTextualComponent.java:80-92` `create0`,
 * `StripeSimple.java:228-235` `addSprite`), so with the registry a `<$chk>`
 * is ONE image run of `24 * font / 13` (`CommandCreoleSprite.java:82`) and
 * without it the literal markup is measured.
 */
import { describe, expect, it } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import type { FrameEvent, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { createEngloberLayout } from '../../../src/diagrams/sequence/sequence-dolls.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { refBodyLines, refComponentWidth, referencePaints } from '../../../src/diagrams/sequence/ref-body-geo.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

const measurer = new DeterministicMeasurer();
const theme = { ...defaultTheme, measurer };

const SPRITE_DEF = [
  'sprite $chk [24x24/16] {',
  ...Array.from({ length: 24 }, (_, y) =>
    Array.from({ length: 24 }, (_, x) => ((Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0 ? 'F' : '0')).join(''),
  ),
  '}',
];

function astOf(body: readonly string[]): SequenceDiagramAST {
  const ast = parseSequence(sequenceSource([...SPRITE_DEF, ...body]));
  if (!('participants' in ast)) throw new Error('refused');
  return ast;
}

function withoutSprites(ast: SequenceDiagramAST): SequenceDiagramAST {
  const { sprites: _sprites, ...rest } = ast;
  return rest;
}

const isImage = (r: { image?: unknown }): boolean => r.image !== undefined;

describe('sprite registry at the delay, box, englober and ref sites', () => {
  it('delay: the label is one image run, not literal markup', () => {
    const ast = astOf(['participant A', 'participant B', 'A -> B', '...<$chk>...', 'B -> A']);
    const delay = layoutSequence(ast, theme, measurer).events.find((e) => e.kind === 'delay');
    if (delay?.kind !== 'delay') throw new Error('no delay');
    expect(delay.labelRuns.filter(isImage)).toHaveLength(1);
    expect(delay.labelRuns.map((r) => r.text).join('')).not.toContain('$chk');
  });

  it('box: the title runs carry the image', () => {
    const ast = astOf(['box "<$chk> T"', 'participant A', 'end box', 'participant B', 'A -> B']);
    const box = layoutSequence(ast, theme, measurer).boxes?.[0];
    expect(box?.labelRuns.filter(isImage)).toHaveLength(1);
  });

  it('englober dimension: the registry reaches the doll title (its height is the sprite box)', () => {
    const ast = astOf(['box "<$chk>"', 'participant A', 'end box', 'participant B']);
    const widths = [60, 60];
    const heightOf = (sprites?: SequenceDiagramAST['sprites']): number =>
      createEngloberLayout(ast.participants, ast.boxes, widths, measurer, sprites).heightEnglober1;
    // Sprite title: 24 * 13 / 13 = 24 tall block, plus padding and the extra
    // height; literal markup is one text line.
    expect(heightOf(ast.sprites)).not.toBe(heightOf());
    expect(heightOf(ast.sprites)).toBeGreaterThan(heightOf());
  });

  it('ref: the participant constraint measures the sprite body', () => {
    const labelText = '<$chk><$chk><$chk><$chk><$chk><$chk><$chk><$chk>';
    const ast = astOf(['participant A', 'participant B', `ref over A, B : ${labelText}`, 'A -> B']);
    const ref = ast.events.find((e): e is FrameEvent => e.kind === 'frame' && e.frameType === 'ref');
    if (ref === undefined) throw new Error('no ref');
    const lines = refBodyLines(ref.frameType, ref.label);
    const paints = referencePaints(ref);
    const widthWith = refComponentWidth(lines, paints, measurer, ast.sprites);
    const widthWithout = refComponentWidth(lines, paints, measurer);
    expect(widthWith).toBeGreaterThan(widthWithout);
    const gap = (a: SequenceDiagramAST): number => {
      const geo = layoutSequence(a, theme, measurer);
      return geo.participants[1]!.centerX - geo.participants[0]!.centerX;
    };
    expect(gap(ast)).toBeGreaterThan(gap(withoutSprites(ast)));
  });
});

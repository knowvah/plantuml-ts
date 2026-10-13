/**
 * `CommandWBSItemNew` (wbs/CommandWBSItemNew.java): single-line items, both modes. Group binding
 * is checked through the arguments the command hands `WBSDiagram.addIdea`
 * (a spy on the real diagram), so what is pinned is what the Java's
 * `RegexResult.getLazzy("BACKCOLOR"|"CODE"|"SHAPE", 0)` +
 * `Direction.getWBSDirection` would pass.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Direction } from '../../../src/core/abel/Direction.js';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import { preprocess } from '../../../src/core/preprocessor.js';
import { Pragma } from '../../../src/core/skin/Pragma.js';
import { createSpriteRegistry } from '../../../src/core/sprite-registry.js';
import { createMindmapSkinParam } from '../../../src/core/style/mindmap-style-builder.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { IdeaShape } from '../../../src/diagrams/mindmap/IdeaShape.js';
import { WBS_ITEM_NEW_RE_0, WBS_ITEM_NEW_RE_1, applyWbsItemNew } from '../../../src/diagrams/wbs/CommandWBSItemNew.js';
import { SkinParam } from '../../../src/diagrams/wbs/wbs-skin-param.js';
import { WBSDiagram } from '../../../src/diagrams/wbs/WBSDiagram.js';

afterEach(() => {
  vi.restoreAllMocks();
});

const RED = HColorSet.instance().getColor('#red');

function diagram(): WBSDiagram {
  const skinParam = new SkinParam({
    style: createMindmapSkinParam(preprocess('@startwbs\n@endwbs')),
    skinparam: new Map(),
    sprites: createSpriteRegistry(),
    pragma: Pragma.createEmpty(),
  });
  return new WBSDiagram({ lines: [] }, new PreprocessingArtifact(), skinParam);
}

/** Parse `line` with the mode's regex and apply it; `undefined` result = no match. */
function run(d: WBSDiagram, line: string, mode: 0 | 1) {
  const re = mode === 0 ? WBS_ITEM_NEW_RE_0 : WBS_ITEM_NEW_RE_1;
  const m = re.exec(line);
  return m === null ? undefined : applyWbsItemNew(d, m, mode);
}

/** A diagram with the root `+ Root` already in place, and the addIdea spy. */
function rooted() {
  const d = diagram();
  expect(run(d, '+ Root', 0)?.isOk()).toBe(true);
  return { d, spy: vi.spyOn(d, 'addIdea') };
}

describe('CommandWBSItemNew mode 0 (java :7-26)', () => {
  it.each([
    [
      '++_<[#red](c1) Label',
      'c1',
      RED,
      IdeaShape.NONE,
      Direction.LEFT,
      'Label',
      'SHAPE_1 `_` then DIR_1 `<`, then BACKCOLOR_1 and CODE_1',
    ],
    [
      '++>(c1)[#red] Label',
      'c1',
      RED,
      IdeaShape.BOX,
      Direction.RIGHT,
      'Label',
      'DIR_1 `>` (the empty `_` alternative), then CODE_2 then BACKCOLOR_2',
    ],
    ['++_ Label', undefined, undefined, IdeaShape.NONE, Direction.RIGHT, 'Label', 'SHAPE_1 only'],
    [
      '-->(c9) Label',
      'c9',
      undefined,
      IdeaShape.BOX,
      Direction.RIGHT,
      'Label',
      'DIR_1 `>` overrides the `-` default LEFT',
    ],
    ['--_ Label', undefined, undefined, IdeaShape.NONE, Direction.LEFT, 'Label', '`-` in TYPE defaults to LEFT'],
  ])(
    'binds %s -> code %s, colour %s, shape %s, direction %s, label %s (%s)',
    (line, code, backColor, shape, dir, label, _why) => {
      const { d, spy } = rooted();
      const level = line.trimStart().length - line.trimStart().replace(/^[*+-]+/, '').length - 1;
      expect(run(d, line, 0)?.isOk()).toBe(true);
      expect(spy).toHaveBeenCalledWith(code, level, { backColor, label, shape }, dir);
    },
  );

  it('reads `_` alone as a PSEUDO node with an empty label (NONE shape, java :64-66)', () => {
    const { d, spy } = rooted();
    expect(run(d, '++_', 0)?.isOk()).toBe(true);
    expect(spy).toHaveBeenCalledWith(
      undefined,
      1,
      { backColor: undefined, label: '', shape: IdeaShape.PSEUDO },
      Direction.RIGHT,
    );
  });

  it('refuses a marker-only line (BOX shape) with "Missing label for WBS node."', () => {
    const { d, spy } = rooted();
    expect(run(d, '++', 0)?.getError()).toBe('Missing label for WBS node.');
    expect(spy).not.toHaveBeenCalled();
  });

  it('keeps the leading tab run in TYPE so getSmartLevel can read it', () => {
    const { d, spy } = rooted();
    const smartLevel = vi.spyOn(d, 'getSmartLevel');
    run(d, '\t++ Tabbed', 0);
    expect(WBS_ITEM_NEW_RE_0.exec('\t++ Tabbed')?.groups?.['TYPE']).toBe('\t++');
    expect(smartLevel).toHaveBeenCalledWith('\t++');
    expect(spy).toHaveBeenCalled();
  });

  it('does not read a label starting with `<` as a direction', () => {
    const m = WBS_ITEM_NEW_RE_0.exec('++ <b>bold</b>');
    expect(m?.groups?.['DIR_1']).toBeUndefined();
    expect(m?.groups?.['DIR_2']).toBeUndefined();
    expect(m?.groups?.['LABEL']).toBe('<b>bold</b>');
    const { d, spy } = rooted();
    expect(run(d, '++ <b>bold</b>', 0)?.isOk()).toBe(true);
    expect(spy).toHaveBeenCalledWith(
      undefined,
      1,
      { backColor: undefined, label: '<b>bold</b>', shape: IdeaShape.BOX },
      Direction.RIGHT,
    );
  });

  it('refuses an unknown colour with badColor()', () => {
    const { d, spy } = rooted();
    expect(run(d, '++[#notacolour] x', 0)?.getError()).toBe('No such color');
    expect(spy).not.toHaveBeenCalled();
  });

  it('rethrows a colour failure that is not NoSuchColorException', () => {
    const { d } = rooted();
    vi.spyOn(d.getSkinParam().getIHtmlColorSet(), 'getColor').mockImplementation(() => {
      throw new Error('boom');
    });
    expect(() => run(d, '++[#red] x', 0)).toThrow('boom');
  });

  it('swallows all whitespace before the label (`[%s]+([^%s].*)`, java :66)', () => {
    expect(WBS_ITEM_NEW_RE_0.exec('++  x y')?.groups?.['LABEL']).toBe('x y');
  });
});

describe('CommandWBSItemNew mode 1 (java :27-43)', () => {
  it('binds `+ "Two words" as c2` (label, code)', () => {
    const { d, spy } = rooted();
    expect(run(d, '++ "Two words" as c2', 1)?.isOk()).toBe(true);
    expect(spy).toHaveBeenCalledWith(
      'c2',
      1,
      { backColor: undefined, label: 'Two words', shape: IdeaShape.BOX },
      Direction.RIGHT,
    );
  });

  it('binds colour, shape and direction around the quoted label', () => {
    const { d, spy } = rooted();
    expect(run(d, '--_<[#red] "Q" as c3', 1)?.isOk()).toBe(true);
    expect(spy).toHaveBeenCalledWith('c3', 1, { backColor: RED, label: 'Q', shape: IdeaShape.NONE }, Direction.LEFT);
  });

  it('does not match the plain form', () => {
    expect(WBS_ITEM_NEW_RE_1.exec('++ Label')).toBeNull();
  });
});

describe('CommandWBSItemNew warnings', () => {
  it('adds no warning', () => {
    const { d } = rooted();
    run(d, '++_<[#red](c1) Label', 0);
    expect(d.getPragma().getWarnings()).toEqual([]);
  });

  it('does not match the Old order (colour before shape)', () => {
    expect(WBS_ITEM_NEW_RE_0.exec('++[#red]_ Label')).toBeNull();
  });
});

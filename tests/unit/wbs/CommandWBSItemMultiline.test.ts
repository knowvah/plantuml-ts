/**
 * `CommandWBSItemMultilineNew/Old` (wbs/CommandWBSItemMultiline{New,Old}.java).
 *
 * Jar probe (`scripts/oracle-render.sh`): `* root` / `+[#red](c):text;` /
 * `** x` renders "Syntax Error?" at line 3 — `CommandMultilines2.isValid`
 * answers `OK_PARTIAL` for a one-line block before probing END (java:98-104),
 * so a first line is never an END line.
 */
import { describe, expect, it, vi, type MockInstance } from 'vitest';
import { Direction } from '../../../src/core/abel/Direction.js';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import { Pragma } from '../../../src/core/skin/Pragma.js';
import { createSpriteRegistry } from '../../../src/core/sprite-registry.js';
import { GUILLEMET_NONE } from '../../../src/core/stereo/StereotypeDecoration.js';
import { createMindmapSkinParam } from '../../../src/core/style/mindmap-style-builder.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import {
  applyWbsItemMultilineNew,
  collectWbsMultilineBlock,
  WBS_MULTILINE_END_RE,
  WBS_MULTILINE_NEW_START_RE,
} from '../../../src/diagrams/wbs/CommandWBSItemMultilineNew.js';
import {
  applyWbsItemMultilineOld,
  WBS_MULTILINE_OLD_START_RE,
} from '../../../src/diagrams/wbs/CommandWBSItemMultilineOld.js';
import { IdeaShape } from '../../../src/diagrams/mindmap/IdeaShape.js';
import { SkinParam } from '../../../src/diagrams/wbs/wbs-skin-param.js';
import { WBSDiagram } from '../../../src/diagrams/wbs/WBSDiagram.js';

function diagram(): WBSDiagram {
  const skinParam = new SkinParam({
    style: createMindmapSkinParam({}),
    skinparam: new Map(),
    sprites: createSpriteRegistry(),
    pragma: Pragma.createEmpty(),
  });
  return new WBSDiagram({ lines: [] }, new PreprocessingArtifact(), skinParam);
}

/** A diagram with a root and a spy on the call the command makes. */
function withRoot(): { d: WBSDiagram; add: MockInstance<WBSDiagram['addIdeaDisplay']> } {
  const d = diagram();
  d.addIdeaDisplay(
    undefined,
    0,
    { backColor: undefined, label: displayOf(['root']), stereotype: undefined, shape: IdeaShape.BOX },
    Direction.RIGHT,
  );
  return { d, add: vi.spyOn(d, 'addIdeaDisplay') };
}

import { Display } from '../../../src/core/klimt/creole/Display.js';
import { StringLocated } from '../../../src/core/tim/StringLocated.js';
function displayOf(lines: readonly string[]): Display {
  return Display.createFoo(lines.map((l) => new StringLocated(l, undefined)));
}
function texts(d: Display): string[] {
  return Array.from({ length: d.size() }, (_, i) => String(d.get(i)));
}

describe('collectWbsMultilineBlock', () => {
  it('collects a 3-line block with a stereotype on the last line', () => {
    const b = collectWbsMultilineBlock(['+:l1', 'l2', 'l3;<<st>>', '+ next'], 0)!;
    expect(b.displayLines).toEqual(['l1', 'l2', 'l3']);
    expect(b.stereotypeToken).toBe('<<st>>');
    expect(b.endIndex).toBe(2);
    expect(b.startLine).toBe('+:l1');
  });

  it('removes the last character of the last line when there is no stereotype', () => {
    const b = collectWbsMultilineBlock(['+:l1', 'l2;'], 0)!;
    expect(b.displayLines).toEqual(['l1', 'l2']);
    expect(b.stereotypeToken).toBeUndefined();
  });

  it('drops one character even when blanks follow the semicolon (BlocLines.java:271-283)', () => {
    expect(collectWbsMultilineBlock(['+:l1', 'l2;  '], 0)!.displayLines).toEqual(['l1', 'l2; ']);
  });

  it('keeps the first line DATA verbatim after the colon', () => {
    expect(collectWbsMultilineBlock(['+[#red](c): lead', 'x;'], 0)!.displayLines).toEqual([' lead', 'x']);
  });

  it('does not treat a one-line block as complete (jar: Syntax Error?)', () => {
    expect(collectWbsMultilineBlock(['+[#red](c):text;', '** x'], 0)).toBeUndefined();
  });

  it('keeps collecting past an END on the first line until a later END line', () => {
    const b = collectWbsMultilineBlock(['+:text;', 'more', 'end;'], 0)!;
    expect(b.displayLines).toEqual(['text;', 'more', 'end']);
    expect(b.endIndex).toBe(2);
  });

  it('drops whole lines whose trimmed text starts with a quote (REMOVE_STARTING_QUOTE)', () => {
    const b = collectWbsMultilineBlock(['+:l1', "  ' a comment;", 'l2;'], 0)!;
    expect(b.displayLines).toEqual(['l1', 'l2']);
    expect(b.endIndex).toBe(2);
  });

  it('keeps middle lines raw and probes END on the trimmed line', () => {
    const b = collectWbsMultilineBlock(['+:l1', '  indented  ', '  l3;  '], 0)!;
    expect(b.displayLines).toEqual(['l1', '  indented  ', '  l3; ']);
  });

  it('puts END group 1 of the raw last line when a stereotype is present', () => {
    const b = collectWbsMultilineBlock(['+:l1', '  l2 ; <<s>>'], 0)!;
    expect(b.displayLines).toEqual(['l1', '  l2 ']);
  });

  it('is undefined when the block is never closed or has no colon', () => {
    expect(collectWbsMultilineBlock(['+:l1', 'l2'], 0)).toBeUndefined();
    expect(collectWbsMultilineBlock(['+ no colon'], 0)).toBeUndefined();
  });
});

describe('start patterns', () => {
  it('New reads shape/direction before colour/code', () => {
    const g = WBS_MULTILINE_NEW_START_RE.exec('+_>[#red](c):x')!.groups!;
    expect([g['TYPE'], g['SHAPE_1'], g['WBS_DIRECTION_1'], g['BACKCOLOR_1'], g['CODE_1'], g['DATA']]).toEqual([
      '+',
      '_',
      '>',
      '#red',
      'c',
      'x',
    ]);
    expect(WBS_MULTILINE_NEW_START_RE.exec('+[#red](c)_:x')).toBeNull();
  });

  it('Old reads colour/code before shape/direction', () => {
    const g = WBS_MULTILINE_OLD_START_RE.exec('+(c)[#red]_<:x')!.groups!;
    expect([g['CODE_1'], g['CODE_2'], g['BACKCOLOR_2'], g['SHAPE_1'], g['WBS_DIRECTION_1']]).toEqual([
      undefined,
      'c',
      '#red',
      '_',
      '<',
    ]);
    expect(WBS_MULTILINE_OLD_START_RE.exec('+_[#red]:x')).toBeNull();
  });

  it('END splits the stereotype token', () => {
    expect(WBS_MULTILINE_END_RE.exec('a;b;<<s>>')!.slice(1, 3)).toEqual(['a;b', '<<s>>']);
  });
});

describe('applyWbsItemMultilineNew / Old', () => {
  it('New: three lines, stereotype, colour, code, level and direction', () => {
    const { d, add } = withRoot();
    const block = collectWbsMultilineBlock(['++[#red](c):l1', 'l2', 'l3;<<st>>'], 0)!;
    expect(applyWbsItemMultilineNew(d, block).isOk()).toBe(true);
    const [code, level, content, dir] = add.mock.calls[0]!;
    expect(code).toBe('c');
    expect(level).toBe(1);
    expect(texts(content.label)).toEqual(['l1', 'l2', 'l3']);
    expect(content.stereotype?.getLabel(GUILLEMET_NONE)).toBe('st');
    expect(content.backColor).toEqual(HColorSet.instance().getColor('red'));
    expect(content.shape).toBe(IdeaShape.BOX);
    expect(dir).toBe(Direction.RIGHT);
  });

  it('New: "-" defaults to LEFT, "_" is the no-box shape', () => {
    const { d, add } = withRoot();
    const block = collectWbsMultilineBlock(['--_:a', 'b;'], 0)!;
    applyWbsItemMultilineNew(d, block);
    expect(add.mock.calls[0]![3]).toBe(Direction.LEFT);
    expect(add.mock.calls[0]![2].shape).toBe(IdeaShape.NONE);
  });

  it('New: an unknown colour is badColor and adds nothing', () => {
    const { d, add } = withRoot();
    const block = collectWbsMultilineBlock(['+[#nosuchcolourzz]:a', 'b;'], 0)!;
    expect(applyWbsItemMultilineNew(d, block).isOk()).toBe(false);
    expect(add).not.toHaveBeenCalled();
  });

  it('Old: warns about the order, then adds the idea', () => {
    const { d, add } = withRoot();
    const block = collectWbsMultilineBlock(['++(c)[#blue]>:l1', 'l2;'], 0)!;
    expect(applyWbsItemMultilineOld(d, block).isOk()).toBe(true);
    expect(d.getWarnings().map((w) => w.getMessage())).toEqual([['Please define Direction/Shape before Color/Id.']]);
    const [code, , content] = add.mock.calls[0]!;
    expect(code).toBe('c');
    expect(texts(content.label)).toEqual(['l1', 'l2']);
    expect(content.backColor).toEqual(HColorSet.instance().getColor('blue'));
  });

  it('a block whose start line no longer matches reports a syntax error', () => {
    const { d } = withRoot();
    const block = collectWbsMultilineBlock(['+(c)[#blue]>:l1', 'l2;'], 0)!;
    expect(applyWbsItemMultilineNew(d, block).getError()).toBe('Syntax Error?');
  });

  it('rethrows anything that is not a NoSuchColorException', () => {
    const { d } = withRoot();
    vi.spyOn(d, 'getSkinParam').mockImplementation(() => {
      throw new Error('boom');
    });
    const block = collectWbsMultilineBlock(['++[#red]:a', 'b;'], 0)!;
    expect(() => applyWbsItemMultilineNew(d, block)).toThrow('boom');
  });
});

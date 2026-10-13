/** `CommandWBSLink` (wbs/CommandWBSLink.java). */
import { describe, expect, it, vi } from 'vitest';
import { ColorType } from '../../../src/core/abel/ColorType.js';
import { Direction } from '../../../src/core/abel/Direction.js';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import { Display } from '../../../src/core/klimt/creole/Display.js';
import { Pragma } from '../../../src/core/skin/Pragma.js';
import { createSpriteRegistry } from '../../../src/core/sprite-registry.js';
import { GUILLEMET_NONE } from '../../../src/core/stereo/StereotypeDecoration.js';
import { createMindmapSkinParam } from '../../../src/core/style/mindmap-style-builder.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { StringLocated } from '../../../src/core/tim/StringLocated.js';
import { IdeaShape } from '../../../src/diagrams/mindmap/IdeaShape.js';
import { applyWbsLink, WBS_LINK_RE } from '../../../src/diagrams/wbs/CommandWBSLink.js';
import { SkinParam } from '../../../src/diagrams/wbs/wbs-skin-param.js';
import { WBSDiagram } from '../../../src/diagrams/wbs/WBSDiagram.js';

function diagram(): WBSDiagram {
  const skinParam = new SkinParam({
    style: createMindmapSkinParam({}),
    skinparam: new Map(),
    sprites: createSpriteRegistry(),
    pragma: Pragma.createEmpty(),
  });
  const d = new WBSDiagram({ lines: [] }, new PreprocessingArtifact(), skinParam);
  const content = (s: string) => ({
    backColor: undefined,
    label: Display.createFoo([new StringLocated(s, undefined)]),
    stereotype: undefined,
    shape: IdeaShape.BOX,
  });
  d.addIdeaDisplay(undefined, 0, content('root'), Direction.RIGHT);
  d.addIdeaDisplay('a', 1, content('A'), Direction.RIGHT);
  d.addIdeaDisplay('b', 1, content('B'), Direction.RIGHT);
  return d;
}

function run(d: WBSDiagram, line: string) {
  const m = WBS_LINK_RE.exec(line);
  if (m === null) throw new Error(`no match: ${line}`);
  return applyWbsLink(d, m);
}

describe('WBS_LINK_RE', () => {
  it('captures codes, colour, stereotype and the unused label', () => {
    const g = WBS_LINK_RE.exec('a --> b #blue <<st>> : some text')!.groups!;
    expect([g['CODE1'], g['CODE2'], g['COLOR'], g['STEREOTYPE'], g['LABEL_LINK']]).toEqual([
      'a',
      'b',
      '#blue',
      '<<st>>',
      'some text',
    ]);
  });

  it('accepts dotted and dashed arrows and tight spacing, rejects a bare word', () => {
    expect(WBS_LINK_RE.exec('a->b')).not.toBeNull();
    expect(WBS_LINK_RE.exec('a ..> b')).not.toBeNull();
    expect(WBS_LINK_RE.exec('a b')).toBeNull();
  });
});

describe('applyWbsLink', () => {
  it('a -> b links with empty colours and no stereotype', () => {
    const d = diagram();
    const spy = vi.spyOn(d, 'link');
    expect(run(d, 'a -> b').isOk()).toBe(true);
    const [c1, c2, colors, st] = spy.mock.calls[0]!;
    expect([c1, c2, colors.isEmpty(), st]).toEqual(['a', 'b', true, undefined]);
  });

  it('a ..> b #blue <<st>> passes LINE blue and stereotype st', () => {
    const d = diagram();
    const spy = vi.spyOn(d, 'link');
    expect(run(d, 'a ..> b #blue <<st>>').isOk()).toBe(true);
    const [, , colors, st] = spy.mock.calls[0]!;
    expect(colors.getColor(ColorType.LINE)).toEqual(HColorSet.instance().getColor('blue'));
    expect(st?.getLabel(GUILLEMET_NONE)).toBe('st');
  });

  it('a --> b <<st>> : text succeeds', () => {
    expect(run(diagram(), 'a --> b <<st>> : text').isOk()).toBe(true);
  });

  it('surfaces the diagram "No such node" result unchanged', () => {
    expect(run(diagram(), 'a -> zz').getError()).toBe('No such node zz');
    expect(run(diagram(), 'qq -> b').getError()).toBe('No such node qq');
  });

  it('an unknown colour is badColor', () => {
    const r = run(diagram(), 'a -> b #nosuchcolourzz');
    expect(r.isOk()).toBe(false);
  });

  it('rethrows anything that is not a NoSuchColorException', () => {
    const d = diagram();
    vi.spyOn(d, 'link').mockImplementation(() => {
      throw new Error('boom');
    });
    expect(() => run(d, 'a -> b')).toThrow('boom');
  });
});

/**
 * `Idea.getStyle()` / `getStyleArrow()` (Idea.java:65-113) against the
 * 1.2026.8beta1 jar.
 *
 * Node styles: `DumpProbe ideas <puml>` (plans/mindmap-engine-port/tools/
 * probe/) prints every idea's `Idea.getStyle()` with priorities; its output
 * for the two sources below is `tests/unit/core/style/fixtures/
 * mindmap-idea-styles.json` (`depth` = cejije-94-xibi793, `stereo` = the
 * authored `STEREO` source — re-run against the jar and byte-equal to the
 * fixture). Here the ideas come from the real parse and the real builder,
 * so the signature choice (root/leaf/boxless, stereotype, level), the
 * `STEP_BY_PARENT * 1000` int overflow and the child-level parent walk are
 * all exercised by the port's own `Idea`.
 *
 * Arrow style: `StyleProbe <snippet> merged root,element,mindmapDiagram,arrow
 * --level 1` on `* r` / `** a`.
 */
import { describe, expect, it } from 'vitest';
import { Rankdir } from '../../../src/core/klimt/geom/Rankdir.js';
import type { Idea } from '../../../src/diagrams/mindmap/Idea.js';
import { STEP_BY_PARENT } from '../../../src/diagrams/mindmap/Idea.js';
import type { MindMapDiagram } from '../../../src/diagrams/mindmap/MindMapDiagram.js';
import { dumpStyle, ideaScenarioDump } from '../core/style/helpers/style-fixture.js';
import { parseMindMap } from './helpers/mindmap-skin.js';

const DEPTH = `@startmindmap
<style>
:depth(2) * {
  FontColor red
  BackGroundColor blue
}
</style>
* r0
** a
*** a1
**** a11
@endmindmap`;

const STEREO = `@startmindmap
<style>
mindmapDiagram {
  node { BackGroundColor lightGreen }
  :depth(1) { LineColor green
    Padding 4 8 }
  .foo { BackGroundColor red
    LineStyle 5-3
    MaximumWidth 60 }
  .foo * { FontColor #00ff00 }
  leafNode { RoundCorner 3 }
  rootNode { FontStyle bold
    FontWeight 300 }
}
</style>
* r <<foo>>
** a
*** a1
** b <<foo>>
*** b1
@endmindmap`;

interface IdeaRow {
  readonly branch: 'regular' | 'reverse';
  readonly idea: Idea;
}

function depthFirst(branch: IdeaRow['branch'], idea: Idea | undefined): IdeaRow[] {
  if (idea === undefined) return [];
  return [{ branch, idea }, ...idea.getChildren().flatMap((c) => depthFirst(branch, c))];
}

/** DumpProbe's order: the regular branch depth-first, then the reverse one. */
function ideasOf(diagram: MindMapDiagram): IdeaRow[] {
  const mindmap = diagram.getMindmaps()[0]!;
  return [
    ...depthFirst('regular', mindmap.getRegular().getRoot()),
    ...depthFirst('reverse', mindmap.getReverse().getRoot()),
  ];
}

describe('Idea.getStyle equals the jar (DumpProbe ideas)', () => {
  it.each([
    ['depth', DEPTH],
    ['stereo', STEREO],
  ] as const)('%s: every idea, values and priorities', (name, source) => {
    const expected = ideaScenarioDump(name).ideas;
    const got = ideasOf(parseMindMap(source, Rankdir.LEFT_TO_RIGHT)).map(({ branch, idea }) => ({
      branch,
      label: idea.getLabel().asList().join('\n'),
      level: idea.getLevel(),
      style: dumpStyle(idea.getStyle()),
    }));
    expect(got).toEqual(expected);
  });

  it('starts the walk at STEP_BY_PARENT * 1000 as a Java int: 1411065408 (Idea.java:97, WElement.java:110)', () => {
    expect(STEP_BY_PARENT).toBe(10001000);
    // a1 (level 2) reads `:depth(2) *` FontColor, stored at 326, lifted by the own-node delta.
    const a1 = ideasOf(parseMindMap(DEPTH, Rankdir.LEFT_TO_RIGHT))[2]!.idea;
    expect(a1.getStyle().value('FontColor').getPriority()).toBe(326 + 1411065408);
  });

  it('queries ancestors at the CHILD level (Idea.java:100): a level-1 rule on the parent does not reach a1', () => {
    const rows = ideasOf(parseMindMap(STEREO, Rankdir.LEFT_TO_RIGHT));
    expect(rows[1]!.idea.getStyle().value('LineColor').asString()).toBe('green');
    expect(rows[2]!.idea.getStyle().value('LineColor').asString()).toBe('#181818');
  });
});

describe('Idea.getDefaultStyleDefinitionNode — boxless signatures (Idea.java:66-84)', () => {
  const BOXLESS = `@startmindmap
<style>
mindmapDiagram {
    boxless {
        FontColor darkgreen
        FontSize 30
    }
}
</style>
*_ root
** a1
***_ a2
**_ b1
@endmindmap`;

  it('muleji-62-gevo561: the boxless root/leaf/inner ideas pick up the rule, the boxed a1 does not (DumpProbe ideas)', () => {
    const rows = ideasOf(parseMindMap(BOXLESS, Rankdir.LEFT_TO_RIGHT));
    const summary = rows.map(({ branch, idea }) => {
      const style = dumpStyle(idea.getStyle());
      return [
        branch,
        idea.getLabel().asList().join(''),
        style.values.FontSize?.[0],
        style.values.FontColor,
        style.snames,
      ];
    });
    const boxless = ['boxless', 'element', 'mindmapDiagram', 'node', 'root'];
    expect(summary).toEqual([
      ['regular', 'root', '30', ['darkgreen', null, 326], boxless],
      ['regular', 'a1', '14', ['black', 'white', 4], ['element', 'mindmapDiagram', 'node', 'root']],
      ['regular', 'a2', '30', ['darkgreen', null, 326], boxless],
      ['regular', 'b1', '30', ['darkgreen', null, 326], boxless],
      ['reverse', 'root', '30', ['darkgreen', null, 326], boxless],
    ]);
  });
});

describe('Idea.getStyleArrow (Idea.java:108-113)', () => {
  it('plantuml.skin arrow at level 1: LineColor #181818, LineThickness 1.0 (StyleProbe merged)', () => {
    const a = ideasOf(parseMindMap('@startmindmap\n* r\n** a\n@endmindmap', Rankdir.LEFT_TO_RIGHT))[1]!.idea;
    const arrow = a.getStyleArrow();
    expect(arrow.value('LineColor').asString()).toBe('#181818');
    expect(arrow.value('LineThickness').asString()).toBe('1.0');
    expect(arrow.value('BackGroundColor').asString()).toBe('black');
    expect(arrow.value('FontSize').asString()).toBe('13');
  });
});

/**
 * `<style>` blocks and `skinparam` lines apply by SOURCE POSITION: each
 * `Idea` captures `skinParam.getCurrentStyleBuilder()` when it is added
 * (MindMap.java:124-125,139), and every `skinparam`/`<style>` command
 * replaces that builder where it is dispatched (`SkinParam#muteStyle`,
 * SkinParam.java:164-167), so an idea added before a block keeps the
 * earlier style.
 *
 * Expected values: `DumpProbe ideas <puml>` (plans/mindmap-engine-port/
 * tools/probe/) against the 1.2026.8beta1 jar — `[value1, value2,
 * priority]` of each idea's `Idea.getStyle()` property.
 */
import { describe, expect, it } from 'vitest';
import { preprocess } from '../../../src/core/preprocessor.js';
import type { PName } from '../../../src/core/style/PName.js';
import type { Idea } from '../../../src/diagrams/mindmap/Idea.js';
import type { MindMapDiagram } from '../../../src/diagrams/mindmap/MindMapDiagram.js';
import { createMindMapDiagram } from '../../../src/diagrams/mindmap/MindMapDiagramFactory.js';
import { dumpStyle } from '../core/style/helpers/style-fixture.js';

/** `test-results/dot-cache/mindmap/somife-42-levu771/in.puml`. */
const SOMIFE = `@startmindmap

<style>
mindmapDiagram {
  node {
    BackgroundColor white
  }
}
</style>
* Hi
<style>
mindmapDiagram {
  node {
    BackgroundColor yellow
  }
}
</style>
** some
** short
** ideas

@endmindmap`;

/** `test-results/dot-cache/mindmap/petoda-11-duza898/in.puml`. */
const PETODA = `@startmindmap

<style>
mindmapDiagram {
  node {
    Padding 5
    Margin 15
    BackGroundColor white
  }
  rootNode {
    Padding 15
    FontStyle Italic
    BackGroundColor green
  }
  leafNode {
    Padding 1
    BackGroundColor yellow
    FontColor blue
    FontSize 15
  }
}
</style>
* World
** America
*** Canada
*** Mexico
*** USA
<style>
  node {
    BackGroundColor lightBlue
  }
</style>
** Europe
*** England
*** Germany
*** Spain
@endmindmap`;

/** Authored: a skinparam after a `<style>` block, both after the root, and a trailing block. */
const SKINPARAM_AFTER_ROOT = `@startmindmap
* r
<style>
node { BackGroundColor pink }
</style>
skinparam nodeFontColor red
** a
<style>
node { BackGroundColor cyan }
</style>
@endmindmap`;

/** The render pipeline's `UmlSource` (`index.ts#umlSourceOfBlock`): lines with their document positions. */
function parsePositioned(source: string): MindMapDiagram {
  const pre = preprocess(source);
  const result = createMindMapDiagram({
    lines: [...pre.lines],
    type: 'mindmap',
    linePositions: pre.linePositions,
    rawStyles: pre.styles,
    stylePositions: pre.stylePositions,
    styleSource: pre,
  });
  if ('refused' in result) throw new Error(`expected a parse, got a refusal: ${result.message}`);
  return result;
}

function depthFirst(idea: Idea | undefined): Idea[] {
  if (idea === undefined) return [];
  return [idea, ...idea.getChildren().flatMap(depthFirst)];
}

/** DumpProbe's order: the regular branch depth-first, then the reverse one; one property per idea. */
function column(diagram: MindMapDiagram, name: PName): [string, unknown][] {
  const mindmap = diagram.getMindmaps()[0]!;
  const ideas = [...depthFirst(mindmap.getRegular().getRoot()), ...depthFirst(mindmap.getReverse().getRoot())];
  return ideas.map((idea) => [idea.getLabel().asList().join('\n'), dumpStyle(idea.getStyle()).values[name]]);
}

describe('style blocks apply by source position (MindMap.java:124-125, SkinParam.java:164-167)', () => {
  it('somife-42-levu771: the root keeps the FIRST block, the children take the second (DumpProbe ideas)', () => {
    expect(column(parsePositioned(SOMIFE), 'BackGroundColor')).toEqual([
      ['Hi', ['white', null, 326]],
      ['some', ['yellow', null, 327]],
      ['short', ['yellow', null, 327]],
      ['ideas', ['yellow', null, 327]],
      ['Hi', ['white', null, 326]],
    ]);
  });

  it('petoda-11-duza898: America and its leaves precede the lightBlue block, Europe and its leaves follow it (DumpProbe ideas)', () => {
    const green = ['green', null, 331];
    const yellow = ['yellow', null, 333];
    const lightBlue = ['lightBlue', null, 336];
    expect(column(parsePositioned(PETODA), 'BackGroundColor')).toEqual([
      ['World', green],
      ['America', ['white', null, 328]],
      ['Canada', yellow],
      ['Mexico', yellow],
      ['USA', yellow],
      ['Europe', lightBlue],
      ['England', lightBlue],
      ['Germany', lightBlue],
      ['Spain', lightBlue],
      ['World', green],
    ]);
  });

  it('a skinparam between a block and the next idea applies from that idea on; a trailing block reaches no idea (DumpProbe ideas)', () => {
    const diagram = parsePositioned(SKINPARAM_AFTER_ROOT);
    expect(column(diagram, 'BackGroundColor')).toEqual([
      ['r', ['#f1f1f1', '#313139', 12]],
      ['a', ['pink', null, 326]],
      ['r', ['#f1f1f1', '#313139', 12]],
    ]);
    expect(column(diagram, 'FontColor')).toEqual([
      ['r', ['black', 'white', 4]],
      ['a', ['red', null, 327]],
      ['r', ['black', 'white', 4]],
    ]);
  });
});

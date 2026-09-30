/**
 * Tree-shape tests for the mindmap parse layer (mission mindmap-engine-port,
 * task T1d): `*`/`+`/`-`/orgmode source turns into the right `Idea` tree,
 * on the right `Branch` (`regular` vs `reverse`), at the right `MindMap` (a
 * second level-0 root starts a fresh one — `MindMap.isFull`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/MindMap.java:117-152
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/Branch.java:70-88
 */
import { describe, expect, it } from 'vitest';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { Idea } from '../../../src/diagrams/mindmap/Idea.js';
import { createMindMapDiagram } from '../../../src/diagrams/mindmap/MindMapDiagramFactory.js';
import type { MindMapDiagram } from '../../../src/diagrams/mindmap/MindMapDiagram.js';

function makeSource(lines: string[]): UmlSource {
  return { lines, type: 'mindmap' };
}

/** Narrows the `MindMapDiagram | ParseRefusal` result for tests that
 *  expect a successful parse. */
function parseOk(lines: string[]): MindMapDiagram {
  const result = createMindMapDiagram(makeSource(lines));
  if ('refused' in result) throw new Error(`expected a parse, got a refusal: ${result.message}`);
  return result;
}

interface TreeNode {
  readonly text: string;
  readonly level: number;
  readonly children: readonly TreeNode[];
}

function toTree(idea: Idea): TreeNode {
  return {
    text: idea
      .getLabel()
      .asList()
      .map((e) => (typeof e === 'string' ? e : String(e)))
      .join('\n'),
    level: idea.getLevel(),
    children: idea.getChildren().map(toTree),
  };
}

describe('createMindMapDiagram — tree shape', () => {
  it('a single `* root` line is the sole level-0 idea, no children', () => {
    const diagram = parseOk(['* root']);
    const mindmaps = diagram.getMindmaps();
    expect(mindmaps.length).toBe(1);
    const root = mindmaps[0]!.getRegular().getRoot()!;
    expect(toTree(root)).toEqual({ text: 'root', level: 0, children: [] });
  });

  it('orgmode `*`/`**`/`***` builds a nested tree on the regular branch (jar-verified: T0c LayoutProbe against mindmap/rinamu-56-tabi421/in.puml)', () => {
    // Fixture: test-results/dot-cache/mindmap/rinamu-56-tabi421/in.puml.
    // `plans/mindmap-engine-port/tools/probe/run-probe.sh LayoutProbe
    // .../rinamu-56-tabi421/in.puml` prints, depth-first on the regular
    // branch: Debian(0) -> Ubuntu(1) -> [Linux Mint\nOpen Source(2),
    // Kubuntu(2), Lubuntu(2), KDE Neon(2)] — this also exercises
    // `CommandMindMapOrgmodeMultiline` (`***:Linux Mint` / `Open Source;`).
    const diagram = parseOk([
      '* <&flag>Debian',
      '** <&globe>Ubuntu',
      '***:Linux Mint',
      'Open Source;',
      '*** Kubuntu',
      '*** Lubuntu',
      '*** KDE Neon',
    ]);
    const root = diagram.getMindmaps()[0]!.getRegular().getRoot()!;
    expect(toTree(root)).toEqual({
      text: '<&flag>Debian',
      level: 0,
      children: [
        {
          text: '<&globe>Ubuntu',
          level: 1,
          children: [
            { text: 'Linux Mint\nOpen Source', level: 2, children: [] },
            { text: 'Kubuntu', level: 2, children: [] },
            { text: 'Lubuntu', level: 2, children: [] },
            { text: 'KDE Neon', level: 2, children: [] },
          ],
        },
      ],
    });
  });

  it('`+`/`++`/`+++`/`++++` level-jumping builds the regular-branch tree jar-verified against mindmap/minimal-mindmap-4', () => {
    // Fixture: test-results/dot-cache/mindmap/minimal-mindmap-4/in.puml
    // (`+`, `++`, `++`, `+++`, `+++`, `++++`, `++++`, `+++`). T0c
    // LayoutProbe confirms all 9 nodes land on the `regular` branch at
    // indices 0, 0/0, 0/1, 0/1/0, 0/1/1, 0/1/1/0, 0/1/1/1, 0/1/2 (empty
    // labels throughout; only shape/depth is asserted here).
    const diagram = parseOk(['+ ', '++ ', '++ ', '+++ ', '+++ ', '++++ ', '++++ ', '+++ ']);
    const root = diagram.getMindmaps()[0]!.getRegular().getRoot()!;
    const levels = (idea: Idea): number[] => [idea.getLevel(), ...idea.getChildren().flatMap(levels)];
    expect(root.getChildren().length).toBe(2);
    expect(root.getChildren()[1]!.getChildren().length).toBe(3);
    expect(root.getChildren()[1]!.getChildren()[1]!.getChildren().length).toBe(2);
    expect(levels(root)).toEqual([0, 1, 1, 2, 2, 3, 3, 2]);
  });

  it('`-`/`--` places CHILDREN on the reverse branch, not regular (jar-verified: mindmap/majagu-52-lumi685)', () => {
    // Fixture: test-results/dot-cache/mindmap/majagu-52-lumi685/in.puml
    // (`-  `, `-- Not empty`, `-- `). T0c LayoutProbe: all 3 nodes
    // branch=reverse, direction=-1. The ROOT itself is always seeded on
    // BOTH branches (`MindMap.addIdeaInternal`'s level-0 override
    // unconditionally calls `regular.initRoot` AND `reverse.initRoot`,
    // `MindMap.java:123-127`) — only non-root placement is direction-gated,
    // so this asserts on `hasChildren()`, not `hasRoot()`.
    const diagram = parseOk(['-  ', '-- Not empty', '-- ']);
    const mindmap = diagram.getMindmaps()[0]!;
    expect(mindmap.getRegular().getRoot()!.hasChildren()).toBe(false);
    const root = mindmap.getReverse().getRoot()!;
    expect(root.getChildren().map((c) => c.getLabel().toString())).toEqual(['[Not empty]', '[]']);
  });

  it('a second level-0 idea starts a new MindMap (`MindMap.isFull`)', () => {
    const diagram = parseOk(['* first root', '* second root']);
    const mindmaps = diagram.getMindmaps();
    expect(mindmaps.length).toBe(2);
    expect(mindmaps[0]!.getRegular().getRoot()!.getLabel().toString()).toBe('[first root]');
    expect(mindmaps[1]!.getRegular().getRoot()!.getLabel().toString()).toBe('[second root]');
  });

  it('`0 <label>` (CommandMindMapRoot) always creates a boxed level-0 root', () => {
    const diagram = parseOk(['0 explicit root']);
    const root = diagram.getMindmaps()[0]!.getRegular().getRoot()!;
    expect(root.getLevel()).toBe(0);
    expect(root.getShape()).toBe('BOX');
    expect(root.getLabel().toString()).toBe('[explicit root]');
  });

  it('`_` shape marker on a `+` node produces IdeaShape.NONE (boxless)', () => {
    const diagram = parseOk(['+ root', '++_ boxless child']);
    const root = diagram.getMindmaps()[0]!.getRegular().getRoot()!;
    expect(root.getChildren()[0]!.getShape()).toBe('NONE');
  });
});

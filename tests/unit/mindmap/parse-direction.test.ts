/**
 * `CommandMindMapDirection` (`left side` / `top side` / ...) and the
 * `CommandRankDir` directive (`left to right direction` / `top to bottom
 * direction`) for the mindmap parse layer (mission mindmap-engine-port,
 * task T1d).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/CommandMindMapDirection.java:49-83
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandRankDir.java:56-79
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/MindMapDiagram.java:66-68,76
 */
import { describe, expect, it } from 'vitest';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { createMindMapDiagram } from '../../../src/diagrams/mindmap/MindMapDiagramFactory.js';
import type { MindMapDiagram } from '../../../src/diagrams/mindmap/MindMapDiagram.js';

function makeSource(lines: string[]): UmlSource {
  return { lines, type: 'mindmap' };
}

function parseOk(lines: string[]): MindMapDiagram {
  const result = createMindMapDiagram(makeSource(lines));
  if ('refused' in result) throw new Error(`expected a parse, got a refusal: ${result.message}`);
  return result;
}

describe('createMindMapDiagram — direction and rankdir', () => {
  it('defaults to rankdir LR and the regular (right) branch (MindMapDiagram.java:76)', () => {
    const diagram = parseOk(['* root', '** child']);
    expect(diagram.getRankdir()).toBe('LR');
    const mindmap = diagram.getMindmaps()[0]!;
    expect(mindmap.getRegular().getRoot()!.hasChildren()).toBe(true);
    expect(mindmap.getReverse().getRoot()!.hasChildren()).toBe(false);
  });

  it('`left side` routes subsequent ideas onto the reverse branch (jar-verified: mindmap/kapoze-75-zati796)', () => {
    // Fixture: test-results/dot-cache/mindmap/kapoze-75-zati796/in.puml.
    // T0c LayoutProbe: every node reports branch=reverse, direction=-1.
    const diagram = parseOk(['left side', '', '* count with a very long name', '** 100', '*** 101']);
    const mindmap = diagram.getMindmaps()[0]!;
    expect(mindmap.getReverse().getRoot()!.hasChildren()).toBe(true);
    expect(mindmap.getRegular().getRoot()!.hasChildren()).toBe(false);
    expect(mindmap.getReverse().getRoot()!.getChildren()[0]!.getLabel().toString()).toBe('[100]');
  });

  it('`top to bottom direction` + `top side` sets rankdir TB and the reverse branch (jar-verified: mindmap/gaferi-23-mute427)', () => {
    // Fixture: test-results/dot-cache/mindmap/gaferi-23-mute427/in.puml.
    // T0c LayoutProbe: rankdir affects layout only (not asserted via the
    // probe directly), but every node still reports branch=reverse,
    // direction=-1 -- Direction.UP is neither RIGHT nor DOWN, so
    // `setDefaultDirection` computes `false` the same as `left side` does.
    const diagram = parseOk(['top to bottom direction', 'top side', '', '* count with a very long name', '** 100']);
    expect(diagram.getRankdir()).toBe('TB');
    const mindmap = diagram.getMindmaps()[0]!;
    expect(mindmap.getReverse().getRoot()!.hasChildren()).toBe(true);
    expect(mindmap.getRegular().getRoot()!.hasChildren()).toBe(false);
  });

  it('`left to right direction` sets rankdir LR explicitly (redundant with the default, still observable)', () => {
    const diagram = parseOk(['left to right direction', '* root']);
    expect(diagram.getRankdir()).toBe('LR');
  });
});

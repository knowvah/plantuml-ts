/**
 * `MindMapDiagram.getSmartLevel`'s uncaught-throw path (mission
 * mindmap-engine-port, decision D6).
 *
 * Upstream's throw (`UnsupportedOperationException`, java:156) escapes
 * `CommandMindMapOrgmode#executeArg` uncaught, all the way to
 * `PSystemBuilder#createPSystem`'s outermost `catch (Throwable t)`
 * (`PSystemBuilder.java:274-279`) — the exact spot `core/parse-refusal.ts`'s
 * file header reserves for a real `throw`, not a `ParseRefusal`. So
 * `createMindMapDiagram` is expected to throw here too, uncaught.
 *
 * Fixture authored (no corpus fixture reaches this branch — the corpus's
 * indentation-based org-mode fixtures only ever exercise the first
 * `!type.contains(' ')` branch, `MindMapDiagram.java:144-145`) and
 * confirmed against the real jar (T0c `LayoutProbe`,
 * `plans/mindmap-engine-port/tools/probe/run-probe.sh LayoutProbe
 * <fixture>`): `#* root` sets `first="#*"`; the tab-indented `*# child`
 * then computes `type=" *#"` (tab replaced with a space), which does not
 * end with, start with, or equal-length-trim to `first` — printing
 * `Error java.lang.UnsupportedOperationException: type=< *#>[#*]` at
 * `MindMapDiagram.getSmartLevel(MindMapDiagram.java:156)`, called from
 * `CommandMindMapOrgmode.executeArg(CommandMindMapOrgmode.java:109)`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/MindMapDiagram.java:136-159
 */
import { describe, expect, it } from 'vitest';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { createMindMapDiagram } from '../../../src/diagrams/mindmap/MindMapDiagramFactory.js';

function makeSource(lines: string[]): UmlSource {
  return { lines, type: 'mindmap' };
}

describe('createMindMapDiagram — getSmartLevel throw (D6, jar-verified)', () => {
  it('throws (not a ParseRefusal) with the exact upstream message shape', () => {
    expect(() => createMindMapDiagram(makeSource(['#* root', '\t*# child']))).toThrow('type=< *#>[#*]');
  });

  it('a purely indentation-consistent org-mode source never throws (control case)', () => {
    const lines = ['* ', '\t* ', '\t\t* ', '\t\t* ', '\t* '];
    expect(() => createMindMapDiagram(makeSource(lines))).not.toThrow();
    const result = createMindMapDiagram(makeSource(lines));
    expect('refused' in result).toBe(false);
  });
});

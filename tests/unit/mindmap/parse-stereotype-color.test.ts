/**
 * `[#color]` and `<<stereotype>>` handling across the mindmap commands
 * (mission mindmap-engine-port, task T1d): `CommandMindMapPlus`'s and
 * `CommandMindMapOrgmode`'s shared `[#color]` capture, and
 * `CommandMindMapOrgmodeMultiline`'s trailing `; <<stereotype>>` terminator.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/CommandMindMapPlus.java:91-104
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/CommandMindMapOrgmodeMultiline.java:106-130
 */
import { describe, expect, it } from 'vitest';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { HColorSimple } from '../../../src/core/klimt/color/HColorSimple.js';
import { createMindMapDiagram } from '../../../src/diagrams/mindmap/MindMapDiagramFactory.js';
import type { MindMapDiagram } from '../../../src/diagrams/mindmap/MindMapDiagram.js';
import type { ParseRefusal } from '../../../src/core/parse-refusal.js';

function makeSource(lines: string[]): UmlSource {
  return { lines, type: 'mindmap' };
}

function parseOk(lines: string[]): MindMapDiagram {
  const result = createMindMapDiagram(makeSource(lines));
  if ('refused' in result) throw new Error(`expected a parse, got a refusal: ${result.message}`);
  return result;
}

function parseRefusal(lines: string[]): ParseRefusal {
  const result = createMindMapDiagram(makeSource(lines));
  if (!('refused' in result)) throw new Error('expected a refusal, got a diagram');
  return result;
}

describe('createMindMapDiagram — [#color] and <<stereotype>>', () => {
  it('`[#color]` on a `+` node resolves to a real HColor', () => {
    const diagram = parseOk(['+ root', '++[#FF0000] red child']);
    const child = diagram.getMindmaps()[0]!.getRegular().getRoot()!.getChildren()[0]!;
    // `getIHtmlColorSet().getColor(stringColor)` -> an `HColorSimple`
    // (CommandMindMapOrgmode.java:107, CommandMindMapPlus.java:99), which
    // `FtileBoxOld#paintOf` casts; a plain `{r,g,b,a}` threw at draw time.
    const backColor = child.getBackColor();
    expect(backColor).toBeInstanceOf(HColorSimple);
    expect((backColor as HColorSimple).asPaint()).toBe('#FF0000');
    expect(child.getLabel().toString()).toBe('[red child]');
  });

  it('an unresolvable `[#color]` refuses execution (CommandExecutionResult.badColor)', () => {
    const refusal = parseRefusal(['+ root', '++[#notacolor] child']);
    expect(refusal.kind).toBe('execution');
    expect(refusal.message).toBe('No such color');
  });

  it('a one-line orgmode-multiline block with a trailing stereotype attaches it to the node (jar-verified: mindmap/kijafe-43-tati619)', () => {
    // Fixture family: test-results/dot-cache/mindmap/kijafe-43-tati619/in.puml
    // (`**: c` / `(OK); <<test>>`). The stereotype token carries its `<<>>`
    // brackets end to end (`Stereotype.build` requires them,
    // `CommandMindMapOrgmodeMultiline.java:114-115,128`).
    const diagram = parseOk(['* a', '**: c', '(OK); <<test>>']);
    const child = diagram.getMindmaps()[0]!.getRegular().getRoot()!.getChildren()[0]!;
    expect(
      child
        .getLabel()
        .asList()
        .map((e) => (typeof e === 'string' ? e : String(e))),
    ).toEqual(['c', '(OK)']);
    expect(child.getStereotype1()?.toString()).toBe('<<test>>');
  });

  it('a one-line orgmode-multiline block with no stereotype leaves it undefined', () => {
    const diagram = parseOk(['* a', '**: c', 'no stereotype here;']);
    const child = diagram.getMindmaps()[0]!.getRegular().getRoot()!.getChildren()[0]!;
    expect(child.getStereotype1()).toBeUndefined();
  });

  it('an unterminated orgmode-multiline block (no `;` before end of source) is a syntax refusal', () => {
    const refusal = parseRefusal(['* a', '**: c', 'never terminated']);
    expect(refusal.kind).toBe('syntax');
  });
});

/**
 * `PSystemSaltFactory` (PSystemSaltFactory.java:49-69) over
 * `PSystemCommandFactory#createSystem`'s line loop: `addCommonCommands2`,
 * `addCommonScaleCommands`, `addTitleCommands`, then `CommandAnything`
 * (CommandAnything.java:48-76) for every other line.
 */
import { describe, expect, it } from 'vitest';
import { parseRefusalOf } from '../../../src/core/parse-refusal.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { createSaltDiagram } from '../../../src/diagrams/salt/PSystemSaltFactory.js';
import { PSystemSalt } from '../../../src/diagrams/salt/PSystemSalt.js';
import { stringBounder } from './salt-test-support.js';

function source(lines: readonly string[], skinparam = new Map<string, string>()): UmlSource {
  return { lines, type: 'unknown', styleSource: { skinparam, styles: [] } };
}

function parse(lines: readonly string[], skinparam?: Map<string, string>): PSystemSalt {
  const result = createSaltDiagram(source(lines, skinparam));
  if (!(result instanceof PSystemSalt)) throw new Error(`refused: ${JSON.stringify(result)}`);
  return result;
}

describe('PSystemSaltFactory — the command table', () => {
  it('feeds every non-command line to CommandAnything, untrimmed (CommandAnything.java:51, doTrim false)', () => {
    expect(parse(['{', '  Login | "x"', '}']).size()).toBe(3);
  });

  it('blank lines are CommandNope, never data', () => {
    expect(parse(['{', '', '   ', 'A', '}']).size()).toBe(3);
  });

  it('title/caption/legend/header/footer go to the annotations', () => {
    const d = parse(['title My title', 'legend', 'L', 'end legend', '{', 'A', '}']);
    expect(d.size()).toBe(3);
    expect(d.annotations.title).toBeDefined();
    expect(d.annotations.legend).toBeDefined();
  });

  it('`scale 2` is CommandScale, not data', () => {
    const d = parse(['scale 2', '{', 'A', '}']);
    expect(d.size()).toBe(3);
    expect(d.scale).toEqual({ kind: 'simple', factor: 2 });
  });

  it('rotate / minwidth / page / !assume transparent / set separator are consumed no-ops', () => {
    const d = parse([
      'rotate',
      'minwidth 50',
      'page 2x3',
      '!assume transparent dark',
      'set separator ::',
      'set namespaceSeparator none',
      '{',
      'A',
      '}',
    ]);
    expect(d.size()).toBe(3);
  });

  it('`set separator` with a letter is not the command (SEPARATOR_CHAR_SINGLE excludes %pLN)', () => {
    expect(parse(['set separator a', '{', 'A', '}']).size()).toBe(4);
  });

  it('a `sprite $` definition is CommandFactorySprite → PSystemSalt#addSprite → the dictionary', () => {
    const d = parse(['sprite $dot [2x2/16] {', 'FF', 'FF', '}', '{', 'A', '}']);
    expect(d.size()).toBe(3);
    expect(d.getSpriteRegistry().byName.has('dot')).toBe(true);
  });
});

describe('CommandAnything — a first line `salt` (CommandAnything.java:70)', () => {
  it('is the execution error "This is not needed anymore."', () => {
    const result = createSaltDiagram({ ...source(['salt', '{', 'A', '}']), linePositions: [1, 2, 3, 4] });
    const refusal = parseRefusalOf(result);
    expect(refusal).toBeDefined();
    expect(refusal!.message).toBe('This is not needed anymore.');
    expect(refusal!.kind).toBe('execution');
    expect(refusal!.line).toBe(1);
  });

  it('matches after Java trim: "  salt  " first is refused too', () => {
    expect(parseRefusalOf(createSaltDiagram(source(['  salt\t', '{', '}'])))).toBeDefined();
  });

  it('is data once anything else was added', () => {
    expect(parse(['{', 'salt', '}']).size()).toBe(3);
  });

  it('a title before `salt` does not count: data is still empty, so it refuses', () => {
    expect(parseRefusalOf(createSaltDiagram(source(['title T', 'salt', '{', '}'])))).toBeDefined();
  });
});

describe('CommandSkinParam warnings (CommandSkinParam.java:92-99)', () => {
  it('skinparam handwritten warns "Please use \'!option handwritten true\' …"', () => {
    const d = parse(['{', 'A', '}'], new Map([['handwritten', 'true']]));
    expect(d.getWarnings().map((w) => w.asSingleLine())).toEqual([
      "Please use '!option handwritten true' to enable handwritten ",
    ]);
  });
});

describe('a <style> block the parser rejects', () => {
  it('is the command error "Error in style definition: …"', () => {
    const result = createSaltDiagram({
      lines: ['{', 'A', '}'],
      type: 'unknown',
      styleSource: { skinparam: new Map(), styles: ['node { { }'] },
    });
    expect(parseRefusalOf(result)?.message).toMatch(/^Error in style definition: /);
  });
});

describe('the parsed diagram renders', () => {
  it('getTextBlock over the parsed data', () => {
    const d = parse(['{', 'A | B', '}']);
    expect(d.getTextBlock(stringBounder).calculateDimension(stringBounder).getWidth()).toBeGreaterThan(0);
  });
});

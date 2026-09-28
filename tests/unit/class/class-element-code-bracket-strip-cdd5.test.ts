/**
 * cdd5-T4b (descriptive-leaf-code-bracket-not-stripped): a descriptive
 * leaf's CODE goes through `StringUtils.eventuallyRemoveStartingAndEnding
 * DoubleQuote` (format `"([:`), so `component [abc-service]` is id and
 * display `abc-service` (`zasuxe-15-lugo662`'s secondary). The DISPLAY is
 * stripped exactly once too, so a quoted `"[x]"` keeps its brackets.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/classdiagram/command/CommandCreateElementFull2.java:200-201,249-250
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/StringUtils.java:63-91
 */
import { describe, it, expect } from 'vitest';
import { parseClassifierDecl } from '../../../src/diagrams/class/class-declaration-parser.js';

function idDisplay(line: string) {
  const d = parseClassifierDecl(line);
  return d === null ? null : { id: d.id, display: d.display };
}

describe('descriptive leaf CODE/DISPLAY strip', () => {
  it.each([
    ['component [abc-service]', 'abc-service', 'abc-service'],
    ['rectangle (foo)', 'foo', 'foo'],
    ['rectangle [x] as r', 'r', 'x'],
    ['database "[x]" as d', 'd', '[x]'],
    ['artifact "[q]"', '[q]', '[q]'],
    ['node n1 as "[shown]"', 'n1', '[shown]'],
  ])('`%s` -> id %s, display %s', (line, id, display) => {
    expect(idDisplay(line)).toEqual({ id, display });
  });
});

describe('descriptive leaf strip: usecase/state leaves too, never a class TYPE', () => {
  it.each([
    ['usecase (Use it)', 'Use it'],
    ['usecase (Log in as admin)', 'Log in as admin'],
    ['state [S1]', 'S1'],
    ['abstract class Foo', 'Foo'],
  ])('`%s` -> id %s', (line, id) => {
    expect(idDisplay(line)?.id).toBe(id);
  });
});

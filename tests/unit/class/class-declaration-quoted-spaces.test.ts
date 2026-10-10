/**
 * isw-T2-cls: `class "  Padded name  " as P` keeps BOTH leading and both
 * trailing spaces of the quoted display (the DISPLAY capture of
 * `NameAndCodeParser.java:47` is atomic). `extractDecorations` collapsed every
 * whitespace run to one space after stripping tags, invisible while a space was
 * 0 wide; the jar's box is 7.7 wider (tests/fixtures/isw-T2-cls/
 * class-padded-name.svg, oracle seam #4 v2).
 */
import { describe, expect, it } from 'vitest';
import { extractDecorations } from '../../../src/diagrams/class/class-declaration-extractors.js';
import { parseClass } from './parse-helper.js';
import { diffsAgainstJar } from '../../helpers/isw-t2-cls-fixture.js';

describe('quoted class display keeps its spaces', () => {
  it('does not collapse whitespace inside the quotes', () => {
    expect(extractDecorations('"  Padded name  " as P').rest).toBe('"  Padded name  " as P');
  });
  it('still collapses the gap a removed $tag leaves outside the quotes', () => {
    expect(extractDecorations('P   $tag   as "a  b"').rest).toBe('P as "a  b"');
  });
  it('parses the padded display verbatim', () => {
    const ast = parseClass({ lines: ['class "  Padded name  " as P'], type: 'class' });
    expect(ast.classifiers[0]!.display).toBe('  Padded name  ');
  });
  it('draws exactly the jar svg', () => {
    expect(diffsAgainstJar('class-padded-name')).toEqual([]);
  });
});

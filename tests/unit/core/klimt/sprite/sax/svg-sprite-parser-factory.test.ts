import { describe, expect, it } from 'vitest';
import { Pragma } from '../../../../../../src/core/skin/Pragma.js';
import { SvgNanoParser } from '../../../../../../src/core/klimt/sprite/SvgNanoParser.js';
import { SvgSaxParser } from '../../../../../../src/core/klimt/sprite/sax/SvgSaxParser.js';
import {
  SvgParserSelector,
  createSvgSpriteParser,
  getParserSelector,
} from '../../../../../../src/core/klimt/sprite/sax/svg-sprite-parser-factory.js';

const SVG = '<svg width="10" height="10"><path d="M0 0L10 10"/></svg>';

function pragmaWith(value: string | null): Pragma {
  const pragma = Pragma.createEmpty();
  pragma.define('svgparser', value);
  return pragma;
}

describe('getParserSelector (SvgSpriteParserFactory.java:109-121)', () => {
  it('is nano without a pragma (:120)', () => {
    expect(getParserSelector(undefined)).toBe(SvgParserSelector.NANO);
  });

  it('is nano when the pragma does not define svgparser (:111, :120)', () => {
    expect(getParserSelector(Pragma.createEmpty())).toBe(SvgParserSelector.NANO);
  });

  it('is sax for the value "sax" (:105)', () => {
    expect(getParserSelector(pragmaWith('sax'))).toBe(SvgParserSelector.SAX);
  });

  it('trims and lower-cases the value (:116-118)', () => {
    expect(getParserSelector(pragmaWith('  SAX \t'))).toBe(SvgParserSelector.SAX);
  });

  it('is nano for a null value (:113-114)', () => {
    expect(getParserSelector(pragmaWith(null))).toBe(SvgParserSelector.NANO);
  });

  it('is nano for a blank value (:117-118)', () => {
    expect(getParserSelector(pragmaWith('   '))).toBe(SvgParserSelector.NANO);
  });

  it('is nano for any value other than sax (:99-105)', () => {
    expect(getParserSelector(pragmaWith('batik'))).toBe(SvgParserSelector.NANO);
    expect(getParserSelector(pragmaWith('nano'))).toBe(SvgParserSelector.NANO);
  });
});

describe('createSvgSpriteParser (SvgSpriteParserFactory.java:99-105)', () => {
  it('returns SvgSaxParser for the sax selector (:99-101)', () => {
    expect(createSvgSpriteParser(SVG, SvgParserSelector.SAX)).toBeInstanceOf(SvgSaxParser);
  });

  it('returns SvgNanoParser for the nano selector (:104)', () => {
    expect(createSvgSpriteParser(SVG, SvgParserSelector.NANO)).toBeInstanceOf(SvgNanoParser);
  });
});

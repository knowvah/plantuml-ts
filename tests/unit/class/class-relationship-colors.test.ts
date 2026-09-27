/**
 * cdd3-T10 (S-4t): a relationship's trailing `#color[;key:color]` spec is
 * tokenized by `Colors(String, HColorSet, ColorType)` (`klimt/color/
 * Colors.java:95-124`) keyed to `ColorType.LINE` (`CommandLinkClass.java:
 * 173-174`); `SvekEdge.java:260-262` mutes the label font with the TEXT
 * entry (`FontConfiguration#mute`, `klimt/font/FontConfiguration.java:195-
 * 201`), and `SvekEdge.java:884-885` reads `getColor(ARROW, LINE)`.
 */
import { describe, it, expect } from 'vitest';
import { parseRelColors } from '../../../src/diagrams/class/class-relationship-colors.js';
import { parseRelationshipLine } from '../../../src/diagrams/class/class-relationship-parser.js';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

describe('parseRelColors (Colors.java:95-124, mainType LINE)', () => {
  it('returns nothing for an absent spec', () => {
    expect(parseRelColors(undefined)).toEqual({});
  });

  it('keys a bare token to LINE and text:COLOR to TEXT (xoxuni #red;text:blue)', () => {
    expect(parseRelColors('#red;text:blue')).toEqual({ line: '#red', text: '#blue' });
  });

  it('skips a bare token containing a dot (line.dashed style, Colors.java:101)', () => {
    expect(parseRelColors('#line.dashed;text:777')).toEqual({ text: '#777' });
  });

  it('lets an explicit arrow: key win over LINE (SvekEdge.java:885 getColor(ARROW, LINE))', () => {
    expect(parseRelColors('#red;arrow:green')).toEqual({ line: '#green' });
    expect(parseRelColors('line:yellow')).toEqual({ line: '#yellow' });
  });

  it('keys by the name before a dot (ColorType.getType, ColorType.java:41-47)', () => {
    expect(parseRelColors('#blue;line.bold:purple')).toEqual({ line: '#purple' });
  });

  it('ignores shadowing:... (Colors.java:109-110)', () => {
    expect(parseRelColors('#blue;shadowing:true')).toEqual({ line: '#blue' });
  });
});

describe('parseRelationshipLine trailing ;text:COLOR (CommandLinkClass.java:368)', () => {
  it('carries labelTextColor from nuvake `Dummy --> Foo2 #blue;text:red : Another link`', () => {
    const r = parseRelationshipLine('Dummy --> Foo2 #blue;text:red : Another link')!;
    expect(r.colorOverride).toBe('#blue');
    expect(r.labelTextColor).toBe('#red');
  });

  it('keeps the text colour even when a bracket colour owns the line', () => {
    const r = parseRelationshipLine('A -[#green]-> B #blue;text:red : x')!;
    expect(r.colorOverride).toBe('green');
    expect(r.labelTextColor).toBe('#red');
  });

  it('leaves labelTextColor absent without a text: token', () => {
    expect(parseRelationshipLine('A --> B #blue : x')!.labelTextColor).toBeUndefined();
  });
});

describe('link label drawn in the muted font colour (SvekEdge.java:260-262)', () => {
  it('fills the label text with text:COLOR (xoxuni `cl1 --> cl2 #red;text:blue : foo3`)', () => {
    const svg = renderSync('@startuml\nclass cl1\nclass cl2\ncl1 --> cl2 #red;text:blue : foo3\n@enduml', {
      measurer: new WidthTableMeasurer(),
    });
    expect(svg).toMatch(/<text[^>]*fill="#00F"[^>]*>foo3<\/text>/);
  });

  it('keeps the default label fill without a text: token', () => {
    const svg = renderSync('@startuml\nclass cl1\nclass cl2\ncl1 --> cl2 #red : foo3\n@enduml', {
      measurer: new WidthTableMeasurer(),
    });
    expect(svg).toMatch(/<text[^>]*fill="#000"[^>]*>foo3<\/text>/);
  });
});

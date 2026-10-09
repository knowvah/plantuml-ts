/**
 * cdd5-T4b (diamond-folded-into-association): `diamond X` is
 * `LeafType.STATE_CHOICE` (`abel/LeafType.java:76-77`), drawn by
 * `EntityImageBranch` (`svek/GeneralImageBuilder.java:151-152`), which wraps
 * its polygon in an entity group (`svek/image/EntityImageBranch.java:86-94`)
 * -- unlike `<> X`'s `EntityImageAssociation`, which draws it bare.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { parseClassifierDecl } from '../../../src/diagrams/class/class-declaration-parser.js';

function render(...body: string[]): string {
  return renderSync(['@startuml', ...body, '@enduml'].join('\n'), { measurer: new DeterministicMeasurer() });
}

describe('diamond leaf', () => {
  it('parses as the association-sized diamond carrying its `diamond` keyword', () => {
    expect(parseClassifierDecl('diamond d1')).toMatchObject({ kind: 'association', usymbol: 'diamond' });
  });

  it('wraps `diamond d1` in an entity group with no comment and no source line', () => {
    const svg = render('class A', 'diamond d1', 'A --> d1');
    expect(svg).toMatch(
      /<g class="entity" data-qualified-name="d1" id="ent\d{4}"><polygon points="[^"]+"[^>]*\/><\/g>/,
    );
    expect(svg).not.toContain('<!--class d1-->');
  });

  it('keeps `<> a1` unwrapped', () => {
    const svg = render('class A', '<> a1', 'A --> a1');
    expect(svg).not.toContain('data-qualified-name="a1"');
    expect(svg).toMatch(/<polygon points="[^"]+" fill="#F1F1F1"/);
  });
});

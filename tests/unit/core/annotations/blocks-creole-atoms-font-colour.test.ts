/**
 * sdd3 T2h -- a sprite atom takes the stripe's OWN active font colour.
 *
 * `StripeSimple#addSprite` builds `new AtomSprite(fontConfiguration.getColor(),
 * forcedColor, scale, sprite, null, backColor)` (`StripeSimple.java:234`) and
 * `AtomSprite#drawU` draws `sprite.asTextBlock(fontColor, forcedColor, scale,
 * backColor)` (`AtomSprite.java:77`), so the tint is the colour of the font
 * ACTIVE at that point in the line. `CommandCreoleSprite#executeAndAdvance`
 * (`CommandCreoleSprite.java:82`) likewise scales by that stripe font's
 * `getSize2D() / 13.0`.
 */
import { describe, expect, test } from 'vitest';
import { fontOfAtom } from '../../../../src/core/annotations/blocks-creole-atoms.js';
import type { CreoleAtom } from '../../../../src/core/klimt/creole/atom/Atom.js';
import type { FontConfiguration } from '../../../../src/core/klimt/shape/UText.js';
import { renderSync } from '../../../../src/index.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';

const BASE: FontConfiguration = { family: 'sans-serif', size: 13, color: '#000000', styles: new Set() };
const RED: FontConfiguration = { ...BASE, color: '#FF0000' };
const SPRITE = { kind: 'sprite', name: 's', scale: 1 } as const;

describe('fontOfAtom (StripeSimple.java:234, AtomSprite.java:77)', () => {
  test('an inline atom takes the font active where the stripe built it', () => {
    const atom: CreoleAtom = { kind: 'inline', atom: SPRITE, ambientFont: RED };
    expect(fontOfAtom(atom, BASE).color).toBe('#FF0000');
  });

  test('a plain inline atom without a carried font falls back to the base font', () => {
    const atom: CreoleAtom = { kind: 'inline', atom: SPRITE };
    expect(fontOfAtom(atom, BASE)).toBe(BASE);
  });

  test('a text atom keeps its own font', () => {
    const atom: CreoleAtom = { kind: 'text', text: 'x', font: RED };
    expect(fontOfAtom(atom, BASE)).toBe(RED);
  });
});

const PUML = (prefix: string): string =>
  `@startuml
sprite s <svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="10" /></svg>
Alice -> Bob : ${prefix}<$s>
@enduml`;

function ellipseFill(markup: string): string | undefined {
  const svg = renderSync(markup, { measurer: new DeterministicMeasurer() });
  return /<ellipse[^>]* fill="([^"]+)"/.exec(svg)?.[1];
}

describe('sequence message sprite tint', () => {
  test('<color:red><$s> tints the sprite red', () => {
    expect(ellipseFill(PUML('<color:red>'))).toBe('#F00');
  });
  test('a plain <$s> tints with the base font colour', () => {
    expect(ellipseFill(PUML(''))).toBe('#000');
  });
});

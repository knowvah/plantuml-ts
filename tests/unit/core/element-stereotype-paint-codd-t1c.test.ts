/**
 * codd-T1c -- data side of the description colour fixes: where the stereotype
 * tiers and the dedicated-key bucket writes land in `theme.colors.elements`,
 * and how `resolveElementPaint` cascades them.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/parser/Context.java:62-92,115-127
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:251-261,290-302,396-410
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:226-235
 */
import { describe, it, expect } from 'vitest';
import { preprocess } from '../../../src/core/preprocessor.js';
import { buildTheme } from '../../../src/core/build-theme.js';
import { ANY_ELEMENT_BUCKET, resolveElementPaint } from '../../../src/core/theme-element-resolve.js';
import type { Theme } from '../../../src/core/theme.js';

function themeOf(body: string): Theme {
  return buildTheme(preprocess(`@startuml\n${body}\nclass A\n@enduml`)).theme;
}

describe('<style> tag sub-selectors', () => {
  it('nested `<sname> { .tag { ... } }` fills the stereotype maps under the cleaned tag', () => {
    const theme = themeOf('<style>\ncomponent {\n  .Foo_Bar { BackgroundColor #blue; LineColor #red }\n}\n</style>');
    expect(theme.colors.elements?.component?.backgroundColorByStereo).toEqual({ foobar: '#blue' });
    expect(theme.colors.elements?.component?.borderByStereo).toEqual({ foobar: '#red' });
  });

  it('a SName-less `.tag` fills the any-element pseudo-bucket; the tag keeps its space', () => {
    const theme = themeOf('<style>\n.static lib {\n  BackgroundColor DarkKhaki\n}\n</style>');
    expect(theme.colors.elements?.[ANY_ELEMENT_BUCKET]?.backgroundColorByStereo).toEqual({
      'static lib': 'DarkKhaki',
    });
  });

  it('LineColor wins over the BorderColor alias on a tag, as on a bare bucket', () => {
    const theme = themeOf('<style>\n.t {\n  BorderColor #111111\n  LineColor #222222\n}\n</style>');
    expect(theme.colors.elements?.[ANY_ELEMENT_BUCKET]?.borderByStereo).toEqual({ t: '#222222' });
  });

  it('admits `port` to <style> routing but not to the skinparam keys', () => {
    const style = themeOf('<style>\nport {\n  BackgroundColor #red\n}\n</style>');
    expect(style.colors.elements?.port?.background).toBe('#red');
    const skin = themeOf('skinparam portBackgroundColor red');
    expect(skin.colors.elements?.port).toBeUndefined();
  });
});

describe('dedicated skinparam keys also fill the element bucket', () => {
  it('interfaceBackgroundColor keeps its legacy field AND fills elements.interface', () => {
    const theme = themeOf('skinparam interfaceBackgroundColor gold');
    expect(theme.colors.elements?.interface?.background).toBe('gold');
    expect(theme.colors.graph.interfaceBackground).toBe('gold');
  });

  it('a gradient value survives as a Paint (levuxi-16-fotu885)', () => {
    const theme = themeOf('skinparam interface {\n  BackgroundColor #FF0000-#FFFFFF\n}');
    expect(theme.colors.elements?.interface?.background).toMatchObject({ color1: '#FF0000', color2: '#FFFFFF' });
  });
});

describe('resolveElementPaint stereotype tier', () => {
  const theme = themeOf(
    'skinparam agent {\n  backgroundColor Yellow\n  backgroundColor<<st>> LightBlue\n}\n' +
      '<style>\n.sharedlib {\n  BackgroundColor Green\n  LineColor Red\n}\n</style>',
  );

  it('a matching label beats the plain bucket (+1000 priority)', () => {
    expect(resolveElementPaint(theme, 'agent', 'background', ['st'])).toBe('LightBlue');
    expect(resolveElementPaint(theme, 'agent', 'border', ['sharedlib'])).toBe('Red');
  });

  it('no label, or a non-matching label, falls back to the plain bucket', () => {
    expect(resolveElementPaint(theme, 'agent', 'background')).toBe('Yellow');
    expect(resolveElementPaint(theme, 'agent', 'background', ['other'])).toBe('Yellow');
  });

  it('labels compare cleaned: `Shared_Lib` matches `.sharedlib`, `shared lib` does not', () => {
    expect(resolveElementPaint(theme, 'component', 'background', ['Shared_Lib'])).toBe('Green');
    expect(resolveElementPaint(theme, 'component', 'background', ['shared lib'])).toBe(theme.colors.nodeBackground);
  });

  it('the SName bucket wins over the SName-less tag; the last matching label wins', () => {
    const both = themeOf('<style>\n.t { BackgroundColor #aaa }\ncomponent { .t { BackgroundColor #bbb } }\n</style>');
    expect(resolveElementPaint(both, 'component', 'background', ['t'])).toBe('#bbb');
    const two = themeOf('<style>\n.a { BackgroundColor #111 }\n.b { BackgroundColor #222 }\n</style>');
    expect(resolveElementPaint(two, 'node', 'background', ['a', 'b'])).toBe('#222');
  });

  it('font has no stereotype tier', () => {
    expect(resolveElementPaint(theme, 'agent', 'font', ['st'])).toBe(theme.colors.text);
  });
});

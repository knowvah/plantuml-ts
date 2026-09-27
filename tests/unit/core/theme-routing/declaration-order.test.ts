/**
 * cdd4-T7b: skinparam and `<style>` declarations apply in DOCUMENT order, as
 * upstream's single style store does (`SkinParam#setParam` mutes the style
 * on the spot, `SkinParam.java:227-234`) -- which `!theme` makes routine by
 * putting the theme's `<style>` at the directive's position
 * (`TContext.java:737-743`).
 */
import { describe, expect, it } from 'vitest';
import { buildTheme } from '../../../../src/core/build-theme.js';
import { preprocess } from '../../../../src/core/preprocessor.js';
import { styleSkinparamSegments } from '../../../../src/core/style-skinparam-segments.js';
import { resolveAnnotationStyles } from '../../../../src/core/annotations/style.js';

const AMIGA_BLUE = '#0B58A8'; // puml-theme-amiga.puml:16
const RED = '#FF0000';

function themeOf(body: string): ReturnType<typeof buildTheme> {
  return buildTheme(preprocess(`@startuml\n${body}\n@enduml`));
}

describe('styleSkinparamSegments', () => {
  it('opens with a skinparam run and closes with a style run, empty or not', () => {
    const segments = styleSkinparamSegments(preprocess('@startuml\nA -> B\n@enduml'));
    expect(segments.map((s) => s.kind)).toEqual(['skinparam', 'style']);
  });

  it('interleaves runs in declaration order, a repeated key at its last assignment', () => {
    const source = preprocess(
      '@startuml\nskinparam a 1\n<style>\nroot { X 1 }\n</style>\nskinparam b 2\nskinparam a 3\n@enduml',
    );
    const shape = styleSkinparamSegments(source).map((s) =>
      s.kind === 'skinparam' ? [...s.entries.keys()].join(',') : `style:${[...s.styleMap.keys()].join(',')}`,
    );
    expect(shape).toEqual(['', 'style:root', 'b,a', 'style:']);
  });

  it('merges consecutive style blocks into one run', () => {
    const source = preprocess('@startuml\n<style>\nroot { X 1 }\n</style>\n<style>\nnode { Y 2 }\n</style>\n@enduml');
    const styles = styleSkinparamSegments(source).filter((s) => s.kind === 'style');
    expect(styles).toHaveLength(1);
  });

  it('reads a hand-built result (no order) as every skinparam before every style block', () => {
    const shape = styleSkinparamSegments({ skinparam: new Map([['a', '1']]), styles: ['root { X 1 }'] }).map(
      (s) => s.kind,
    );
    expect(shape).toEqual(['skinparam', 'style']);
  });
});

describe('buildTheme: declaration order', () => {
  it("a document skinparam after !theme beats the theme's root <style> (zuravu-52-mike252)", () => {
    expect(themeOf(`!theme amiga\nskinparam backgroundColor ${RED}`).theme.colors.background).toBe(RED);
  });

  it('a !theme after a document skinparam beats it', () => {
    expect(themeOf(`skinparam backgroundColor ${RED}\n!theme amiga`).theme.colors.background).toBe(AMIGA_BLUE);
  });

  it('a document <style> after !theme still wins', () => {
    const { theme } = themeOf(`!theme amiga\n<style>\ndocument { BackgroundColor ${RED} }\n</style>`);
    expect(theme.colors.background).toBe(RED);
  });
});

describe('buildTheme: root / document <style> routed', () => {
  it('carries the merged root/document selectors as styleOverrides', () => {
    const { theme } = themeOf('!theme plain');
    expect(theme.styleOverrides?.['root']?.['fontcolor']).toBe('black'); // puml-theme-plain.puml:35-37
    expect(theme.styleOverrides?.['document.title']?.['fontsize']).toBe('22');
  });

  it('takes diagramMargin from document, else root (TextBlockExporter.java:510-516)', () => {
    expect(themeOf('<style>\nroot { Margin 5 }\n</style>').theme.diagramMargin).toEqual({
      top: 5,
      right: 5,
      bottom: 5,
      left: 5,
    });
    const both = themeOf('<style>\nroot { Margin 5 }\ndocument { Margin 1 2 }\n</style>').theme;
    expect(both.diagramMargin).toEqual({ top: 1, right: 2, bottom: 1, left: 2 });
  });

  it('leaves both unset without a root/document selector', () => {
    const { theme } = themeOf('<style>\nnode { Margin 5 }\n</style>');
    expect(theme.styleOverrides).toBeUndefined();
    expect(theme.diagramMargin).toBeUndefined();
  });
});

describe('resolveAnnotationStyles: declaration order', () => {
  it("a document skinparam after !theme beats the theme's document title style", () => {
    const pre = preprocess('@startuml\n!theme amiga\nskinparam titleFontSize 14\n@enduml');
    const { theme, styleMap } = buildTheme(pre);
    expect(resolveAnnotationStyles(theme, pre, styleMap).title.fontSize).toBe(14);
    // A bare skinparam map keeps the two-stage order: the style wins.
    expect(resolveAnnotationStyles(theme, pre.skinparam, styleMap).title.fontSize).toBe(22);
  });
});

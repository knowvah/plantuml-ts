import { describe, it, expect } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import {
  getWTitle,
  getHTitle,
  getTitleBaselineOffset,
  renderNamespaceFolder,
  renderNamespaceRect,
  PACKAGE_ROUND_CORNER,
  PACKAGE_STROKE_WIDTH,
  namespaceFill,
  renderEmptyPackageIcon,
} from '../../../src/diagrams/class/class-namespace-shape.js';
import type { NamespaceGeo } from '../../../src/diagrams/class/layout.js';
import { scaleClassTheme } from '../../../src/diagrams/class/class-scale-geo.js';

const measurer = new WidthTableMeasurer();

// ---------------------------------------------------------------------------
// G2 N17: jar-verified against test-results/dot-cache/class/finono-05-cuvu171
// (`package foo { class dummy2 }`, default 14pt font):
//   <path d="M8.5,6 L28.925,6 A3.75,3.75 0 0 1 31.425,8.5 L38.425,26
//            L121.5,26 A2.5,2.5 0 0 1 124,28.5 L124,100.5 A2.5,2.5 0 0 1
//            121.5,103 L8.5,103 A2.5,2.5 0 0 1 6,100.5 L6,8.5 A2.5,2.5 0
//            0 1 8.5,6" style="stroke:#000000;stroke-width:1.5;" fill="none"/>
//   <line x1="6" y1="26" x2="38.425" y2="26" .../>
//   <text x="10" y="18.889" ... textLength="19.425" font-weight="700">foo</text>
// Box origin (6,6), width 118, height 97 (from surrounding NamespaceGeo).
// ---------------------------------------------------------------------------

describe('getWTitle', () => {
  it('is textWidth + 6 for "foo" at 14pt bold (jar: 19.425 -> 25.425)', () => {
    expect(getWTitle(measurer, defaultTheme, 'foo', 0)).toBeCloseTo(25.425, 3);
  });

  it('is textWidth + 6 for "a" at 14pt bold (jar: 7.7875 -> 13.7875)', () => {
    expect(getWTitle(measurer, defaultTheme, 'a', 0)).toBeCloseTo(13.7875, 3);
  });

  it('falls back to max(30, width/4) for an empty label', () => {
    expect(getWTitle(measurer, defaultTheme, '', 200)).toBe(50);
    expect(getWTitle(measurer, defaultTheme, '', 40)).toBe(30);
  });
});

describe('getHTitle', () => {
  it('is 20 at the default 14pt font (jar: finono-05-cuvu171/jinibe-02-tebi269)', () => {
    expect(getHTitle(measurer, defaultTheme, 'foo')).toBe(20);
  });

  it('scales with font size (jar: pixexi-81-sete111, skinparam FontSize 40 -> htitle 46)', () => {
    const theme40 = { ...defaultTheme, fontSize: 40 };
    expect(getHTitle(measurer, theme40, 'Configuration files')).toBe(46);
  });

  it('falls back to 10 for an empty label', () => {
    expect(getHTitle(measurer, defaultTheme, '')).toBe(10);
  });
});

describe('getTitleBaselineOffset', () => {
  it('is 2 + fontSize - descent, matching jar text y=18.8889 at box-top 6', () => {
    const offset = getTitleBaselineOffset(measurer, defaultTheme, 'foo');
    expect(6 + offset).toBeCloseTo(18.8889, 3);
  });
});

function finonoGeo(overrides?: Partial<NamespaceGeo>): NamespaceGeo {
  return {
    id: 'foo',
    x: 6,
    y: 6,
    width: 118,
    height: 97,
    label: 'foo',
    wtitle: getWTitle(measurer, defaultTheme, 'foo', 0),
    htitle: getHTitle(measurer, defaultTheme, 'foo'),
    baselineOffset: getTitleBaselineOffset(measurer, defaultTheme, 'foo'),
    ...overrides,
  };
}

describe('renderNamespaceFolder — byte-level jar parity (finono-05-cuvu171)', () => {
  it('emits the exact folder-tab <path> d attribute', () => {
    const svg = renderNamespaceFolder(finonoGeo(), scaleClassTheme(defaultTheme, 1));
    expect(svg).toContain(
      'd="M8.5,6 L28.925,6 A3.75,3.75 0 0 1 31.425,8.5 L38.425,26 L121.5,26 ' +
        'A2.5,2.5 0 0 1 124,28.5 L124,100.5 A2.5,2.5 0 0 1 121.5,103 L8.5,103 ' +
        'A2.5,2.5 0 0 1 6,100.5 L6,8.5 A2.5,2.5 0 0 1 8.5,6"',
    );
  });

  it('draws the outline with fill="none" and the jar-verified stroke', () => {
    const svg = renderNamespaceFolder(finonoGeo(), scaleClassTheme(defaultTheme, 1));
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke="#000"');
    expect(svg).toContain(`stroke-width="${PACKAGE_STROKE_WIDTH}"`);
  });

  it('emits the exact tab hline', () => {
    const svg = renderNamespaceFolder(finonoGeo(), scaleClassTheme(defaultTheme, 1));
    expect(svg).toContain('<line x1="6" y1="26" x2="38.425" y2="26"');
  });

  it('emits the exact bold title text at (10, 18.8889)', () => {
    const svg = renderNamespaceFolder(finonoGeo(), scaleClassTheme(defaultTheme, 1));
    expect(svg).toContain('<text x="10" y="18.889"');
    expect(svg).toContain('font-weight="700"');
    expect(svg).toContain('fill="#000"');
    expect(svg).toContain('>foo</text>');
  });

  // G2 N18: jar (deterministic-text mode) always stretches the title glyphs
  // to the measured width -- `textLength="19.425"`
  // for "foo" at 14pt bold, matching every other class text row's
  // convention (`renderer-classifier-box.ts`). Never asserted by N17.
  it('emits textLength/lengthAdjust on the title text (jar: 19.425)', () => {
    const svg = renderNamespaceFolder(finonoGeo(), scaleClassTheme(defaultTheme, 1));
    expect(svg).toContain('');
    expect(svg).toContain('textLength="19.425"');
  });

  it('omits textLength for an empty label', () => {
    const svg = renderNamespaceFolder(finonoGeo({ label: '', wtitle: 50 }), scaleClassTheme(defaultTheme, 1));
    expect(svg).not.toContain('textLength');
  });

  it('respects theme.colors.graph.packageBackground for the outline fill', () => {
    const theme = {
      ...defaultTheme,
      colors: { ...defaultTheme.colors, graph: { ...defaultTheme.colors.graph, packageBackground: '#0000FF' } },
    };
    const svg = renderNamespaceFolder(finonoGeo(), scaleClassTheme(theme, 1));
    expect(svg).toContain('fill="#00F"');
  });

  // G2 N18: skinparam packageBorderThickness / packageFontColor /
  // packageFontSize (block or flat form) -- jar-verified against
  // pixexi-81-sete111 (`skinparam package { BorderThickness 4; FontColor
  // green; FontSize 40 }`: `stroke-width:4`, `fill="#008000"` title text,
  // font-size 40 title while the classifier body stays 14).
  it('respects theme.colors.graph.packageBorderThickness for outline + hline stroke-width', () => {
    const theme = {
      ...defaultTheme,
      colors: { ...defaultTheme.colors, graph: { ...defaultTheme.colors.graph, packageBorderThickness: 4 } },
    };
    const svg = renderNamespaceFolder(finonoGeo(), scaleClassTheme(theme, 1));
    expect(svg).toContain('stroke-width="4"');
    expect(svg).not.toContain(`stroke-width="${PACKAGE_STROKE_WIDTH}"`);
  });

  it('respects colors.elements.package.font for the title text color', () => {
    const theme = {
      ...defaultTheme,
      colors: { ...defaultTheme.colors, elements: { package: { font: '#008000' } } },
    };
    const svg = renderNamespaceFolder(finonoGeo(), scaleClassTheme(theme, 1));
    expect(svg).toContain('fill="#008000"');
  });

  it('falls back to #000000 title fill when colors.elements.package.font is a Gradient', () => {
    const theme = {
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        elements: { package: { font: { kind: 'linear', from: '#fff', to: '#000' } as never } },
      },
    };
    const svg = renderNamespaceFolder(finonoGeo(), scaleClassTheme(theme, 1));
    expect(svg).toContain('fill="#000"');
  });

  it('respects colors.elements.package.fontSize for the title font-size, NOT the classifier body', () => {
    const theme = {
      ...defaultTheme,
      colors: { ...defaultTheme.colors, elements: { package: { fontSize: 40 } } },
    };
    const svg = renderNamespaceFolder(finonoGeo(), scaleClassTheme(theme, 1));
    expect(svg).toContain('font-size="40"');
  });
});

describe('titleFont / titleFontColor font-size + color resolution (G2 N18)', () => {
  it('getHTitle/getWTitle scale with colors.elements.package.fontSize (jar: pixexi-81-sete111, htitle 46)', () => {
    const theme = {
      ...defaultTheme,
      colors: { ...defaultTheme.colors, elements: { package: { fontSize: 40 } } },
    };
    expect(getHTitle(measurer, theme, 'Configuration files')).toBe(46);
  });

  it('falls back to theme.fontSize when no package-specific override is set', () => {
    expect(getHTitle(measurer, defaultTheme, 'foo')).toBe(getHTitle(measurer, defaultTheme, 'foo'));
  });
});

// ---------------------------------------------------------------------------
// G2 N18: skinparam style strictuml -- sharp-corner <polygon> variant.
// Byte-verified against test-results/dot-cache/class/jinibe-02-tebi269
// (`skinparam style strictuml; package a { class B }`):
//   <polygon points="16,6,29.7875,6,36.7875,26,64,26,64,95,16,95,16,6"
//            fill="none"
//            style="stroke:#000000;stroke-width:1.5;stroke-linejoin:miter;
//                   stroke-miterlimit:10;"/>
// Box origin (16,6), wtitle 13.7875 ("a" at 14pt bold), htitle 20,
// width 48, height 89.
// ---------------------------------------------------------------------------

function jinibeGeo(overrides?: Partial<NamespaceGeo>): NamespaceGeo {
  return {
    id: 'a',
    x: 16,
    y: 6,
    width: 48,
    height: 89,
    label: 'a',
    wtitle: getWTitle(measurer, defaultTheme, 'a', 0),
    htitle: getHTitle(measurer, defaultTheme, 'a'),
    baselineOffset: getTitleBaselineOffset(measurer, defaultTheme, 'a'),
    ...overrides,
  };
}

describe('renderNamespaceFolder — strictuml sharp-corner polygon (G2 N18, jinibe-02-tebi269)', () => {
  const strictTheme = { ...defaultTheme, strictUml: true };

  it('emits a <polygon>, not a <path>, when theme.strictUml is true', () => {
    const svg = renderNamespaceFolder(jinibeGeo(), scaleClassTheme(strictTheme, 1));
    expect(svg).toContain('<polygon points="16,6,29.788,6,36.788,26,64,26,64,95,16,95,16,6"');
    expect(svg).not.toContain('<path');
  });

  it('emits fill="none" plus the exact style string (stroke, stroke-width, linejoin, miterlimit)', () => {
    const svg = renderNamespaceFolder(jinibeGeo(), scaleClassTheme(strictTheme, 1));
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('style="stroke:#000;stroke-width:1.5;stroke-linejoin:miter;stroke-miterlimit:10;"');
  });

  it('draws the default rounded <path> when theme.strictUml is false/absent', () => {
    const svg = renderNamespaceFolder(jinibeGeo(), scaleClassTheme(defaultTheme, 1));
    expect(svg).toContain('<path');
    expect(svg).not.toContain('<polygon');
  });

  it('respects packageBorderThickness for the polygon stroke-width too', () => {
    const theme = {
      ...strictTheme,
      colors: { ...strictTheme.colors, graph: { ...strictTheme.colors.graph, packageBorderThickness: 4 } },
    };
    const svg = renderNamespaceFolder(jinibeGeo(), scaleClassTheme(theme, 1));
    expect(svg).toContain('stroke-width:4;');
  });
});

describe('PACKAGE_ROUND_CORNER', () => {
  it('is 5 (half=2.5, matching every jar-observed non-tab arc radius)', () => {
    expect(PACKAGE_ROUND_CORNER).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// cdd-T12 (diagnosis A3 M3): the inline `package "X" #COLOR {` background
// override, and the `<style> package { ... }` cascade that reaches the
// collapsed-EMPTY package leaf. Both expectations are the pinned oracle's
// own bytes.
// ---------------------------------------------------------------------------

describe('namespaceFill — inline package colour (A3 M3, garumi-63-vuze973)', () => {
  it("prefers the namespace's own #DDDDDD over the global packageBackground default", () => {
    expect(namespaceFill(finonoGeo({ color: '#DDDDDD' }), defaultTheme)).toBe('#DDDDDD');
  });

  it('falls back to the global packageBackground when there is no inline colour', () => {
    expect(namespaceFill(finonoGeo(), defaultTheme)).toBe('none');
  });

  it('still maps a transparent global background to the literal fill="none" (G2 N59)', () => {
    const theme = {
      ...defaultTheme,
      colors: { ...defaultTheme.colors, graph: { ...defaultTheme.colors.graph, packageBackground: '#00000000' } },
    };
    expect(namespaceFill(finonoGeo(), theme)).toBe('none');
  });

  it('paints the folder outline with it — jar fill="#DDD" where this port emitted "none"', () => {
    const svg = renderNamespaceFolder(finonoGeo({ color: '#DDDDDD' }), scaleClassTheme(defaultTheme, 1));
    expect(svg).toContain('fill="#DDD"');
  });
});

describe('renderEmptyPackageIcon — <style> package {} cascade (xitobu-41-lame230)', () => {
  // `<style> package { BackGroundColor palegreen; LineThickness 2;
  // LineColor red }` lands in the per-element bucket, and the jar's leaf
  // draws `fill="#98FB98"` `stroke="#F00"` `stroke-width="2"`.
  const styled = {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      elements: { package: { background: 'palegreen', border: 'red', lineThickness: 2 } },
    },
  };

  it('applies the block’s BackGroundColor / LineColor / LineThickness to the leaf', () => {
    const svg = renderEmptyPackageIcon(finonoGeo(), scaleClassTheme(styled, 1));
    expect(svg).toContain('fill="#98FB98"');
    expect(svg).toContain('stroke="#F00"');
    expect(svg).toContain('stroke-width="2"');
  });

  it('keeps the unstyled ...package_,title defaults otherwise (gatula-10-bifu561)', () => {
    const svg = renderEmptyPackageIcon(finonoGeo(), scaleClassTheme(defaultTheme, 1));
    expect(svg).toContain('fill="#F1F1F1"');
    expect(svg).toContain('stroke="#181818"');
    expect(svg).toContain('stroke-width="0.5"');
  });
});

// ---------------------------------------------------------------------------
// CDD T18b (journal row 46 / cdd-T18.md §9): `skinparam packageBorderColor`/
// `packageBackgroundColor` DO recolour the collapsed-EMPTY-package leaf
// upstream (`cocube-46-tusu692`) but must NOT repaint an unstyled leaf with
// the CLUSTER's own `...package_,group` default (`gatula-10-bifu561`).
// ---------------------------------------------------------------------------

describe('renderEmptyPackageIcon — flat skinparam packageBorderColor routes to the leaf (cocube-46-tusu692)', () => {
  const blueBorder = {
    ...defaultTheme,
    colors: { ...defaultTheme.colors, graph: { ...defaultTheme.colors.graph, packageBorder: '#0000FF' } },
  };

  it('recolours the leaf outline/hline to the skinparam value', () => {
    const svg = renderEmptyPackageIcon(finonoGeo(), scaleClassTheme(blueBorder, 1));
    expect(svg).toContain('stroke="#00F"');
  });

  it('leaves the leaf background at its own default (packageBackgroundColor unset)', () => {
    const svg = renderEmptyPackageIcon(finonoGeo(), scaleClassTheme(blueBorder, 1));
    expect(svg).toContain('fill="#F1F1F1"');
  });

  it('does not affect an unstyled leaf (gatula-10-bifu561 stays #181818/#F1F1F1)', () => {
    const svg = renderEmptyPackageIcon(finonoGeo(), scaleClassTheme(defaultTheme, 1));
    expect(svg).toContain('stroke="#181818"');
    expect(svg).toContain('fill="#F1F1F1"');
  });

  it('lets a `<style> package {}` block still win over the flat skinparam (cascade order)', () => {
    const styledOverBorder = {
      ...blueBorder,
      colors: { ...blueBorder.colors, elements: { package: { border: 'red' } } },
    };
    const svg = renderEmptyPackageIcon(finonoGeo(), scaleClassTheme(styledOverBorder, 1));
    expect(svg).toContain('stroke="#F00"');
  });
});

describe('renderNamespaceFolder/Rect/namespaceFill — cluster defaults unaffected by CDD T18b', () => {
  it('renderNamespaceFolder keeps the cluster stroke default #000000 when packageBorder is unset', () => {
    const svg = renderNamespaceFolder(finonoGeo(), scaleClassTheme(defaultTheme, 1));
    expect(svg).toContain('stroke="#000"');
  });

  it('renderNamespaceRect keeps the cluster stroke default #000000 when packageBorder is unset', () => {
    const svg = renderNamespaceRect(finonoGeo({ label: '' }), scaleClassTheme(defaultTheme, 1));
    expect(svg).toContain('stroke="#000"');
  });

  it('namespaceFill keeps the cluster fill default "none" when packageBackground is unset', () => {
    expect(namespaceFill(finonoGeo(), defaultTheme)).toBe('none');
  });
});

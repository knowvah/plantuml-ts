/**
 * `== label ==` dividers painted from the merged `separator` style (sdd1
 * T2d): `Divider` merges it in its constructor (`Divider.java:59-61`) and
 * `ComponentRoseDivider` reads colour, stroke, corner, shadow and font off it
 * (`ComponentRoseDivider.java:66-74`).
 *
 * Default values cite `~/git/plantuml/src/main/resources/skin/plantuml.skin`
 * (`separator`, `:179-187`); override expectations are oracle-verified
 * (`<style> separator { LineThickness 4; RoundCorner 10; LineStyle 3;
 * LineColor #00FF00 }` draws rules at `stroke-width:2`, a box at
 * `stroke-width:4;stroke-dasharray:3,3;` and `rx="5"` on both rects).
 */
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { DividerGeo } from '../../../src/diagrams/sequence/ast.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { renderDivider } from '../../../src/diagrams/sequence/renderer-divider.js';
import type { ScaledTheme } from '../../../src/diagrams/sequence/scale-geo.js';
import { astOrThrow } from '../../helpers/parse-ast.js';

const theme: ScaledTheme = { ...defaultTheme, scaleK: 1, measurer: new DeterministicMeasurer() };

/** `src/index.ts#umlSourceOfBlock`'s widening, over a `@startuml` body. */
function sourceOf(body: readonly string[]): UmlSource {
  const block = buildBlockUmls(`@startuml\n${body.join('\n')}\n@enduml`)[0]!;
  if (!block.ok) throw new Error('preprocessor failure');
  return {
    ...block.source,
    stylePositions: block.preprocessed.stylePositions,
    skinparamAssignments: block.preprocessed.skinparamAssignments,
    styleSource: block.preprocessed,
  };
}

function dividerOf(body: readonly string[]): DividerGeo {
  const ast = astOrThrow(parseSequence(sourceOf(['A -> B : hi', ...body])), 'sequence');
  const geo = layoutSequence(ast, defaultTheme, new DeterministicMeasurer());
  const divider = geo.events.find((e): e is DividerGeo => e.kind === 'divider');
  if (divider === undefined) throw new Error('no divider');
  return divider;
}

function separatorStyle(declarations: string): string[] {
  return ['<style>', `separator { ${declarations} }`, '</style>'];
}

const rects = (svg: string): string[] => svg.match(/<rect [^>]*>/g) ?? [];
const lines = (svg: string): string[] => svg.match(/<line [^>]*>/g) ?? [];

describe('divider paint, default skin (plantuml.skin:179-187)', () => {
  const svg = renderDivider(dividerOf(['== Init ==']), theme);

  it('fills the 3px band with BackGroundColor #e and strokes it in the same colour at 1 (:108-118)', () => {
    // `drawSep` applies `background` as the fore colour, `drawRectLong`
    // `UStroke.simple()`; `#e` is `#EEEEEE`, written `#EEE`.
    expect(rects(svg)[0]).toMatch(/height="3" fill="#EEE" stroke="#EEE" stroke-width="1"\/>$/);
  });

  it('draws the double rule in LineColor black at half LineThickness 2.0 (:121-126)', () => {
    expect(lines(svg)).toHaveLength(2);
    for (const l of lines(svg)) expect(l).toMatch(/stroke="#000" stroke-width="1"\/>$/);
  });

  it('strokes the label box with LineColor at the full LineThickness (:97-102)', () => {
    expect(rects(svg)[1]).toMatch(/fill="#EEE" stroke="#000" stroke-width="2"\/>$/);
  });

  it('draws the label at FontSize 13, FontStyle bold, FontColor black (plantuml.skin:9,184-185)', () => {
    const text = /<text [^>]*>Init<\/text>/.exec(svg)?.[0] ?? '';
    expect(text).toContain('font-size="13"');
    expect(text).toContain('font-weight="700"');
    expect(text).toContain('fill="#000"');
  });

  it('measures the label box with the style font: 13px line + Padding 4+4 (ComponentRoseDivider.java:67)', () => {
    const divider = dividerOf(['== Init ==']);
    const lineHeight = new DeterministicMeasurer().measure('M', {
      family: 'SansSerif',
      size: 13,
      weight: 'bold',
    }).height;
    expect(divider.textHeight).toBe(lineHeight + 8);
    expect(divider.height).toBe(lineHeight + 8 + 20); // :129-131
  });

  it('draws no corner and no shadow (RoundCorner/Shadowing 0, plantuml.skin:14,92)', () => {
    expect(svg).not.toContain('rx=');
    expect(svg).not.toContain('filter');
  });
});

describe('divider paint, from the style path', () => {
  it('<style> separator { LineThickness 4 } reaches the box and, halved, the rules', () => {
    const svg = renderDivider(dividerOf([...separatorStyle('LineThickness 4'), '== Init ==']), theme);
    expect(rects(svg)[1]).toContain('stroke-width="4"');
    for (const l of lines(svg)) expect(l).toContain('stroke-width="2"');
    expect(rects(svg)[0]).toContain('stroke-width="1"');
  });

  it('LineColor, LineStyle and RoundCorner arrive as the jar draws them', () => {
    const style = separatorStyle('LineThickness 4; RoundCorner 10; LineStyle 3; LineColor #00FF00');
    const svg = renderDivider(dividerOf([...style, '== Init ==']), theme);
    // The box takes the whole stroke, dash included (:98); the rules only the
    // thickness (:122); both rects are `.rounded(roundCorner)`, emitted as
    // `rx = roundCorner / 2` (`DriverRectangleSvg.java:78`).
    expect(rects(svg)[1]).toContain('stroke="#0F0" stroke-width="4" stroke-dasharray="3,3" rx="5" ry="5"');
    expect(rects(svg)[0]).toContain('stroke="#EEE" stroke-width="1" rx="5" ry="5"');
    for (const l of lines(svg)) expect(l).toMatch(/stroke="#0F0" stroke-width="2"\/>$/);
  });

  it('skinparam roundcorner reaches the divider through the style (jar: tukobo-89-zebi935 rx="5")', () => {
    const svg = renderDivider(dividerOf(['skinparam roundcorner 10', '== Init ==']), theme);
    expect(rects(svg).every((r) => r.includes('rx="5" ry="5"'))).toBe(true);
  });

  it('BackGroundColor and FontSize arrive', () => {
    const divider = dividerOf([...separatorStyle('BackGroundColor #FF0000; FontSize 20'), '== Init ==']);
    const svg = renderDivider(divider, theme);
    expect(rects(svg)[0]).toContain('fill="#F00" stroke="#F00"');
    expect(svg).toContain('font-size="20"');
  });

  it('a Shadowing style shadows the band and the box (:100,115)', () => {
    const svg = renderDivider(dividerOf([...separatorStyle('Shadowing 2'), '== Init ==']), theme);
    expect(rects(svg).map((r) => r.includes('filter="url(#sequenceShadow)"'))).toEqual([true, true]);
  });

  it('the empty ==== form draws the band and rules only (:84-85)', () => {
    const svg = renderDivider(dividerOf(['====']), theme);
    expect(rects(svg)).toHaveLength(1);
    expect(lines(svg)).toHaveLength(2);
  });

  it('scales every stroke width at emission (SvgGraphics.java:555-561)', () => {
    const svg = renderDivider(dividerOf(['== Init ==']), { ...theme, scaleK: 2 });
    expect(rects(svg)[0]).toContain('stroke-width="2"');
    expect(rects(svg)[1]).toContain('stroke-width="4"');
    for (const l of lines(svg)) expect(l).toContain('stroke-width="2"');
  });

  it('refuses a divider layout did not paint', () => {
    const { paint: _unused, ...unpainted } = dividerOf(['== Init ==']);
    expect(() => renderDivider(unpainted, theme)).toThrow(`divider "${unpainted.text}" carries no paint`);
  });
});

/**
 * lad-T1b: `skinparam lengthAdjust` reaches the class (and object) document.
 * @see net/sourceforge/plantuml/core/TextBlockExporter.java:306-307
 * @see net/sourceforge/plantuml/style/SkinParam.java:1258-1269
 * @see net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java:155-158,699-705
 */
import { describe, it, expect } from 'vitest';
import { renderFixture } from '../../helpers/render.js';

// Captured from the tree before the lad-T1b edit (FixedMeasurer 8x16).
const PRE_CHANGE_CLASS =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" data-diagram-type="CLASS" style="width:70px;height:82px;background:#FFFFFF;" width="70px" height="82px" viewBox="0 0 70 82" zoomAndPan="magnify" preserveAspectRatio="none" contentStyleType="text/css"><?plantuml $version$?><defs/><g font-family="sans-serif" lengthAdjust="spacing"><!--class A--><g class="entity" data-qualified-name="A" id="ent0001"><rect x="7" y="7" width="50" height="62" fill="#F1F1F1" stroke="#181818" stroke-width="0.5" rx="2.5" ry="2.5"/><ellipse cx="26.5" cy="23" rx="11" ry="11" fill="#ADD1B2" stroke="#181818" stroke-width="1"/><path d="M28.973,29.143 Q28.392,29.442 27.753,29.591 Q27.114,29.741 26.408,29.741 Q23.901,29.741 22.582,28.089 Q21.262,26.437 21.262,23.316 Q21.262,20.187 22.582,18.535 Q23.901,16.883 26.408,16.883 Q27.114,16.883 27.761,17.032 Q28.409,17.182 28.973,17.481 L28.973,20.203 Q28.342,19.622 27.749,19.352 Q27.155,19.083 26.524,19.083 Q25.18,19.083 24.495,20.149 Q23.81,21.216 23.81,23.316 Q23.81,25.408 24.495,26.474 Q25.18,27.541 26.524,27.541 Q27.155,27.541 27.749,27.271 Q28.342,27.002 28.973,26.42 Z" fill="#000"/><text x="41.5" y="26.444" font-size="14" fill="#000">A</text><line x1="8" y1="39" x2="56" y2="39" stroke="#181818" stroke-width="0.5"/><line x1="8" y1="47" x2="56" y2="47" stroke="#181818" stroke-width="0.5"/><g data-visibility-modifier="PUBLIC_METHOD"><ellipse cx="18" cy="59.5" rx="3" ry="3" fill="#84BE84" style="stroke:#038048;stroke-width:1;"/></g><text x="27" y="63.444" font-size="14" fill="#000" textLength="24">m()</text></g></g></svg>';
const PRE_CHANGE_OBJECT =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" data-diagram-type="CLASS" style="width:96px;height:62px;background:#FFFFFF;" width="96px" height="62px" viewBox="0 0 96 62" zoomAndPan="magnify" preserveAspectRatio="none" contentStyleType="text/css"><?plantuml $version$?><defs/><g font-family="sans-serif" lengthAdjust="spacing"><!--class Obj--><g class="entity" data-qualified-name="Obj" id="ent0001"><rect x="7" y="7" width="76" height="42" fill="#F1F1F1" stroke="#181818" stroke-width="0.5" rx="2.5" ry="2.5"/><text x="33" y="19.444" font-size="14" fill="#000" textLength="24">Obj</text><line x1="8" y1="27" x2="82" y2="27" stroke="#181818" stroke-width="0.5"/><text x="13" y="43.444" font-size="14" fill="#000" textLength="64">name = x</text></g></g></svg>';

function classSvg(lengthAdjust?: string): string {
  const param = lengthAdjust === undefined ? '' : `skinparam lengthAdjust ${lengthAdjust}\n`;
  return renderFixture(`@startuml\n${param}class A {\n+m()\n}\n@enduml`);
}

function objectSvg(lengthAdjust?: string): string {
  const param = lengthAdjust === undefined ? '' : `skinparam lengthAdjust ${lengthAdjust}\n`;
  return renderFixture(`@startuml\n${param}object Obj {\nname = x\n}\n@enduml`);
}

describe('class skinparam lengthAdjust', () => {
  it('unset: root spacing and textLength on multi-character text', () => {
    const svg = classSvg();
    expect(svg).toContain('lengthAdjust="spacing"');
    expect(svg).toMatch(/textLength="[\d.]+"/);
  });

  it('explicit spacing is byte-identical to unset (D4)', () => {
    expect(classSvg('spacing')).toBe(classSvg());
  });

  it('spacingAndGlyphs: named on the root, textLength kept', () => {
    const svg = classSvg('spacingAndGlyphs');
    expect(svg).toContain('lengthAdjust="spacingAndGlyphs"');
    expect(svg).toMatch(/textLength="[\d.]+"/);
  });

  it('none: no root lengthAdjust and no textLength', () => {
    const svg = classSvg('none');
    expect(svg).not.toContain('lengthAdjust');
    expect(svg).not.toContain('textLength');
    expect(svg).toContain('>A</text>');
  });

  it('object engine: none strips, glyphs names', () => {
    expect(objectSvg('none')).not.toContain('textLength');
    expect(objectSvg('none')).not.toContain('lengthAdjust');
    expect(objectSvg('spacingAndGlyphs')).toContain('lengthAdjust="spacingAndGlyphs"');
  });

  it('unset output is byte-identical to the pre-change render (D4)', () => {
    expect(classSvg()).toBe(PRE_CHANGE_CLASS);
    expect(objectSvg()).toBe(PRE_CHANGE_OBJECT);
  });
});

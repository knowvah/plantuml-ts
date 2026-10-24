/**
 * lad-T2a -- `skinparam lengthAdjust` on the activity root and both klimt
 * text sheets. Java: `TextBlockExporter.java:306-307`, `SkinParam.java:
 * 1258-1269`, `SvgGraphics.java:155-158` (root `<g>`), `:699-705`
 * (`textLength` only for SPACING / SPACING_AND_GLYPHS).
 */
import { describe, it, expect } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { resolveTheme, type Theme } from '../../../src/core/theme.js';
import { withActivityMeasurer } from '../../../src/diagrams/activity/activity-string-bounder.js';
import { LengthAdjust } from '../../../src/core/klimt/drawing/svg/svg-option.js';
import { lengthAdjustOption } from '../../../src/diagrams/activity/activity-length-adjust.js';
import { renderActionLabel } from '../../../src/diagrams/activity/activity-creole-sheet.js';
import {
  activityDisplayBlock,
  activityTextFontConfiguration,
  drawActivityTextBlock,
} from '../../../src/diagrams/activity/activity-text-sheet.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import { CreoleMode } from '../../../src/core/klimt/creole/CreoleMode.js';

const BOX = { x: 0, y: 0, width: 80 };
const PRE_CHANGE_UNSET =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" data-diagram-type="ACTIVITY" style="width:81px;height:68px;background:#FFFFFF;" width="81px" height="68px" viewBox="0 0 81 68" zoomAndPan="magnify" preserveAspectRatio="none" contentStyleType="text/css"><?plantuml $version$?><defs/><g font-family="sans-serif" lengthAdjust="spacing"><rect x="16" y="16" width="45.425" height="32" fill="#F1F1F1" stroke="#181818" stroke-width="0.5" rx="12.5" ry="12.5"/><text x="26" y="35.333" fill="#000" font-size="12" textLength="25.425">hello</text></g></svg>';

function themeWithMeasurer(): Theme {
  return withActivityMeasurer(resolveTheme('default'), new DeterministicMeasurer());
}

function render(skin: string): string {
  const lines = ['@startuml', ...(skin === '' ? [] : [skin]), ':hello;', '@enduml'];
  return renderSync(lines.join('\n'), { measurer: new DeterministicMeasurer() });
}

describe('lad-T2a activity lengthAdjust', () => {
  it('none: root <g> has no lengthAdjust and no <text> has textLength', () => {
    const svg = render('skinparam lengthAdjust none');
    expect(svg).toContain('<g font-family="sans-serif">');
    expect(svg).not.toContain('lengthAdjust');
    expect(svg).not.toContain('textLength');
  });

  it('spacingAndGlyphs: root <g> carries it and multi-char text keeps textLength', () => {
    const svg = render('skinparam lengthAdjust spacingAndGlyphs');
    expect(svg).toContain('<g font-family="sans-serif" lengthAdjust="spacingAndGlyphs">');
    expect(svg).toContain('textLength="25.425"');
  });

  it('unset: byte-identical to the pre-change render (D4)', () => {
    expect(render('')).toBe(PRE_CHANGE_UNSET);
  });

  it('maps the theme value to the klimt enum; unset adds nothing', () => {
    const base = resolveTheme('default');
    expect(lengthAdjustOption(base)).toEqual({});
    expect(lengthAdjustOption({ ...base, lengthAdjust: 'none' })).toEqual({ lengthAdjust: LengthAdjust.NONE });
    expect(lengthAdjustOption({ ...base, lengthAdjust: 'spacing' })).toEqual({ lengthAdjust: LengthAdjust.SPACING });
    expect(lengthAdjustOption({ ...base, lengthAdjust: 'spacingAndGlyphs' })).toEqual({
      lengthAdjust: LengthAdjust.SPACING_AND_GLYPHS,
    });
  });

  it('creole sheet itself omits textLength under none (SvgGraphics.java:703-705)', () => {
    const base = themeWithMeasurer();
    expect(renderActionLabel('hello', base, 12, BOX)).toContain('textLength=');
    expect(renderActionLabel('hello', { ...base, lengthAdjust: 'none' }, 12, BOX)).not.toContain('textLength');
  });

  it('text sheet itself omits textLength under none (SvgGraphics.java:703-705)', () => {
    const base = themeWithMeasurer();
    const draw = (lengthAdjust: 'none' | undefined): string => {
      const theme = lengthAdjust === undefined ? base : { ...base, lengthAdjust };
      const tb = activityDisplayBlock('hello', theme, {
        fontConfiguration: activityTextFontConfiguration(theme, 12, 'activity'),
        horizontalAlignment: HorizontalAlignment.LEFT,
        creoleMode: CreoleMode.FULL,
      });
      return drawActivityTextBlock(tb, { x: 0, y: 0 }, theme, activityTextFontConfiguration(theme, 12, 'activity'));
    };
    expect(draw(undefined)).toContain('textLength=');
    expect(draw('none')).not.toContain('textLength');
  });
});

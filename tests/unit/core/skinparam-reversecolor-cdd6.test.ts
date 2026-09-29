/**
 * cdd6 T3f follow-up (tozizu-96-voka262): `skinparam reversecolor <v>` is
 * read raw by `TitledDiagram#muteColorMapper`
 * (`getSkinParam().getValue("reversecolor")`, `TitledDiagram.java:301`) and
 * reaches `Theme.reverseColor` through the real skinparam path.
 */
import { describe, it, expect } from 'vitest';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

describe('skinparam reversecolor', () => {
  it('carries the raw value to Theme.reverseColor', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['reversecolor', 'dark']]), defaultTheme);
    expect(theme.reverseColor).toBe('dark');
    expect(unknown).not.toContain('reversecolor');
    expect(resolveSkinparam(new Map([['reverseColor', 'GBR']]), defaultTheme).theme.reverseColor).toBe('GBR');
  });

  it('maps a rendered class diagram (jar tozizu: background #010101)', () => {
    const svg = renderSync('@startuml\nskinparam reversecolor dark\nclass A\n@enduml', {
      measurer: new WidthTableMeasurer(),
    });
    expect(svg).toContain('background:#010101;');
    expect(svg).toContain('fill="#111"');
  });
});

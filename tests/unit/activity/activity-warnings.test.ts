import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { Pragma } from '../../../src/core/skin/Pragma.js';
import { Warning } from '../../../src/core/warning/Warning.js';
import type { RenderFragment } from '../../../src/core/dispatcher.js';
import type { ActivityDiagramAST } from '../../../src/diagrams/activity/ast.js';
import {
  activityWarnings,
  withSkinParamWarnings,
  withWarningBanner,
} from '../../../src/diagrams/activity/activity-warnings.js';
import { renderSync } from '../../../src/index.js';

const PADDING = 'Please use CSS style instead of skinparam padding';
const HANDWRITTEN = "Please use '!option handwritten true' to enable handwritten ";
const BRACKET = "You should use a bracket ({) when defining your container 'group' G";
const MARGIN = { top: 10, right: 10, bottom: 10, left: 10 };
/** Drawn text: monospace spaces become U+00A0, as in the jar's own SVG. */
const PADDING_DRAWN = PADDING.replaceAll(' ', '\u00a0');

function emptyAst(): ActivityDiagramAST {
  return { nodes: [], swimlanes: [], pragma: Pragma.createEmpty() };
}

function messages(ws: readonly Warning[]): string[] {
  return ws.map((w) => w.asSingleLine());
}

describe('withSkinParamWarnings (CommandSkinParam.java:92-99)', () => {
  it('warns for padding/handwritten, case-insensitively, in map order', () => {
    const map = new Map([
      ['Padding', '15'],
      ['ArrowColor', 'red'],
      ['HANDWRITTEN', 'true'],
    ]);
    const ast = withSkinParamWarnings(emptyAst(), map);
    expect(messages(ast.warnings ?? [])).toEqual([PADDING, HANDWRITTEN]);
  });

  it('returns the same AST when no skinparam warns', () => {
    const ast = emptyAst();
    expect(withSkinParamWarnings(ast, new Map([['ArrowColor', 'red']]))).toBe(ast);
    expect(withSkinParamWarnings(ast, undefined)).toBe(ast);
  });
});

describe('activityWarnings (TitledDiagram.java:326-334)', () => {
  it('joins skinparam warnings before pragma warnings, de-duplicated', () => {
    const base = withSkinParamWarnings(emptyAst(), new Map([['padding', '1']]));
    base.pragma!.addWarning(new Warning(BRACKET));
    base.pragma!.addWarning(new Warning(PADDING));
    expect(messages(activityWarnings(base))).toEqual([PADDING, BRACKET]);
  });
});

describe('withWarningBanner (DiagramChromeFactory.java:176-266)', () => {
  const fragment: RenderFragment = {
    body: '<ellipse cx="30" cy="25" rx="10" ry="10"/>',
    width: 61,
    height: 51,
    preChromeWidth: 40,
    preChromeHeight: 30,
  };
  const measurer = new DeterministicMeasurer();

  it('is the identity with no warning', () => {
    expect(withWarningBanner(fragment, [], measurer, MARGIN)).toBe(fragment);
  });

  it('stacks the banner above the body inside the document margin', () => {
    const out = withWarningBanner(fragment, [new Warning(PADDING)], measurer, MARGIN);
    // rect at margin + 3 (DiagramChromeFactory.java:235); text at margin + 10.
    expect(out.body).toMatch(/^<rect x="13" y="13" /);
    expect(out.body).toContain(`<text x="20" y="22" `);
    expect(out.body).toContain(`font-family="monospace">${PADDING_DRAWN}</text>`);
    // banner height = one 10pt line + 10 (java:265); body moves down by it.
    const bannerH = out.preChromeHeight! - 30;
    expect(bannerH).toBe(20);
    expect(out.body).toContain('cy="45"');
    expect(out.height).toBe(Math.floor(30 + bannerH + 20 + 1));
    // the banner (210.25 + 20) is wider than the 40px body: the stack takes
    // its width, and the rect spans it less 10 (java:234).
    expect(out.preChromeWidth).toBeCloseTo(230.25, 9);
    expect(out.body).toContain('width="220.25" height="15"');
    expect(out.width).toBe(251); // floor(230.25 + 2 * 10 + 1)
  });
});

describe('activity warning banner end to end', () => {
  it('draws the skinparam padding banner and moves the diagram down', () => {
    const measurer = new DeterministicMeasurer();
    const plain = renderSync('@startuml\nstart\n@enduml', { measurer });
    const warned = renderSync('@startuml\nskinparam padding 15\nstart\n@enduml', { measurer });
    expect(plain).not.toContain(PADDING_DRAWN);
    expect(warned).toContain(`>${PADDING_DRAWN}</text>`);
    const cy = (svg: string): number => Number(/<ellipse cx="[^"]*" cy="([^"]*)"/.exec(svg)![1]);
    expect(cy(warned)).toBeGreaterThan(cy(plain));
  });
});

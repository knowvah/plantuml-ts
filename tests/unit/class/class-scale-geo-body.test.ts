/**
 * Unit tests for `class-scale-geo-body.ts` (cdd-T29, D4) — enhanced-body
 * (separator/tree) and json-body scaling. None of T29's seven named
 * fixtures exercise an enhanced or json body under `scale`, so this file
 * exists purely to keep the module's own coverage at this project's
 * 90/90/90 floor; see `class-scale-geo.test.ts` for the fixture-adjacent
 * top-level scaling tests.
 */
import { describe, it, expect } from 'vitest';
import { scaleEnhancedBody, scaleJsonBody, scaleEmbeddedBlock } from '../../../src/diagrams/class/class-scale-geo-body.js';
import type {
  EnhancedBodyGeo,
  EnhancedDividerPart,
  EnhancedRowsPart,
  EnhancedTreePart,
  EmbeddedBlockGeo,
} from '../../../src/diagrams/class/class-body-enhanced-layout.js';
import type { JsonBodyItem } from '../../../src/diagrams/class/class-geo-types.js';

const THEME_FONT_SIZE = 14;

describe('scaleEmbeddedBlock', () => {
  it('multiplies y/width/height/sizingWidth/sizingHeight by k, leaves href untouched', () => {
    const block: EmbeddedBlockGeo = { y: 4, width: 20, height: 10, href: 'data:x', sizingWidth: 18, sizingHeight: 8 };
    const scaled = scaleEmbeddedBlock(block, 0.5);
    expect(scaled).toEqual({ y: 2, width: 10, height: 5, href: 'data:x', sizingWidth: 9, sizingHeight: 4 });
  });
});

describe('scaleEnhancedBody — divider part', () => {
  it('multiplies y/strokeWidth by k, no title/dasharray/doubleLine', () => {
    const divider: EnhancedDividerPart = { kind: 'divider', y: 10, strokeWidth: 1 };
    const body: EnhancedBodyGeo = { parts: [divider], width: 40, height: 20, portMembers: [] };
    const scaled = scaleEnhancedBody(body, 0.5, THEME_FONT_SIZE);
    expect(scaled.parts[0]).toEqual({ kind: 'divider', y: 5, strokeWidth: 0.5 });
    expect(scaled.width).toBe(20);
    expect(scaled.height).toBe(10);
  });

  it('scales a titled divider and its dash pattern', () => {
    const divider: EnhancedDividerPart = {
      kind: 'divider',
      y: 10,
      strokeWidth: 1,
      strokeDasharray: '1,2',
      doubleLine: true,
      title: { x: 4, y: 12, width: 30, text: 'Header' },
    };
    const body: EnhancedBodyGeo = { parts: [divider], width: 40, height: 20, portMembers: [] };
    const scaled = scaleEnhancedBody(body, 2, THEME_FONT_SIZE);
    expect(scaled.parts[0]).toEqual({
      kind: 'divider',
      y: 20,
      strokeWidth: 2,
      strokeDasharray: '2,4',
      doubleLine: true,
      title: { x: 8, y: 24, width: 60, text: 'Header' },
    });
  });
});

describe('scaleEnhancedBody — rows part', () => {
  it('scales rows, embeds, and portMembers', () => {
    const rows: EnhancedRowsPart = {
      kind: 'rows',
      rows: [{ text: 'a', y: 10, indent: 4 }],
      embeds: [{ y: 2, width: 10, height: 6, sizingWidth: 10, sizingHeight: 6 }],
      portMembers: [{ text: 'a', top: 10, height: 12 }],
    };
    const body: EnhancedBodyGeo = { parts: [rows], width: 40, height: 20, portMembers: [{ text: 'a', top: 10, height: 12 }] };
    const scaled = scaleEnhancedBody(body, 0.5, THEME_FONT_SIZE);
    const part = scaled.parts[0] as EnhancedRowsPart;
    expect(part.rows[0]!.y).toBe(5);
    expect(part.rows[0]!.fontSize).toBe(7);
    expect(part.embeds![0]).toEqual({ y: 1, width: 5, height: 3, sizingWidth: 5, sizingHeight: 3 });
    expect(part.portMembers![0]).toEqual({ text: 'a', top: 5, height: 6 });
    expect(scaled.portMembers[0]).toEqual({ text: 'a', top: 5, height: 6 });
  });

  it('leaves embeds/portMembers absent when the input carries none', () => {
    const rows: EnhancedRowsPart = { kind: 'rows', rows: [] };
    const body: EnhancedBodyGeo = { parts: [rows], width: 0, height: 0, portMembers: [] };
    const scaled = scaleEnhancedBody(body, 0.5, THEME_FONT_SIZE);
    const part = scaled.parts[0] as EnhancedRowsPart;
    expect(part.embeds).toBeUndefined();
    expect(part.portMembers).toBeUndefined();
  });
});

describe('scaleEnhancedBody — tree part', () => {
  it('scales rows and every tree-connector field', () => {
    const tree: EnhancedTreePart = {
      kind: 'tree',
      rows: [{ text: 'a', y: 10, indent: 8 }],
      connectors: [{ bulletX: 1, bulletY: 2, hx1: 3, hx2: 4, hy: 5, vx: 6, vy1: 7, vy2: 8 }],
    };
    const body: EnhancedBodyGeo = { parts: [tree], width: 0, height: 0, portMembers: [] };
    const scaled = scaleEnhancedBody(body, 2, THEME_FONT_SIZE);
    const part = scaled.parts[0] as EnhancedTreePart;
    expect(part.rows[0]!.y).toBe(20);
    expect(part.connectors[0]).toEqual({ bulletX: 2, bulletY: 4, hx1: 6, hx2: 8, hy: 10, vx: 12, vy1: 14, vy2: 16 });
  });
});

describe('scaleJsonBody', () => {
  it('scales an hline item', () => {
    const items: JsonBodyItem[] = [{ kind: 'hline', x: 2, y: 4, width: 30 }];
    const [scaled] = scaleJsonBody(items, 0.5, THEME_FONT_SIZE);
    expect(scaled).toEqual({ kind: 'hline', x: 1, y: 2, width: 15 });
  });

  it('scales a vline item', () => {
    const items: JsonBodyItem[] = [{ kind: 'vline', x: 2, y: 4, height: 30 }];
    const [scaled] = scaleJsonBody(items, 0.5, THEME_FONT_SIZE);
    expect(scaled).toEqual({ kind: 'vline', x: 1, y: 2, height: 15 });
  });

  it('scales a text item, materializing the theme fontSize fallback', () => {
    const items: JsonBodyItem[] = [{ kind: 'text', row: { text: 'k', y: 10, indent: 0 } }];
    const [scaled] = scaleJsonBody(items, 0.5, THEME_FONT_SIZE);
    expect(scaled).toEqual({ kind: 'text', row: { text: 'k', y: 5, indent: 0, fontSize: 7 } });
  });
});

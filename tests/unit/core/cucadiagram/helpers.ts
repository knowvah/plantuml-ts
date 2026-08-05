/**
 * Shared fakes for the SI1 body-layer tests (T9) — the
 * `BodyEnhanced2.test.ts`/`MethodsOrFieldsArea.test.ts` established
 * `unitOps`/`realSheetBuilder`/`fakeSkin` pattern, extracted once now
 * that four test files consume it (DRY-in-tests,
 * `~/.claude/rules/testing.md`; the two T8-era files keep their local
 * copies untouched — refactoring them is not this task's work).
 *
 * Every dimension asserted through these fakes is hand-derived:
 *   row width  = rendered text length × CHAR_WIDTH(2)
 *   row height = LINE_HEIGHT(10)
 */
import { Sheet } from '../../../../src/core/klimt/creole/Sheet.js';
import type { Stripe } from '../../../../src/core/klimt/creole/Stripe.js';
import type { CreoleAtom } from '../../../../src/core/klimt/creole/atom/Atom.js';
import type { SheetBuilder, DisplayLike } from '../../../../src/core/klimt/creole/SheetBuilder.js';
import type { AtomOps } from '../../../../src/core/klimt/creole/Sea.js';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import type { FontConfiguration } from '../../../../src/core/klimt/shape/UText.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { ClockwiseTopRightBottomLeft } from '../../../../src/core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import { LineBreakStrategy } from '../../../../src/core/klimt/LineBreakStrategy.js';
import { Pragma } from '../../../../src/core/skin/Pragma.js';
import type { Entity } from '../../../../src/core/abel/Entity.js';
import type { LeafType } from '../../../../src/core/abel/LeafType.js';
import type { MethodsOrFieldsAreaSkinParam } from '../../../../src/core/cucadiagram/MethodsOrFieldsAreaConfig.js';
import type { BodyEnhanced1Style } from '../../../../src/core/cucadiagram/BodyEnhanced1Config.js';

export const CHAR_WIDTH = 2;
export const LINE_HEIGHT = 10;
/** plantuml.skin `element { LineThickness 0.5 }` (BodyEnhancedAbstract.ts). */
export const LINE_THICKNESS = 0.5;
/** 17/3+6 — class-member-rows.ts's documented default derivation. */
export const DEFAULT_RADIUS = 11;

/** Three DISTINCT `FontConfiguration` identities so the
 *  member/title/tree-table font routing (`BodyEnhanced1Config.ts`'s
 *  three separate upstream `getFontConfiguration` expressions) is
 *  observable via `SkinOptions.sheetFonts`. */
export const MEMBER_FONT: FontConfiguration = { family: 'sans-serif', size: 12, color: '#000000', styles: new Set() };
export const TITLE_FONT: FontConfiguration = { family: 'sans-serif', size: 13, color: '#000001', styles: new Set() };
export const TREE_FONT: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000002', styles: new Set() };

export class FakeStringBounder implements StringBounder {
  calculateDimension(): XDimension2D {
    return new XDimension2D(0, 0);
  }
}
export const sb: StringBounder = new FakeStringBounder();

export function unitOps(): AtomOps {
  return {
    calculateDimension: (atom): XDimension2D => {
      const text = atom.kind === 'text' ? atom.text : '';
      return new XDimension2D(text.length * CHAR_WIDTH, LINE_HEIGHT);
    },
    getStartingAltitude: (): number => 0,
    drawU: (): void => undefined,
  };
}

/** One verbatim text stripe per sheet (empty display → zero stripes) —
 *  `BodyEnhanced2.test.ts#realSheetBuilder`, reused unchanged. */
export function realSheetBuilder(font: FontConfiguration): SheetBuilder {
  return {
    createSheet(display: DisplayLike) {
      const sheet = new Sheet(HorizontalAlignment.LEFT);
      const lines = [...display];
      if (lines.length === 0) return sheet;
      const text = lines.map((line) => (typeof line === 'string' ? line : line.toString())).join(' ');
      const atom: CreoleAtom = { kind: 'text', text, font };
      const stripe: Stripe = { getLHeader: () => null, getAtoms: () => [atom] };
      sheet.add(stripe);
      return sheet;
    },
  };
}

export interface SkinOptions {
  classAttributeIconSize?: number;
  circledCharacterRadius?: number;
  /** Records every `sheet(...)` first argument (the resolved
   *  `FontConfiguration`) so font routing is observable. */
  sheetFonts?: FontConfiguration[];
}

export function fakeSkin(options: SkinOptions = {}): MethodsOrFieldsAreaSkinParam {
  return {
    // --- abel/ISkinParam.ts consumed slice (T5 stub) ---
    getFontHtmlColor: () => ({}),
    getFont: () => ({}),
    getHyperlinkColor: () => ({}),
    useUnderlineForHyperlink: () => {
      throw new Error('not exercised in this test');
    },
    getCurrentStyleBuilder: () => ({}),
    getDefaultTextAlignment: (defaultValue) => defaultValue,
    // --- T10 consumed-slice growth (CucaDiagram#showPortion) ---
    strictUmlStyle: () => false,
    // --- style/ISkinSimple.ts ---
    getSprite: () => null,
    guillemet: () => {
      throw new Error('not exercised in this test');
    },
    getFromMd5: () => null,
    transformStringForSizeHack: (s) => s,
    getValue: () => null,
    values: () => new Map(),
    getPadding: () => ClockwiseTopRightBottomLeft.none(),
    getMonospacedFamily: () => 'monospaced',
    getTabSize: () => 8,
    getDpi: () => 96,
    copyAllFrom: () => undefined,
    getPragma: () => Pragma.createEmpty(),
    sheet: (font: FontConfiguration) => {
      options.sheetFonts?.push(font);
      return realSheetBuilder(font);
    },
    // --- MethodsOrFieldsAreaSkinParam additions (java:126/157) ---
    classAttributeIconSize: () => options.classAttributeIconSize ?? 0,
    getCircledCharacterRadius: () => options.circledCharacterRadius ?? DEFAULT_RADIUS,
  };
}

/** A leaf with just the surface the body layer reaches:
 *  `getPortShortNames` (MethodsOrFieldsArea#getPorts) and `getLeafType`
 *  (BodyEnhanced1's Display constructor). */
export function fakeLeaf(leafType: LeafType, portShortNames: readonly string[] = []): Entity {
  return {
    getLeafType: () => leafType,
    getPortShortNames: () => new Set(portShortNames),
  } as unknown as Entity;
}

/** A `Style` input satisfying `requireBodyEnhanced1Style` — the abel
 *  stub member plus every resolved ADR-9 seam value
 *  (`BodyEnhanced1Config.ts`). */
export function makeBodyStyle(overrides: Partial<BodyEnhanced1Style> = {}): BodyEnhanced1Style {
  return {
    getHorizontalAlignment: () => HorizontalAlignment.LEFT,
    lineThickness: LINE_THICKNESS,
    minimumWidth: 0,
    titleConfig: TITLE_FONT,
    treeTableFontConfig: TREE_FONT,
    memberFontConfig: MEMBER_FONT,
    wrapWidth: LineBreakStrategy.NONE,
    atomOps: unitOps(),
    ...overrides,
  };
}

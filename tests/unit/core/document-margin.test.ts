/**
 * lgm-T1a: `TextBlockExporter`'s margin around a chrome-composed block
 * (`core/document-margin.ts`) and the order `applyExportedChrome` runs it in
 * (`UgDiagram#getExporter`, `UgDiagram.java:124-128`).
 */
import { describe, expect, it } from 'vitest';
import {
  applyDocumentMargin,
  documentMarginOf,
  removeDocumentMargin,
  SEQUENCE_DOCUMENT_MARGIN,
} from '../../../src/core/document-margin.js';
import { applyExportedChrome } from '../../../src/core/annotations/chrome-export.js';
import { createAnnotations } from '../../../src/core/annotations/index.js';
import { FixedMeasurer } from '../../../src/core/measurer.js';
import type { RenderFragment } from '../../../src/core/dispatcher.js';

const SEQUENCE_FRAGMENT: RenderFragment = {
  body: '<rect x="15" y="15" width="20" height="10"/>',
  width: 60.5,
  height: 40.5,
  preChromeWidth: 50,
  preChromeHeight: 30,
  diagramType: 'SEQUENCE',
};

describe('documentMarginOf', () => {
  it('is same(5) for a sequence fragment that declares its margin-less block', () => {
    expect(documentMarginOf(SEQUENCE_FRAGMENT)).toEqual({ top: 5, right: 5, bottom: 5, left: 5 });
    expect(documentMarginOf(SEQUENCE_FRAGMENT)).toBe(SEQUENCE_DOCUMENT_MARGIN);
  });

  it('is CucaDiagram (0, 5, 5, 0) for class', () => {
    expect(documentMarginOf({ ...SEQUENCE_FRAGMENT, diagramType: 'CLASS' })).toEqual({
      top: 0,
      right: 5,
      bottom: 5,
      left: 0,
    });
  });

  it('is undefined without a declared block, or for a type the table does not know', () => {
    const { preChromeWidth: _w, preChromeHeight: _h, ...undeclared } = SEQUENCE_FRAGMENT;
    expect(documentMarginOf(undeclared)).toBeUndefined();
    expect(documentMarginOf({ ...SEQUENCE_FRAGMENT, diagramType: 'SALT' })).toBeUndefined();
    expect(documentMarginOf({ ...SEQUENCE_FRAGMENT, diagramType: undefined as unknown as string })).toBeUndefined();
  });
});

describe('documentMarginOf -- svek family (lgm-T1c)', () => {
  it.each(['CLASS', 'STATE', 'DESCRIPTION'])('%s is a CucaDiagram (0, 5, 5, 0)', (diagramType) => {
    expect(documentMarginOf({ ...SEQUENCE_FRAGMENT, diagramType })).toEqual({ top: 0, right: 5, bottom: 5, left: 0 });
  });
});

describe('removeDocumentMargin / applyDocumentMargin', () => {
  it('removing moves the body back by (left, top) and takes the declared block dimension', () => {
    const block = removeDocumentMargin(SEQUENCE_FRAGMENT, SEQUENCE_DOCUMENT_MARGIN);
    expect(block.body).toBe('<rect x="10" y="10" width="20" height="10"/>');
    expect([block.width, block.height]).toEqual([50, 30]);
  });

  it('applying shifts by (left, top) and truncates dim + margin + 1 (ensureVisible)', () => {
    const block = removeDocumentMargin(SEQUENCE_FRAGMENT, SEQUENCE_DOCUMENT_MARGIN);
    const exported = applyDocumentMargin({ ...block, width: 50.4, height: 30 }, SEQUENCE_DOCUMENT_MARGIN);
    expect(exported.body).toBe('<rect x="15" y="15" width="20" height="10"/>');
    expect([exported.width, exported.height]).toEqual([61, 41]);
  });
});

describe('applyExportedChrome', () => {
  it('returns the very same fragment when the diagram carries no annotation chrome', () => {
    const result = applyExportedChrome(SEQUENCE_FRAGMENT, createAnnotations(), {} as never, new FixedMeasurer(10, 12));
    expect(result).toBe(SEQUENCE_FRAGMENT);
  });
});

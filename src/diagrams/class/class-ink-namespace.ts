/**
 * A class group's (namespace cluster's) ink term -- split out of
 * `class-ink-box.ts` (500-line cap, cdd3-T31) when the title/USymbol walk
 * terms landed. `addNamespaceInk` moved verbatim apart from those terms.
 */

import type { NamespaceGeo } from './class-geo-namespace-types.js';
import type { LeafSymbolInk } from '../../core/svek/image/leaf-sizing-entity.js';
import type { InkBox } from './class-ink-shapes.js';
import {
  addPoint,
  addPlainInk,
  addFolderPolygonInk,
  addNamespaceRectInk,
  addNamespaceNodeInk,
  addNamespaceDatabaseInk,
  addNamespaceStackInk,
} from './class-ink-shapes.js';

/** An ink extent held LOCAL to `(origin.x, origin.y)` (layout-time walks). */
export function addLocalInk(box: InkBox, origin: { x: number; y: number }, ink: LeafSymbolInk): void {
  addPoint(box, origin.x + ink.minX, origin.y + ink.minY);
  addPoint(box, origin.x + ink.maxX, origin.y + ink.maxY);
}

/**
 * G2 N60 (item 42): dispatches a namespace's own ink contribution on
 * `NamespaceGeo.inkShape` (see that field's own doc comment in `layout.ts`
 * for the full jar-verified mechanism) -- `undefined` keeps the PRE-N60
 * `addPlainInk` (`UPath`) behavior unchanged for the common default-FOLDER,
 * non-`strictuml` case.
 */
export function addNamespaceInk(box: InkBox, n: NamespaceGeo): void {
  // cdd3-T31 (E1-5): a USymbol container walked as drawn -- see
  // `NamespaceGeo.symbolInk`. Supersedes every outline rule below.
  if (n.symbolInk !== undefined) {
    addLocalInk(box, n, n.symbolInk);
    return;
  }
  // cdd3-T31 (E1-2 = E2-8): the folder/rect title `UText`, on top of the
  // outline -- see `NamespaceGeo.titleInk`.
  if (n.titleInk !== undefined) addLocalInk(box, n, n.titleInk);
  // cdd2-T7b (R-8): the `stack` USymbol's own two-shape ink rule -- see
  // `addNamespaceStackInk`'s doc comment. Keyed on `n.usymbol` directly
  // (not a new `inkShape` bucket): `resolveNamespaceInkShape`
  // (`class-geo-builders.ts`) never maps `stack` to one, since `stack`
  // is outside that function's write-set for this task.
  if (n.usymbol === 'stack') {
    addNamespaceStackInk(box, n.x, n.y, n.width, n.height);
    return;
  }
  // cdd-T12: the two USymbol-container rules -- see `class-ink-shapes.ts`'s
  // own doc comments for each `LimitFinder` citation.
  if (n.inkShape === 'node') {
    addNamespaceNodeInk(box, n.x, n.y, n.width, n.height);
    return;
  }
  if (n.inkShape === 'database') {
    addNamespaceDatabaseInk(box, n.x, n.y, n.width, n.height);
    return;
  }
  if (n.inkShape === 'polygon') {
    addFolderPolygonInk(box, n.x, n.y, n.width, n.height);
    return;
  }
  if (n.inkShape === 'rect') {
    addNamespaceRectInk(box, n.x, n.y, n.width, n.height);
    return;
  }
  addPlainInk(box, n.x, n.y, n.width, n.height);
}

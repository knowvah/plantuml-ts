/**
 * Survey verdict for fixtures the STOCK jar renders as an error page (D7).
 *
 * decisions.md verdict table: jar errors (per `oracle/goldens/stock-error-pages.json`)
 * AND we render our own error page => `conformant` with `errorPage: true`;
 * jar errors AND we draw => `diverged` / `error-page`; jar does not error =>
 * `undefined` (caller falls through to the exact SVG comparison). Error-page
 * geometry is never compared (error-page rule).
 *
 * Node-only dev infra — never imported by src/.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { setErrorPageObserver } from '../../src/core/error/error-renderer.js';

/** T1a's record (`scripts/stock-jar-verify.sh`). */
const STOCK_ERRORS_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'oracle',
  'goldens',
  'stock-error-pages.json',
);

/** Record keys are `"<type>/<slug>"`. */
export type StockErrorRecord = ReadonlySet<string>;

export interface ErrorVerdict {
  verdict: 'conformant' | 'diverged';
  errorPage?: true;
  firstDiff?: string;
}

/** Loads the key set of `stock-error-pages.json` (`{ errors: Record<key, …> }`). */
export function loadStockErrorRecord(path: string = STOCK_ERRORS_PATH): StockErrorRecord {
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf-8'));
  const errors = (parsed as { errors?: unknown }).errors;
  if (typeof errors !== 'object' || errors === null) {
    throw new Error(`stock error record ${path}: missing "errors" object`);
  }
  return new Set(Object.keys(errors));
}

/** Pure verdict; `undefined` when the stock jar does not error on this fixture. */
export function errorPageVerdict(
  type: string,
  slug: string,
  record: StockErrorRecord,
  errorPage: boolean,
): ErrorVerdict | undefined {
  if (!record.has(`${type}/${slug}`)) return undefined;
  return errorPage ? { verdict: 'conformant', errorPage: true } : { verdict: 'diverged', firstDiff: 'error-page' };
}

/** Installs the T1b observer (`setErrorPageObserver`) and returns a reader for
 *  "the render drew a `PSystemError` page". The caller clears the observer
 *  with `setErrorPageObserver(undefined)` in its `finally`. */
export function installErrorPageFlag(): () => boolean {
  let errorPage = false;
  setErrorPageObserver(() => {
    errorPage = true;
  });
  return () => errorPage;
}

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

/** Record keys are `"<type>/<slug>"`. */
export type StockErrorRecord = ReadonlySet<string>;

export interface ErrorVerdict {
  verdict: 'conformant' | 'diverged';
  errorPage?: true;
  firstDiff?: string;
}

/** Loads the key set of `stock-error-pages.json` (`{ errors: Record<key, …> }`). */
export function loadStockErrorRecord(path: string): StockErrorRecord {
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

/**
 * The include seam's error types, split out of `include-resolver.ts` (which
 * sits at the repo's 500-line cap) and re-exported from it unchanged.
 */
import type { SecurityProfile } from './security/SecurityProfile.js';

/**
 * Thrown when a CSP connect-src policy blocks an include fetch.
 * The `requiredDirective` property contains the exact directive the page needs.
 */
export class CspIncludeError extends Error {
  readonly url: string;
  readonly requiredDirective: string;

  constructor(url: string, origin: string) {
    const directive = `connect-src 'self' ${origin}`;
    super(
      `CSP blocked !include fetch from ${url}.\n` +
        `Add the following to your Content-Security-Policy to allow it:\n` +
        `  Content-Security-Policy: ${directive}`,
    );
    this.name = 'CspIncludeError';
    this.url = url;
    this.requiredDirective = directive;
  }
}

/**
 * Thrown when a CORS failure prevents an include fetch.
 * Browsers hide the CORS detail — this error is inferred from URL patterns.
 * Updating CSP will not resolve a CORS issue.
 */
export class CorsIncludeError extends Error {
  readonly url: string;

  constructor(url: string) {
    super(
      `CORS error fetching !include from ${url}.\n` +
        `The server does not send Access-Control-Allow-Origin headers; browsers block the response.\n` +
        `Updating your Content-Security-Policy will not help — this is a server-side CORS issue.\n` +
        `Options:\n` +
        `  • Bundle the include content at build time using a local resolver\n` +
        `  • Host the file on a server that sends CORS headers\n` +
        `  • Use a CORS proxy service`,
    );
    this.name = 'CorsIncludeError';
    this.url = url;
  }
}

/**
 * Thrown when include resolution fails for a reason other than CSP or CORS.
 */
export class IncludeResolveError extends Error {
  readonly url: string;

  constructor(message: string, url: string) {
    super(message);
    this.name = 'IncludeResolveError';
    this.url = url;
  }
}

/**
 * A url include the security profile refuses. Upstream's `SURL#openStream`
 * returns null and `PreprocessorUtils#getReaderInclude` throws
 * `EaterException("Cannot open URL")` (PreprocessorUtils.java:157-159).
 */
export function blockedUrlError(url: string, profile: SecurityProfile): IncludeResolveError {
  return new IncludeResolveError(`Cannot open URL ${url}: blocked by security profile ${profile}`, url);
}

/**
 * A fetch that outlived the profile's `getTimeout()`. Upstream's
 * `Future#get` times out, `SURL#getBytes` returns null (SURL.java:357-366),
 * and the include fails as `Cannot open URL`.
 */
export function includeTimeoutError(url: string, timeoutMs: number): IncludeResolveError {
  return new IncludeResolveError(`Cannot open URL ${url}: no response within ${timeoutMs} ms`, url);
}

/**
 * Thrown when a circular !include chain is detected.
 * The `chain` property contains the inclusion path leading to the cycle.
 */
export class CircularIncludeError extends Error {
  readonly url: string;
  readonly chain: readonly string[];

  constructor(url: string, chain: string[]) {
    super(`Circular !include detected: ${[...chain, url].join(' → ')}`);
    this.name = 'CircularIncludeError';
    this.url = url;
    this.chain = chain;
  }
}

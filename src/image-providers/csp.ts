/**
 * A pure Content Security Policy Level 3 source-list matcher: given a url,
 * the page origin and serialized policies, would the policies' fetch
 * directive (`connect-src`, falling back to `default-src`) allow the url?
 * The browser provider runs it before `fetch()` because JS cannot observe a
 * block until the request has failed.
 *
 * Specification: W3C CSP Level 3, https://www.w3.org/TR/CSP3/ (Working Draft,
 * read 2026-10-23). The sections implemented, quoted from that text:
 *
 * - 6.7.2.7 "Does url match source list in origin with redirect count?":
 *   "If source list is empty, return 'Does Not Match'. If source list's size
 *   is 1, and source list[0] is an ASCII case-insensitive match for the
 *   string "'none'", return 'Does Not Match'. ... The 'none' keyword has no
 *   effect when other source expressions are present. ... For each expression
 *   of source list: If [6.7.2.8] returns 'Matches' ..., return 'Matches'.
 *   Return 'Does Not Match'."
 * - 6.7.2.8 "Does url match expression in origin with redirect count?":
 *   "If expression is the string "*", return 'Matches' if ... url's scheme
 *   is an HTTP(S) scheme [or] url's scheme is the same as origin's scheme.
 *   If expression matches the scheme-source or host-source grammar: If
 *   expression has a scheme-part, and it does not scheme-part match url's
 *   scheme, return 'Does Not Match'. If expression matches the scheme-source
 *   grammar, return 'Matches'. ... If url's host is null, return 'Does Not
 *   Match'. If expression does not have a scheme-part, and origin's scheme
 *   does not scheme-part match url's scheme, return 'Does Not Match'. If
 *   expression's host-part does not host-part match url's host ... If
 *   port-part does not port-part match url ... If expression contains a
 *   non-empty path-part, and redirect count is 0 ... [path-part match] ...
 *   Return 'Matches'. If expression is an ASCII case-insensitive match for
 *   "'self'": If url's scheme is "blob", return 'Does Not Match'. Return
 *   'Matches' if ... origin and url's origin are same origin [or] origin's
 *   host is the same as url's host, origin's port and url's port are either
 *   the same or the default ports for their respective schemes, and url's
 *   scheme is "https" or "wss", or origin's scheme is "http" and url's scheme
 *   is "http" or "ws"."
 * - 6.7.2.9 scheme-part matching: "A is an ASCII case-insensitive match for
 *   B[, or] A is 'http' and B is 'https'[, or] A is 'ws' and B is 'wss',
 *   'http', or 'https'[, or] A is 'wss' and B is 'https'."
 * - 6.7.2.10 host-part matching: "If host is not a domain, return 'Does Not
 *   Match'. If pattern is "*", return 'Matches'. If pattern starts with
 *   "*.": Let remaining be pattern with the leading U+002A (*) removed and
 *   ASCII lowercased. If host to ASCII lowercase ends with remaining, then
 *   return 'Matches'. Return 'Does Not Match'. If pattern is not an ASCII
 *   case-insensitive match for host, return 'Does Not Match'."
 * - 6.7.2.11 port-part matching: "If input is equal to "*", return
 *   'Matches'. ... If normalizedInput equals url's port, return 'Matches'. If
 *   url's port is null: Let defaultPort be the default port for url's
 *   scheme. If normalizedInput equals defaultPort, return 'Matches'."
 * - 6.7.2.12 path-part matching: "If path A is the empty string, return
 *   'Matches'. If path A consists of one character that is equal to U+002F
 *   (/) and path B is the empty string, return 'Matches'. Let exact match be
 *   false if the final character of path A is U+002F (/), and true otherwise.
 *   ... If path list A has more items than path list B, return 'Does Not
 *   Match'. If exact match is true, and path list A does not have the same
 *   number of items as path list B, return 'Does Not Match'. If exact match
 *   is false: ... Remove the final item from path list A. For each piece A
 *   of path list A: ... If decoded piece A is not decoded piece B, return
 *   'Does Not Match'. Return 'Matches'."
 * - 6.8.3 "Get fetch directive fallback list": "connect-src": « "connect-src",
 *   "default-src" »; the full table is {@link FETCH_DIRECTIVE_FALLBACKS}.
 * - 6.1.2.1 "connect-src Pre-request check": the directive allows when the
 *   request's url matches its source list. 6.8.4 "Should fetch directive
 *   execute" makes a `default-src` defer to any more specific directive the
 *   same policy carries, which {@link governingDirective} implements by
 *   walking the fallback list and taking the first directive present.
 * - 8.1 (multiple policies): "A policy specified via a meta element will be
 *   enforced along with any other policies active" -- every policy must
 *   allow.
 * - 3.3 "The <meta> element": a Document may deliver policies through `meta`
 *   elements; "Neither are the report-uri, frame-ancestors, and sandbox
 *   directives" supported there. They are never consulted by a fetch
 *   directive's fallback list, so no filtering is needed here.
 *
 * Simplifications, each forced by what a script can observe: the redirect
 * count is always 0 (a script cannot see redirects before they happen), so
 * path-parts always apply; `'unsafe-*'`, nonce and hash expressions match no
 * url (6.7.2.8 matches only the grammars above); and a page origin that does
 * not parse (an opaque origin, serialized `"null"`) makes `'self'` and
 * schemeless host-sources match nothing.
 */

/** Outcome of {@link isUrlAllowedByPolicies}. */
export type CspVerdict =
  | { readonly allowed: true }
  /** `directive` is the name of the directive that refused the url. */
  | { readonly allowed: false; readonly directive: string };

/**
 * 6.8.3 "Get fetch directive fallback list": most relevant first, including
 * the effective directive itself.
 */
export const FETCH_DIRECTIVE_FALLBACKS: Readonly<Record<string, readonly string[]>> = {
  'script-src-elem': ['script-src-elem', 'script-src', 'default-src'],
  'script-src-attr': ['script-src-attr', 'script-src', 'default-src'],
  'style-src-elem': ['style-src-elem', 'style-src', 'default-src'],
  'style-src-attr': ['style-src-attr', 'style-src', 'default-src'],
  'worker-src': ['worker-src', 'child-src', 'script-src', 'default-src'],
  'connect-src': ['connect-src', 'default-src'],
  'manifest-src': ['manifest-src', 'default-src'],
  'object-src': ['object-src', 'default-src'],
  'frame-src': ['frame-src', 'child-src', 'default-src'],
  'media-src': ['media-src', 'default-src'],
  'font-src': ['font-src', 'default-src'],
  'img-src': ['img-src', 'default-src'],
};

const KEYWORD_NONE = "'none'";
const KEYWORD_SELF = "'self'";
const ANY = '*';
/** ASCII whitespace (2.2.1 parse a serialized CSP). */
const WHITESPACE_RE = /[\t\n\f\r ]+/;
/** scheme-source = scheme-part ":" (2.3.1). */
const SCHEME_SOURCE_RE = /^([a-z][a-z0-9+.-]*):$/i;
/**
 * host-source = [ scheme-part "://" ] host-part [ ":" port-part ] [ path-part ]
 * with host-part = "*" / [ "*." ] 1*host-char *( "." 1*host-char ) (2.3.1).
 */
const HOST_SOURCE_RE =
  /^(?:([a-z][a-z0-9+.-]*):\/\/)?(\*|(?:\*\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*)(?::(\*|[0-9]+))?(\/[^?#]*)?$/i;
const IPV4_RE = /^[0-9]+(?:\.[0-9]+){3}$/;
/** Default ports by scheme (Fetch "default port" of a special scheme). */
const DEFAULT_PORTS: Readonly<Record<string, number>> = {
  http: 80,
  https: 443,
  ws: 80,
  wss: 443,
  ftp: 21,
};

/** Splits a serialized source list into its source expressions. */
export function parseSourceList(value: string): readonly string[] {
  return value.split(WHITESPACE_RE).filter((token) => token !== '');
}

/** 2.2.1: directives by lowercased name; the first duplicate wins. */
function parsePolicy(serialized: string): ReadonlyMap<string, string> {
  const directives = new Map<string, string>();
  for (const slot of serialized.split(';')) {
    const trimmed = slot.trim();
    if (trimmed === '') continue;
    const [name = '', ...rest] = trimmed.split(WHITESPACE_RE);
    const lowered = name.toLowerCase();
    if (!directives.has(lowered)) directives.set(lowered, rest.join(' '));
  }
  return directives;
}

function schemeOf(url: URL): string {
  return url.protocol.slice(0, -1);
}

function isHttpScheme(url: URL): boolean {
  return url.protocol === 'http:' || url.protocol === 'https:';
}

/** 6.7.2.9 scheme-part matching; both arguments lowercased on entry. */
function schemePartMatches(a: string, b: string): boolean {
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  return (
    left === right ||
    (left === 'http' && right === 'https') ||
    (left === 'ws' && ['wss', 'http', 'https'].includes(right)) ||
    (left === 'wss' && right === 'https')
  );
}

/** "host is a domain": neither an IPv6 literal nor an IPv4 address. */
function isDomain(host: string): boolean {
  return host !== '' && !host.startsWith('[') && !IPV4_RE.test(host);
}

/** 6.7.2.10 host-part matching. */
function hostPartMatches(pattern: string, host: string): boolean {
  if (!isDomain(host)) return false;
  if (pattern === ANY) return true;
  const lowerHost = host.toLowerCase();
  if (pattern.startsWith('*.')) {
    return lowerHost.endsWith(pattern.slice(1).toLowerCase());
  }
  return pattern.toLowerCase() === lowerHost;
}

/** 6.7.2.11 port-part matching; `input` is null when the source has none. */
function portPartMatches(input: string | null, url: URL): boolean {
  if (input === ANY) return true;
  const normalizedInput = input === null ? null : Number(input);
  const urlPort = url.port === '' ? null : Number(url.port);
  if (normalizedInput === urlPort) return true;
  if (urlPort !== null) return false;
  return normalizedInput === (DEFAULT_PORTS[schemeOf(url)] ?? null);
}

/** Percent-decodes one path piece; an undecodable piece stays literal. */
function decodePiece(piece: string): string {
  try {
    return decodeURIComponent(piece);
  } catch {
    return piece;
  }
}

/** 6.7.2.12 path-part matching of source path `a` against url path `b`. */
function pathPartMatches(a: string, b: string): boolean {
  if (a === '') return true;
  if (a === '/' && b === '') return true;
  const exactMatch = !a.endsWith('/');
  const listA = a.split('/');
  const listB = b.split('/');
  if (listA.length > listB.length) return false;
  if (exactMatch && listA.length !== listB.length) return false;
  if (!exactMatch) listA.pop();
  return listA.every((pieceA, i) => decodePiece(pieceA) === decodePiece(listB[i] ?? ''));
}

/** The `host-source` branch of 6.7.2.8. */
function matchesHostSource(url: URL, parts: RegExpExecArray, origin: URL | undefined): boolean {
  const [, schemePart, hostPart = '', portPart, pathPart = ''] = parts;
  if (schemePart !== undefined) {
    if (!schemePartMatches(schemePart, schemeOf(url))) return false;
  } else if (origin === undefined || !schemePartMatches(schemeOf(origin), schemeOf(url))) {
    return false;
  }
  if (url.hostname === '' || !hostPartMatches(hostPart, url.hostname)) {
    return false;
  }
  if (!portPartMatches(portPart ?? null, url)) return false;
  return pathPart === '' || pathPartMatches(pathPart, url.pathname);
}

/** The `'self'` branch of 6.7.2.8. */
function matchesSelf(url: URL, origin: URL | undefined): boolean {
  if (origin === undefined || url.protocol === 'blob:') return false;
  if (origin.origin !== 'null' && origin.origin === url.origin) return true;
  const secureUpgrade =
    url.protocol === 'https:' ||
    url.protocol === 'wss:' ||
    (origin.protocol === 'http:' && (url.protocol === 'http:' || url.protocol === 'ws:'));
  return url.hostname === origin.hostname && url.port === origin.port && secureUpgrade;
}

/** 6.7.2.8: does `url` match one source expression? */
function matchesExpression(url: URL, expression: string, origin: URL | undefined): boolean {
  if (expression === ANY) {
    return isHttpScheme(url) || origin?.protocol === url.protocol;
  }
  const schemeSource = SCHEME_SOURCE_RE.exec(expression);
  if (schemeSource !== null) {
    return schemePartMatches(schemeSource[1] ?? '', schemeOf(url));
  }
  const hostSource = HOST_SOURCE_RE.exec(expression);
  if (hostSource !== null) return matchesHostSource(url, hostSource, origin);
  if (expression.toLowerCase() === KEYWORD_SELF) {
    return matchesSelf(url, origin);
  }
  return false;
}

/** 6.7.2.7: does `url` match the source list? */
function matchesSourceList(url: URL, sourceList: readonly string[], origin: URL | undefined): boolean {
  if (sourceList.length === 0) return false;
  if (sourceList.length === 1 && sourceList[0]?.toLowerCase() === KEYWORD_NONE) {
    return false;
  }
  return sourceList.some((expression) => matchesExpression(url, expression, origin));
}

/**
 * 6.8.3 + 6.8.4: the first directive of `directive`'s fallback list that the
 * policy carries, as `[name, source list]`; undefined when it carries none.
 */
function governingDirective(
  policy: ReadonlyMap<string, string>,
  directive: string,
): readonly [string, readonly string[]] | undefined {
  const fallbacks = FETCH_DIRECTIVE_FALLBACKS[directive] ?? [];
  for (const name of fallbacks) {
    const value = policy.get(name);
    if (value !== undefined) return [name, parseSourceList(value)];
  }
  return undefined;
}

/**
 * Would every policy allow `url` for the fetch directive `directive`
 * (6.1.2.1 for `connect-src`)? A policy that carries neither the directive
 * nor a fallback allows; otherwise the first directive in the fallback list
 * decides, and the first policy that refuses names the verdict's directive.
 *
 * @param url - absolute url; throws a `TypeError` when it does not parse
 *   (callers validate it first -- an unparsable url is a programmer error).
 * @param pageOrigin - the protected document's serialized origin
 *   (`location.origin`); `"null"` for an opaque origin.
 * @param policies - serialized policies (one `meta` content or one header
 *   value each).
 * @param directive - a key of {@link FETCH_DIRECTIVE_FALLBACKS}.
 */
export function isUrlAllowedByPolicies(
  url: string,
  pageOrigin: string,
  policies: readonly string[],
  directive: string,
): CspVerdict {
  const target = new URL(url);
  const origin = URL.canParse(pageOrigin) ? new URL(pageOrigin) : undefined;
  for (const serialized of policies) {
    const governing = governingDirective(parsePolicy(serialized), directive);
    if (governing === undefined) continue;
    const [name, sourceList] = governing;
    if (!matchesSourceList(target, sourceList, origin)) {
      return { allowed: false, directive: name };
    }
  }
  return { allowed: true };
}

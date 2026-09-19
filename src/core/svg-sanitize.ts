/**
 * SVG sanitizer — strips executable content and external resource references.
 *
 * Design principles:
 *   - Sanitization is orthogonal to fetch authorization. A URL being CSP-allowed
 *     or originating from a "trusted" resolver does not grant trust to its SVG
 *     content. These are independent security layers.
 *   - Pure TypeScript, no DOM dependency (runs in Node and browser alike).
 *   - The { trustSource: true } escape hatch bypasses sanitization for content
 *     that is verified safe at build time (e.g. committed fixtures).
 *
 * What is stripped:
 *   - <script> elements and their content
 *   - <foreignObject> elements and their content
 *   - on* event handler attributes (onclick, onerror, onmouseover, etc.)
 *   - javascript:, vbscript:, and data: URIs in href/src/action attributes
 *   - External http/https URLs in href and xlink:href attributes
 *     (internal #fragment references are preserved)
 */

export interface SanitizeSvgOptions {
  /**
   * When true, bypass all sanitization.
   * Use only for build-time-verified, committed SVG content.
   * Cannot be set silently by other configuration — callers must opt in explicitly.
   */
  trustSource?: boolean;
}

// <script> open+content+close, case-insensitive, handles newlines in content.
// The close tag accepts any junk before `>` (`</script\t\n bar>` is still a
// close tag to an HTML parser) -- CodeQL js/bad-tag-filter.
const SCRIPT_ELEMENT_RE = /<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi;
// <script .../> self-closing (unusual but valid XML). `[^>]*`, not `[^/]*`:
// an attribute value may itself contain a slash (`src="a/b.js"`).
const SCRIPT_SELF_CLOSE_RE = /<script\b[^>]*\/>/gi;

// <foreignObject> open+content+close
const FOREIGN_OBJECT_RE = /<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject\b[^>]*>/gi;
const FOREIGN_OBJECT_SELF_CLOSE_RE = /<foreignObject\b[^>]*\/>/gi;

// on* event handler attributes: onerror="...", onclick='...', onfoo=bare
const EVENT_HANDLER_RE = /\s+on[a-zA-Z]\w*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;

// Dangerous protocol URIs in href / xlink:href / src / action
const DANGEROUS_URI_RE =
  /(?:href|xlink:href|src|action)\s*=\s*(?:"(?:javascript|vbscript|data):[^"]*"|'(?:javascript|vbscript|data):[^']*')/gi;

// External absolute URLs in href and xlink:href (http/https or protocol-relative)
// Preserves #fragment, relative, and root-relative paths.
const EXTERNAL_HREF_RE = /(?:href|xlink:href)\s*=\s*(?:"(?:https?:)?\/\/[^"]*"|'(?:https?:)?\/\/[^']*')/gi;

/**
 * Sanitize an SVG string, removing content that could execute code or
 * load external resources when the SVG is inlined into a document.
 *
 * @param svg     SVG source string from an external resolver.
 * @param options Options object. Pass `{ trustSource: true }` to skip sanitization.
 */
export function sanitizeSvg(svg: string, options: SanitizeSvgOptions = {}): string {
  if (options.trustSource === true) return svg;

  let result = svg;
  for (const re of STRIP_PASSES) result = stripUntilStable(result, re);
  return result;
}

/** Every pattern the sanitizer strips, in application order. */
const STRIP_PASSES: readonly RegExp[] = [
  SCRIPT_ELEMENT_RE,
  SCRIPT_SELF_CLOSE_RE,
  FOREIGN_OBJECT_RE,
  FOREIGN_OBJECT_SELF_CLOSE_RE,
  EVENT_HANDLER_RE,
  DANGEROUS_URI_RE,
  EXTERNAL_HREF_RE,
];

/**
 * Remove every match of `re`, repeating until a pass changes nothing.
 *
 * One pass is not enough: removing `<script>x</script>` from
 * `<scr<script>x</script>ipt>` reassembles a fresh `<script>` from the
 * halves around it (CodeQL js/incomplete-multi-character-sanitization).
 * Each pass either shrinks the string or terminates, so this is bounded.
 */
function stripUntilStable(input: string, re: RegExp): string {
  let prev: string;
  let cur = input;
  do {
    prev = cur;
    cur = cur.replace(re, '');
  } while (cur !== prev);
  return cur;
}

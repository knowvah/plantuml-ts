/**
 * The link-filtering half of upstream's `SecurityUtils`.
 *
 * Upstream reads its one input, `PLANTUML_ALLOW_JAVASCRIPT_IN_LINK`, from the
 * process environment on every call (`SecurityUtils.java:197-200`). `src/`
 * cannot read `process.env`, so the value arrives as
 * `RenderOptions.allowJavascriptInLink` and is installed for the duration of
 * one synchronous SVG emission by {@link withAllowJavascriptInLink}.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/security/SecurityUtils.java
 */

/**
 * Whether `javascript:` links are emitted as written. Upstream default: false
 * (the env var is unset).
 *
 * Concurrency contract: module-level, but only ever changed inside
 * {@link withAllowJavascriptInLink}'s synchronous try/finally, and SVG
 * emission (`plugin.render` through `assembleSvg`) never awaits -- so two
 * renders cannot interleave between the set and the restore.
 */
let allowJavascript = false;

/** @see ~/git/plantuml/.../security/SecurityUtils.java:193-195 */
function isJavascriptLink(url: string): boolean {
  return url
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .startsWith('javascript');
}

/** @see ~/git/plantuml/.../security/SecurityUtils.java:197-200 */
function allowJavascriptInLink(): boolean {
  return allowJavascript;
}

/**
 * True when `url` must not be emitted as a link target: a `javascript:` url
 * while the opt-in is off. The caller (`svg.ts#linkWrap`, upstream's
 * `SvgGraphics.LinkData` constructor) then emits `""` in its place.
 * @see ~/git/plantuml/.../security/SecurityUtils.java:88-94
 */
export function ignoreThisLink(url: string): boolean {
  if (!allowJavascriptInLink() && isJavascriptLink(url)) return true;
  return false;
}

/**
 * Run `emit` (a synchronous SVG emission) with the javascript-link opt-in set
 * to `allow`, restoring the previous value afterwards.
 */
export function withAllowJavascriptInLink<T>(allow: boolean, emit: () => T): T {
  const previous = allowJavascript;
  allowJavascript = allow;
  try {
    return emit();
  } finally {
    allowJavascript = previous;
  }
}

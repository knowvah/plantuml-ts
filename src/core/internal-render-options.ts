import type { Clock } from './clock.js';
import type { RenderOptions } from './render-options.js';

/**
 * Render options the library's own conformance tooling passes alongside the
 * public {@link RenderOptions}. Deliberately NOT re-exported from
 * `src/index.ts` and not a field of `RenderOptions`: the published `.d.ts` is
 * unchanged (lengthadjust-document-wide D9, decisions.md Amendment 1).
 */
export interface InternalRenderOptions extends RenderOptions {
  /**
   * Apply each plugin's `styleInput` -- the jar-compatible normalisation that
   * drops the styling input the jar's `StyleExtractor` path ignores for
   * json/yaml/hcl/files (`StyleExtractor.java:88-96`). Unset (the library
   * default) honours that input as a documented port extension (user ruling
   * 2026-10-23).
   */
  readonly jarCompatibleStyleInput?: boolean;
  /**
   * The injected clock for TIM `%now`/`%date` and gantt's `today` (gantt-engine-port
   * D3). Unset: `%now`/`%date` behave exactly as before the seam (instant 0, host
   * zone for a zone-less `%date`); gantt uses `DEFAULT_CLOCK`. Conformance sets the
   * jar's recorded capture clock (`oracle/capture-clock.json`).
   */
  readonly clock?: Clock;
}

/** True when `options` asks for the jar-compatible style-input normalisation. */
export function isJarCompatibleStyleInput(options: RenderOptions | undefined): boolean {
  return (options as InternalRenderOptions | undefined)?.jarCompatibleStyleInput === true;
}

/** `options` with the jar-compatible style-input normalisation switched on (conformance renders). */
export function withJarCompatibleStyleInput(options: RenderOptions = {}): InternalRenderOptions {
  return { ...options, jarCompatibleStyleInput: true };
}

/** The explicitly injected clock, or `undefined` when the render was given none. */
export function clockOfOptions(options: RenderOptions | undefined): Clock | undefined {
  return (options as InternalRenderOptions | undefined)?.clock;
}

/** `options` with the injected `clock` (conformance renders of clock-dependent sources). */
export function withClock(options: RenderOptions, clock: Clock | undefined): InternalRenderOptions {
  return clock === undefined ? options : { ...options, clock };
}

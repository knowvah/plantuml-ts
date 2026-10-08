/**
 * `skin <name>` directive resolution — skin-file-loading mission, Batch 1
 * (decisions D1/D2/D6); unwind2-S8.
 *
 * Upstream's `skin <name>` makes `<name>.skin` the diagram's whole style
 * sheet (`TitledDiagram.java:159-182`, `SkinParam.java:183-197`): it is
 * loaded FIRST, so every one of its values carries a lower declaration
 * counter than any of the document's own `skinparam`/`<style>` lines
 * (`StyleBuilder#getNextInt`, `StyleBuilder.java:119-122`). This port's
 * theme is a flat cascade over `plantuml.skin` (D2), so the skin is applied
 * as the cascade's first `<style>` runs, ahead of the document's, through
 * the same machinery an inline `<style>` block uses: `parseStyleBlock` +
 * `resolveSkinparam` (for the flat `root` layer) + `applyStyleMap` (for
 * every other selector).
 *
 * A skin is cut into runs at each top-level `root` selector. Every bundled
 * sheet writes a `root` before its element selectors, and a second `root`
 * (`sonyxperiadev.skin`'s "specifics" section) comes after them: its colours
 * must beat those earlier element values, as their counters do upstream
 * (`Style.java:121-134`). `style-root-shadowing.ts` implements that rule per
 * run, assuming a run's `root` precedes its own element selectors -- which
 * the cut guarantees.
 *
 * A skin the jar cannot load never reaches this file: `skin-command.ts`
 * turns it into upstream's command error first. An absent name is only
 * possible for a hand-built `PreprocessorResult` (or `skin plantuml`, which
 * IS the baked-in default), where there are no runs.
 */
import type { PreprocessorResult } from './preprocessor.js';
import type { Theme } from './theme.js';
import { resolveSkinparam, parseStyleBlock } from './skinparam.js';
import type { StyleMap } from './skinparam.js';
import { regularSchemeOf } from './skinparam-style-block.js';
import { applyStyleMap } from './style-map-theme.js';
import { BUILTIN_SKINS } from './skins-builtin.js';

/** A top-level `root` selector opening: `root {`. */
const RE_ROOT_OPEN = /^root\s*\{/u;

/** Net brace depth change of one line. */
function depthDelta(line: string): number {
  let delta = 0;
  for (const ch of line) {
    if (ch === '{') delta++;
    else if (ch === '}') delta--;
  }
  return delta;
}

/** `text` split before every top-level `root {` that is not its first line. */
function splitAtRootBlocks(text: string): string[] {
  const runs: string[][] = [[]];
  let depth = 0;
  let inComment = false;
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!inComment && depth === 0 && RE_ROOT_OPEN.test(trimmed) && runs.at(-1)!.length > 0) runs.push([]);
    runs.at(-1)!.push(line);
    if (inComment || trimmed.startsWith('/*')) inComment = !trimmed.includes('*/');
    else depth += depthDelta(line);
  }
  return runs.map((run) => run.join('\n'));
}

/**
 * The skin's `<style>` runs, in declaration order -- none when the
 * directive is absent or names no embedded sheet. Only the REGULAR scheme
 * counts (`regularSchemeOf`): a run after `@media` is dark-mode only.
 */
export function skinRunsOf(preprocessed: Pick<PreprocessorResult, 'skin'>): StyleMap[] {
  const name = preprocessed.skin;
  if (name === undefined || !Object.hasOwn(BUILTIN_SKINS, name)) return [];
  return splitAtRootBlocks(regularSchemeOf(BUILTIN_SKINS[name]!)).map(parseStyleBlock);
}

/**
 * One skin run onto `base`: its `root` declarations through
 * `resolveSkinparam` (Stage 3b's flat layer) -- with `rootCascade`, the
 * skinparams its root colours ARE (`build-theme.ts#rootCascadeSkinparams`),
 * on top -- then every other selector through `applyStyleMap`, including the
 * bare "element" universal-fallback selector it reads for Shadowing (D3).
 */
export function applySkinRun(
  base: Theme,
  styleMap: StyleMap,
  rootCascade: ReadonlyMap<string, string> = new Map(),
): Theme {
  const rootDeclarations = new Map([...(styleMap.get('root') ?? []), ...rootCascade]);
  return applyStyleMap(styleMap, resolveSkinparam(rootDeclarations, base).theme);
}

/** Every run of `preprocessed.skin` onto `base`, in order. */
export function applySkinLayer(preprocessed: Pick<PreprocessorResult, 'skin'>, base: Theme): Theme {
  return skinRunsOf(preprocessed).reduce((theme, run) => applySkinRun(theme, run), base);
}

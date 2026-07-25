/**
 * `skin <name>` directive resolution — skin-file-loading mission, Batches 1
 * (decisions D1/D2/D6) and 4 (preprocessor+skinparam skins).
 *
 * Applies an embedded skin ({@link BUILTIN_SKINS}) as the theme cascade's
 * BASE layer, between `resolveTheme` and the document's OWN
 * `skinparam`/inline `<style>` application (D6) -- a diagram combining
 * `skin rose` with an explicit `skinparam BackgroundColor` still lets the
 * document's own skinparam win, because the caller applies this BEFORE
 * Stage 2/3 of its own cascade, not after.
 *
 * The 5 bundled skins split into TWO grammars (D1), each routed to the
 * SAME machinery an inline document already uses for that grammar -- no new
 * parser either way:
 *
 *  - **`<style>`-grammar** (`rose`/`debug`/`strictuml`, Batch 1): `root {
 *    ... }` / `element { Shadowing 4.0 }` -- `parseStyleBlock` +
 *    `resolveSkinparam` (for the flat `root` layer) + `applyStyleMap` (for
 *    every other selector), mirroring an inline `<style>` block's Stage
 *    3b/3c in `src/index.ts#buildTheme`.
 *  - **Preprocessor+skinparam grammar** (`reddress`/`sonyxperiadev`, Batch
 *    4): `!ifndef`/`!define`/`!ifdef` macros and/or bare `skinparam` lines,
 *    NOT `<style>` blocks -- `preprocess()` (the SAME TIM interpreter a
 *    document's own `!include`d content goes through) expands the macros
 *    and collects the resulting `skinparam` lines, then `resolveSkinparam`
 *    applies them directly (no `applyStyleMap` step -- neither skin uses a
 *    `<style>`-block selector).
 *
 * Unknown skin names are simply absent from {@link BUILTIN_SKINS}, so
 * lookup fails and this is a no-op — matching the pre-existing lenient
 * behavior (a `skin` directive this port can't resolve renders unaffected,
 * never throws).
 */
import type { PreprocessorResult } from './preprocessor.js';
import { preprocess } from './preprocessor.js';
import type { Theme } from './theme.js';
import { resolveSkinparam, parseStyleBlock } from './skinparam.js';
import { applyStyleMap } from './style-map-theme.js';
import { BUILTIN_SKINS } from './skins-builtin.js';

/**
 * A skin whose text opens with a TIM preprocessor directive (`!ifndef`,
 * `!define`, ...) or a bare `skinparam`/`SkinParam` line is the
 * preprocessor+skinparam grammar family (D1, Batch 4) -- feeding it to
 * `parseStyleBlock` would silently mis-parse it (a leading `!` line yields
 * a bogus one-selector map; bare `SkinParam X Y` lines with no `{ }` at all
 * yield an EMPTY map, since `parseStyleBlock`'s grammar is entirely
 * selector-block based). `rose`/`debug`/`strictuml` always open with an
 * identifier immediately followed by `{` (`root {`, `element {`), so this
 * check never misclassifies them.
 */
const RE_PREPROCESSOR_SKIN_START = /^\s*(!|skinparam\s)/i;

function isPreprocessorGrammarSkin(text: string): boolean {
  return RE_PREPROCESSOR_SKIN_START.test(text);
}

/**
 * `sonyxperiadev.skin` is embedded VERBATIM (D2) with its upstream
 * capitalization, `SkinParam ...` -- but `preprocess()`'s line collector
 * (`preprocessor.ts`'s `RE_SKINPARAM_LINE` family) matches the literal
 * lowercase keyword `skinparam` only, case-sensitively (every OTHER bundled
 * skin and the wider corpus spell it lowercase, so this has never been a
 * gap before). Rather than loosen that shared regex -- which every OTHER
 * document in the corpus also flows through, a blast-radius this batch's
 * write-set does not cover -- normalize ONLY this isolated in-memory copy
 * of the skin text before feeding it to `preprocess()`. The embedded
 * constant in `skins-builtin.ts` is untouched (still verbatim upstream
 * text); this is a read-time transform local to the loader.
 */
const RE_SKINPARAM_KEYWORD_CASE = /^(\s*)skinparam(?=\s)/gim;

function normalizeSkinparamKeywordCase(text: string): string {
  return text.replace(RE_SKINPARAM_KEYWORD_CASE, (_m, indent: string) => `${indent}skinparam`);
}

/**
 * `reddress.skin`'s `!ifdef DARKBLUE`/`LIGHTBLUE`/... branches only resolve
 * to the user's intended accent when the user's OWN document already
 * declared that flag via a bare `!define DARKBLUE` (no value -- the
 * documented usage: `!define DARKBLUE` then `skin reddress`) BEFORE the
 * `skin` line. `preprocess()`'s own TIM interpreter runs the skin text in a
 * FRESH, isolated pass (its own `TMemoryGlobal`) -- it has no visibility
 * into the document's interpreter state. Rather than thread real TIM
 * function/variable objects across two separate `TContext` runs (a much
 * larger mechanism, out of this batch's write-set), this extracts just the
 * NAMES of the document's own bare `!define NAME` directives (no value --
 * exactly the boolean-flag convention `reddress.skin` itself uses) from the
 * document's raw, pre-preprocessing source lines, and seeds them as plain
 * TIM variables (`preprocess`'s existing `defines` param) in the skin's own
 * pass. `EaterIfdef#isTrue` only checks existence (`memory.getVariable(...)
 * !== undefined`), so a placeholder value is sufficient -- this does NOT
 * attempt to thread `!define NAME value` macro BODIES (e.g. a document
 * overriding reddress's own `FONTNAME`/`FONTSIZE` `!ifndef` defaults),
 * which is a materially larger mechanism (function-object threading, not a
 * name/value map) with no fixture in this batch that needs it.
 */
const RE_BARE_DEFINE = /^\s*!define\s+([A-Za-z_]\w*)\s*$/;

function extractBareDefines(rawSourceLines: readonly string[]): ReadonlyMap<string, string> {
  const defines = new Map<string, string>();
  for (const line of rawSourceLines) {
    const m = RE_BARE_DEFINE.exec(line);
    if (m !== null) defines.set(m[1]!, '');
  }
  return defines;
}

/**
 * Resolve `preprocessed.skin` (the `skin <name>` directive, case-
 * insensitive per upstream's `SkinLoader`/`CommandSkin` — already
 * lowercased by `preprocessor.ts`'s own collector) onto `base`. Returns
 * `base` unchanged when the name is absent or unrecognized.
 *
 * `documentRawSourceLines` (optional, Batch 4): the document's OWN raw
 * lines BEFORE preprocessing (`BlockUmlOk.rawSource`, mapped to plain
 * strings) -- used only by the preprocessor-grammar path to thread bare
 * `!define NAME` flags (see {@link extractBareDefines}'s doc comment).
 * Omitted callers (or `<style>`-grammar skins, which never consult it) are
 * unaffected -- additive, optional, no behavior change for Batch 1 callers.
 */
export function applySkinLayer(
  preprocessed: Pick<PreprocessorResult, 'skin'>,
  base: Theme,
  documentRawSourceLines?: readonly string[],
): Theme {
  const name = preprocessed.skin;
  if (name === undefined) return base;

  const text = BUILTIN_SKINS[name];
  if (text === undefined) return base;

  if (isPreprocessorGrammarSkin(text)) {
    const documentDefines =
      documentRawSourceLines === undefined ? undefined : extractBareDefines(documentRawSourceLines);
    const normalized = normalizeSkinparamKeywordCase(text);
    const result = preprocess(normalized, documentDefines);
    return resolveSkinparam(result.skinparam, base).theme;
  }

  const skinStyleMap = parseStyleBlock(text);

  // `root { ... }` -- mirrors Stage 3b's flat "" bare-declarations layer.
  const rootDeclarations = skinStyleMap.get('root') ?? new Map<string, string>();
  const withRoot = resolveSkinparam(rootDeclarations, base).theme;

  // Every other selector -- mirrors Stage 3c, including the bare
  // "element" universal-fallback selector applyStyleMap now reads for
  // Shadowing (D3).
  return applyStyleMap(skinStyleMap, withRoot);
}

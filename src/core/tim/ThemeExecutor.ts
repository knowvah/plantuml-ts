/**
 * `TContext#executeTheme` and the state upstream's `TContext` keeps for it
 * (`themeMetadata`), plus the name `preprocess()` surfaces as
 * `PreprocessorResult.theme`.
 *
 * Extracted from `TContext` for this repo's 500-line file cap -- the same
 * split `IncludeExecutor.ts` is for the include directives.
 *
 * Upstream executes the theme's lines IN PLACE, in the current context and
 * memory (`TContext.java:737-743`):
 *
 *     final StringLocated sl = theme.readLine();
 *     if (sl == null) {
 *         executeLines(memory, body, null, false);
 *
 * so the theme's variables, procedures and functions are visible to every
 * later line, and its skinparam / `<style>` output lands at the `!theme` line's
 * position -- BEFORE the document's later lines, which therefore win. The port
 * does the same: the theme's lines go to the result list like any others, and
 * `preprocessor.ts#resultOf` collects the styling from that list in order
 * (cdd4-T7b retired the interim withholding T7a introduced).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/TContext.java#executeTheme
 */

import type { JsonValue } from './expression/Token.js';

/** `TContext#themeMetadata`: the executed theme's YAML header (upstream's `JsonObject`). */
export type ThemeMetadata = Readonly<Record<string, JsonValue>>;
import { EaterTheme } from './EaterTheme.js';
import type { IncludeStore } from './IncludeStore.js';
import type { StringLocated } from './StringLocated.js';
import type { TContext } from './TContext.js';
import type { TMemory } from './TMemory.js';

export class ThemeExecutor {
  private readonly store: IncludeStore | undefined;

  /** > 0 while a theme's lines execute (a theme may `!theme` another). */
  private depth = 0;

  private themeName: string | undefined;

  /** @see ~/git/plantuml/.../tim/TContext.java#themeMetadata */
  private themeMetadata: Readonly<Record<string, string>> = {};

  constructor(store: IncludeStore | undefined) {
    this.store = store;
  }

  /**
   * `TContext.java:726-755`. Upstream's `theme == null` -> `No such theme`
   * branch is unreachable (`EaterTheme#getTheme` throws `Cannot load theme`
   * first) and so is not ported; neither is the `pathSystem` swap, which
   * installs `eater.getNewImportedFiles()` -- the very `pathSystem` it was
   * handed (`EaterTheme.java:95-97`).
   * @throws EaterException `Cannot load theme ...` when no source resolves.
   */
  executeTheme(context: TContext, memory: TMemory, s: StringLocated): void {
    const eater = new EaterTheme(s.getTrimmed(), this.store);
    eater.analyze(context, memory);
    const theme = eater.getTheme();
    // The DOCUMENT's theme only: a theme that itself says `!theme` (C4_united
    // -> united) must not re-point the residual summary lookup
    // (`theme.ts#resolveTheme` -- the fields executed state does not reach yet).
    if (this.depth === 0) this.themeName = eater.getRealName();

    this.depth++;
    try {
      context.executeLines(memory, theme.lines, undefined, false);
    } finally {
      this.depth--;
      this.themeMetadata = theme.metadata;
    }
  }

  /** The last document-level `!theme` name, if any. */
  getThemeName(): string | undefined {
    return this.themeName;
  }

  /** @see ~/git/plantuml/.../tim/TContext.java#getThemeMetadata */
  getThemeMetadata(): ThemeMetadata {
    return this.themeMetadata;
  }
}

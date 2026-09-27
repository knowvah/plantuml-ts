/**
 * `%get_current_theme()` -- JSON object describing the active theme: the YAML
 * header of the last `!theme` executed, read off the context as upstream
 * reads it (`GetCurrentTheme.java:65`, `context.getThemeMetadata()`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/builtin/GetCurrentTheme.java
 */

import { TValue } from '../expression/TValue.js';
import type { TContext } from '../TFunction.js';
import type { ThemeMetadata } from '../ThemeExecutor.js';
import { TFunctionSignature } from '../TFunctionSignature.js';
import { SimpleReturnFunction } from './SimpleReturnFunction.js';

const SIGNATURE = new TFunctionSignature('%get_current_theme', 0);

/** @see ~/git/plantuml/.../tim/TContext.java#getThemeMetadata */
interface WithThemeMetadata extends TContext {
  getThemeMetadata(): ThemeMetadata;
}

export class GetCurrentTheme extends SimpleReturnFunction {
  getSignature(): TFunctionSignature {
    return SIGNATURE;
  }

  canCover(nbArg: number, _namedArguments: ReadonlySet<string>): boolean {
    return nbArg === 0;
  }

  executeReturnFunction(
    context: TContext,
    _memory: unknown,
    _location: unknown,
    _values: readonly TValue[],
    _named: ReadonlyMap<string, TValue>,
  ): TValue {
    // The package's stand-in narrowing (`context-ext.ts`): the real `TContext`
    // carries `getThemeMetadata`; the shared interface omits it.
    return TValue.fromJson((context as WithThemeMetadata).getThemeMetadata());
  }
}

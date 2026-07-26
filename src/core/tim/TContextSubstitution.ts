/**
 * The inline `%function(...)` / `$variable` substitution engine used by
 * `TContext#applyFunctionsAndVariables`. Split out of `TContext.ts` (this
 * repo's `check-complexity.py` 500-line file cap) as a MECHANICAL extraction
 * only -- no behavior change. `TContext` still owns all mutable state
 * (`functionsSet`, `pendingAdd`, `resultList`); these free functions take it
 * as a narrow `host` parameter instead of closing over `this`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/TContext.java#applyFunctionsAndVariables
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/TContext.java#getFunctionNameAt
 */

import { EaterException } from './EaterException.js';
import { EaterFunctionCall } from './EaterFunctionCall.js';
import type { FunctionsSet } from './FunctionsSet.js';
import { StringLocated } from './StringLocated.js';
import type { TContext as TContextInterface, TFunction } from './TFunction.js';
import { TFunctionSignature } from './TFunctionSignature.js';
import { TFunctionType } from './TFunctionType.js';
import { isLetterOrEmojiOrUnderscoreOrDigit } from './TLineType.js';
import type { TMemory } from './TMemory.js';
import { VariableManager } from './VariableManager.js';

/**
 * The subset of `TContext` this engine needs beyond the public `TContext`
 * interface (`TFunction.ts`) -- the parts that stayed instance state on the
 * real class rather than moving here.
 */
export interface TContextSubstitutionHost extends TContextInterface {
  readonly functionsSet: FunctionsSet;
  isLegacyDefine(functionName: string): boolean;
  isUnquoted(functionName: string): boolean;
  setPendingAdd(value: string | undefined): void;
  appendToLastResult(remaining: string): void;
}

/**
 * Inline substitution of every `%function(...)` call and `$variable` in one
 * line. Returns `undefined` when the line contained a PROCEDURE (or
 * LEGACY_DEFINELONG) call: that call already appended its own output lines to
 * `resultList`, so nothing is left to emit for this line. Text BEFORE the
 * call is stashed in `pendingAdd` (the next `addPlain` prepends it); text
 * AFTER it is appended to the last produced line.
 * @throws EaterException (thrown, not returned) on evaluation failure.
 * @see ~/git/plantuml/.../tim/TContext.java#applyFunctionsAndVariables
 */
export function applyFunctionsAndVariablesImpl(
  host: TContextSubstitutionHost,
  memory: TMemory,
  str: StringLocated,
): string | undefined {
  if (memory.isEmpty() && host.functionsSet.size() === 0) return str.getString();

  const result = { value: '' };
  for (let i = 0; i < str.length(); i++) {
    const presentFunction = getFunctionNameAt(host.functionsSet, str.getString(), i);
    if (presentFunction !== undefined) {
      const consumed = applyOneFunction(host, memory, str, i, presentFunction, result);
      if (consumed === undefined) return undefined;

      i = consumed;
    } else if (new VariableManager(host, memory, str).getVarnameAt(str.getString(), i) !== undefined) {
      i = new VariableManager(host, memory, str).replaceVariables(str.getString(), i, result);
    } else {
      result.value += str.charAt(i);
    }
  }
  return result.value;
}

/**
 * One call site inside `applyFunctionsAndVariablesImpl`. Returns the new
 * cursor position, or `undefined` when the call consumed the rest of the line
 * (a PROCEDURE / LEGACY_DEFINELONG call -- see that function's contract).
 */
function applyOneFunction(
  host: TContextSubstitutionHost,
  memory: TMemory,
  str: StringLocated,
  i: number,
  presentFunction: string,
  result: { value: string },
): number | undefined {
  const sub = str.getString().substring(i);
  const call = new EaterFunctionCall(
    new StringLocated(sub, str.getLocation()),
    host.isLegacyDefine(presentFunction),
    host.isUnquoted(presentFunction),
  );
  call.analyze(host, memory);
  const signature = new TFunctionSignature(
    presentFunction,
    call.getValues().length,
    new Set(call.getNamedArguments().keys()),
  );
  const func = host.functionsSet.getFunctionSmart(signature);
  // SI6: a call to a KNOWN function name that no overload can cover is an
  // error, exactly as upstream has it -- the jar renders `Function not found
  // BOLD` (live-oracle verified on `!define BOLD(x)` called as `BOLD(x,y)`).
  // This used to pass the call site through as literal text, because the
  // throw had nowhere to land; `preprocessOrError` now captures it and
  // `renderSync` draws the error diagram, so the divergence is retired.
  if (func === undefined) throw new EaterException(`Function not found ${presentFunction}`, str);

  if (func.getFunctionType() === TFunctionType.PROCEDURE) {
    host.setPendingAdd(result.value);
    executeVoid3(host, str, memory, func, call);
    const remaining = str.getString().substring(i + call.getCurrentPosition());
    if (remaining.length > 0) host.appendToLastResult(remaining);

    return undefined;
  }
  if (func.getFunctionType() === TFunctionType.LEGACY_DEFINELONG) {
    host.setPendingAdd(str.getString().substring(0, i));
    executeVoid3(host, str, memory, func, call);
    return undefined;
  }

  const functionReturn = func.executeReturnFunction(host, memory, str, call.getValues(), call.getNamedArguments());
  result.value += functionReturn.toString();
  // #lizard forgives -- mechanical extraction of TContext.java#applyOneFunction
  // (via the pre-split TContext.ts), unchanged logic; the extra `host` param
  // (vs. upstream's implicit `this`) is what pushes the arg count over the cap.
  return i + call.getCurrentPosition() - 1;
}

/** @see ~/git/plantuml/.../tim/TContext.java#executeVoid3 */
function executeVoid3(
  host: TContextSubstitutionHost,
  location: StringLocated,
  memory: TMemory,
  func: TFunction,
  call: EaterFunctionCall,
): void {
  func.executeProcedureInternal(host, memory, location, call.getValues(), call.getNamedArguments());
}

/** Java `null` -> `undefined`. @see ~/git/plantuml/.../tim/TContext.java#getFunctionNameAt */
export function getFunctionNameAt(functionsSet: FunctionsSet, s: string, pos: number): string | undefined {
  const justAfterALetter =
    pos > 0 && isLetterOrEmojiOrUnderscoreOrDigit(s.charAt(pos - 1)) && !VariableManager.justAfterBackslashN(s, pos);
  if (justAfterALetter && s.charAt(pos) !== '%' && s.charAt(pos) !== '$') return undefined;

  const fname = functionsSet.getLonguestMatchStartingIn(s, pos);
  if (fname.length === 0) return undefined;

  return fname.substring(0, fname.length - 1);
}

import type { TextBlock } from '../klimt/shape/TextBlock.js';
import type { SymbolContext } from '../decoration/symbol/SymbolContext.js';
import { ActorStickMan } from './ActorStickMan.js';
import { ActorAwesome } from './ActorAwesome.js';
import { ActorHollow } from './ActorHollow.js';

/**
 * ActorStyle — the actor-drawing-style selector `USymbolActor`'s
 * constructor takes and `USymbolActorBusiness` hardcodes to
 * `STICKMAN_BUSINESS`.
 *
 * Upstream: skin/ActorStyle.java — a 4-value enum (`STICKMAN`,
 * `STICKMAN_BUSINESS`, `AWESOME`, `HOLLOW`) with `toUSymbol()` (dispatches
 * to a `USymbols.ACTOR_*` registry constant) and `getTextBlock(Fashion)`
 * (dispatches to `ActorStickMan`/`ActorAwesome`/`ActorHollow`).
 *
 * As-const object, not a TS `enum` (project convention — see
 * `HorizontalAlignment.ts`).
 *
 * Reachability finding (T9, verified against `USymbols.java:98-120,163-
 * 165` and this port's `skinparam.ts`): `actor`'s USymbol resolves via
 * `skinParam.actorStyle().toUSymbol()`, defaulting to `ActorStyle
 * .STICKMAN` — `HOLLOW`/`AWESOME` are reachable ONLY when a user sets
 * `skinparam actorStyle Hollow|Awesome`. T7 (description-leaf-sizing-audit)
 * ported `ActorHollow.ts`/`ActorAwesome.ts` and wired the `skinparam
 * actorStyle`/`Theme.actorStyle` accessor (`SkinParam.java:1209-1218`'s
 * `getValue("actorstyle")` case-insensitive `awesome`/`hollow`, else
 * `STICKMAN` — this port's `theme.ts`/`skinparam-key-handlers.ts`), so all
 * four `ActorStyle` values are now reachable and `getTextBlock` below
 * dispatches to all four without throwing.
 *
 * `toUSymbol()` (deferred, reported): requires the `USymbols` registry
 * class, which is not part of this port (no `USymbols.ts` file exists —
 * see `USymbol.ts`'s own doc comment on this scope reduction). No caller
 * in this task's write-set needs it; `USymbolActor`'s constructor takes
 * an `ActorStyle` value directly, never round-trips through
 * `toUSymbol()`.
 */
export const ActorStyle = {
  STICKMAN: 'STICKMAN',
  STICKMAN_BUSINESS: 'STICKMAN_BUSINESS',
  AWESOME: 'AWESOME',
  HOLLOW: 'HOLLOW',
} as const;
export type ActorStyle = (typeof ActorStyle)[keyof typeof ActorStyle];

/**
 * `ActorStyle#getTextBlock(Fashion)` — a free function here since TS
 * cannot attach instance methods to an as-const string-union "enum".
 */
export function actorStyleGetTextBlock(style: ActorStyle, symbolContext: SymbolContext): TextBlock {
  if (style === ActorStyle.STICKMAN) return new ActorStickMan(symbolContext, false);
  if (style === ActorStyle.STICKMAN_BUSINESS) return new ActorStickMan(symbolContext, true);
  if (style === ActorStyle.AWESOME) return new ActorAwesome(symbolContext);
  if (style === ActorStyle.HOLLOW) return new ActorHollow(symbolContext);
  throw new Error(`ActorStyle.getTextBlock: unhandled ActorStyle ${style as string}`);
}

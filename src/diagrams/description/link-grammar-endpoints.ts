/**
 * Endpoint shape classification (`CommandLinkElement.getDummy`) -- split
 * out of `link-grammar.ts` purely to keep that file under this project's
 * 500-line cap. Self-contained (its own regexes, no dependency on the
 * rest of that file's link-assembly logic beyond `cleanId`), so it moves
 * as one cohesive unit; `link-grammar.ts` re-exports both public symbols
 * so `from './link-grammar.js'` is unchanged for existing consumers
 * (`command-table-helpers.ts`, `parse-state.ts`, `element-grammar-
 * nosymbol.ts`). `EndpointPair`/`resolveEndpoints` stay behind in
 * `link-grammar.ts` (they call this function but are otherwise plain
 * inversion bookkeeping local to the link-assembly pipeline). Pure move,
 * zero behavior change.
 */

import type { USymbol } from '../../core/descriptive-keywords.js';
import { cleanId } from './parse-helpers.js';

const RE_EP_BRACKET = /^\[([^\]]+)\]$/;
const RE_EP_IFACE = /^\(\)/;
const RE_EP_USECASE = /^\([^)]+\)\/?$/;
const RE_EP_ACTOR = /^:[^:]+:\/?$/;
const RE_EP_QUOTED = /^"[^"]+"$/;

export interface EndpointShape {
  id: string;
  symbol: USymbol;
  /** Bare/quoted identifier — upstream LeafType.STILL_UNKNOWN. Resolved at
   *  the end of parseDescription per DescriptionDiagram.makeDiagramReady:
   *  actor when the diagram has any usecase/actor leaf, else interface. */
  stillUnknown?: true;
}

/**
 * CommandLinkElement.getDummy(): `()x` → interface, `(x)`/`(x)/` → usecase /
 * business usecase, `:x:`/`:x:/` → actor / business actor, `[x]` → component.
 * A bare or quoted identifier is upstream `LeafType.STILL_UNKNOWN` (no
 * USymbol) — flagged stillUnknown and resolved at the end of the parse
 * (DescriptionDiagram.makeDiagramReady:81-88: actor if isUsecase(), else
 * INTERFACE — which then gets the shielded plaintext svek shape).
 *
 * The id is always `cleanId(token)` (getDummy:347,358 — every branch cleans
 * the raw ident before creating/looking up the quark), the same normalizer a
 * plain keyword declaration's CODE goes through
 * (CommandCreateElementFull.executeArg:302 via parseNameSection). Symbol
 * classification is a separate, RAW-token character sniff (getDummy's
 * `codeChar`) that runs *before* cleaning — a declaration and a link endpoint
 * for the same notation therefore always resolve to the identical id.
 */
export function classifyEndpointShape(token: string): EndpointShape {
  const t = token.trim();
  if (RE_EP_BRACKET.test(t)) return { id: cleanId(t), symbol: 'component' };
  if (RE_EP_IFACE.test(t)) return { id: cleanId(t), symbol: 'interface' };
  if (RE_EP_USECASE.test(t)) {
    return { id: cleanId(t), symbol: t.endsWith('/') ? 'usecase-business' : 'usecase' };
  }
  if (RE_EP_ACTOR.test(t)) {
    return { id: cleanId(t), symbol: t.endsWith('/') ? 'actor-business' : 'actor' };
  }
  return {
    id: RE_EP_QUOTED.test(t) ? cleanId(t) : t,
    symbol: 'rectangle',
    stillUnknown: true,
  };
}

export interface EndpointPair {
  from: EndpointShape;
  to: EndpointShape;
}

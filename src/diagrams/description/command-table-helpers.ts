/**
 * Shared helpers for the descriptive diagram dispatch table
 * (command-table.ts and its command-group modules). Kept in a module of its
 * own, separate from any COMMANDS-shaped array of shorthand-method object
 * literals: lizard 1.23.0 miscounts brace depth when a standalone function
 * is declared immediately above such an array, bleeding the array's own
 * braces into the preceding function's NLOC.
 */

import type { DescriptiveNode } from './ast.js';
import { makeNode, parseNameSection } from './parse-helpers.js';
import { emitNode, type ParseState } from './parse-state.js';
import { resolveQualifiedNode, scopedKey } from './namespace-groups.js';
import type { EndpointShape } from './link-grammar.js';

// Trailing decorations on shorthand declarations (`(uc) #green $tag`):
// restricted to tag/stereotype/color tokens so link lines never match.
export const SHORTHAND_TRAILER =
  '((?:\\s*(?:\\$[\\w]+|<<[^>]+>>|#[\\w:;.#\\\\/|-]+|\\[\\[[^\\]]*\\]\\]))*)\\s*';

export function shorthandNode(
  state: ParseState,
  name: string,
  symbol: DescriptiveNode['symbol'],
  trailer: string | undefined,
): void {
  const { id, display, stereotype, color, tags } = parseNameSection(
    name + ' ' + (trailer ?? '').trim(),
  );
  emitNode(state, makeNode(id, display, symbol, stereotype, color, tags));
}

/**
 * `quarkInContextSafe`'s `reuseExistingChild=true` path (CucaDiagram.java
 * :264-271), restricted to an id whose first segment names an EXISTING
 * top-level container walked down through already-declared children
 * (`resolveQualifiedNode`) — the shape both `bujige-52-gase998`-family
 * fixtures need (`srv1.br0` resolving into `node srv1 { portin br0 }`).
 * Falls through to the endpoint unchanged (ordinary flat-id auto-create via
 * `ensureEndpoint`) when no such chain exists yet, mirroring upstream's own
 * fallback to `currentQuark.child(full)`.
 *
 * Mission I1b (container-scoped entity identity): the returned `id` is the
 * FULL ancestor-chain-qualified path (`scopedKey`), never the resolved
 * node's bare `.id` alone — a bare id cannot distinguish `srv1.br0` from
 * `srv2.br0` once both resolve to a leaf literally named `br0` (two
 * DIFFERENT real containers' same-named children are structurally distinct
 * Quark objects upstream, plasma/Quark.java:54's per-parent `children`
 * map). `parse-state.ts#ensureEndpoint` and `layout.ts#classifyAst` both
 * recognize this qualified form: the former via `state.qualifiedNodesById`
 * (populated unconditionally by `emitNode`), the latter via
 * `ClassifyCtx.qualifiedPathToDotKey` (populated unconditionally by
 * `classifyAst`, regardless of whether the target actually needed
 * disambiguation) — see the description-dot-100 decision journal (I1b).
 */
export function resolveEndpointNamespace(state: ParseState, ep: EndpointShape): EndpointShape {
  const resolved = resolveQualifiedNode(state.ast.nodes, ep.id, state.namespaceSeparator);
  return resolved === undefined
    ? ep
    : { id: scopedKey(resolved.segments), symbol: resolved.node.symbol };
}

/**
 * `CommandLinkAnchor` -- `{a1} <-> {a2} : label`, the duration link between
 * two anchored messages. Upstream's `executeArg` hands the three groups
 * straight to `SequenceDiagram#linkAnchor`, which appends a `LinkAnchor` to a
 * list of its own (`SequenceDiagram.java:617-621`); no event is emitted, so
 * the link takes no vertical space and is drawn after the tiles
 * (`teoz/PlayingSpace.java:129-134`).
 *
 * @see ~/git/plantuml/.../sequencediagram/command/CommandLinkAnchor.java:55-63,85-90
 */

import type { Command } from './sequence-parse-helpers.js';

/**
 * `RegexLeaf.start()`, `ANCHOR1` and `ANCHOR2` (`\{([%pLN_]+)\}`: letters,
 * digits and `_`), `LINK` (`\<-\>`), then the optional `MESSAGE`
 * (`(?::[%s]*(.*))?`) and `RegexLeaf.end()`, with `spaceZeroOrMore` between
 * them (`CommandLinkAnchor.java:56-63`).
 */
const LINK_ANCHOR_PATTERN = /^\{([\p{L}\p{N}_]+)\}\s*<->\s*\{([\p{L}\p{N}_]+)\}\s*(?::\s*(.*))?$/u;

export const linkAnchorCommand: Command = {
  pattern: LINK_ANCHOR_PATTERN,
  execute(state, match) {
    (state.ast.linkAnchors ??= []).push({ anchor1: match[1]!, anchor2: match[2]!, message: match[3] });
  },
};

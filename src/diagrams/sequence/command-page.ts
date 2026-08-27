/**
 * The pagination block: `CommandNewpage` (`:139`), `CommandIgnoreNewpage`
 * (`:140`) and `CommandAutoNewpage` (`:141`), the three commands that open
 * `initCommandsList`'s trailing run.
 *
 * `minwidthOrPagingCommand` spans two upstream registration slots: its
 * `ignorenewpage`/`autonewpage` alternatives are `:140`/`:141`, but its
 * `minwidth` alternative is `CommandMinwidth`, registered far earlier inside
 * `addCommonCommands1` (`command/CommonCommands.java:71`, reached from
 * `SequenceDiagramFactory.java:100`). It is filed here because two of its
 * three alternatives are pagination and because splitting it would change
 * the dispatch order — see the registry's note on that entry.
 *
 * @see ~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java:139-141
 */

import type { Command } from './sequence-parse-helpers.js';

/** `newpage [label]` / `@newpage` — `CommandNewpage`. Splits the diagram
 *  into multiple images upstream; this port's layout has no multi-page
 *  concept (a single `SequenceGeometry` per source), so — like `rotate` —
 *  it is recognised and otherwise ignored: the diagram renders as one
 *  continuous page, which is what this port already does for every other
 *  multi-page-capable engine (no engine in this port implements pagination).
 *  @see sequencediagram/command/CommandNewpage.java:60-69 */
export const newpageCommand: Command = {
  pattern: /^@?newpage(?:(?:\s*:\s*|\s+).*)?\s*$/i,
  execute() {
    /* ignored — see doc comment above; no multi-page layout exists */
  },
};

/** `minwidth N` — `CommandMinwidth`, `ignorenewpage`/`autonewpage N` —
 *  `CommandIgnoreNewpage`/`CommandAutoNewpage`, all no-op-for-this-port
 *  siblings of `newpageCommand`: `minwidth` sets a layout hint this port's
 *  layout does not read, `ignorenewpage`/`autonewpage` govern pagination
 *  this port does not implement (see `newpageCommand`'s doc comment).
 *  @see command/CommonCommands.java:71 (minwidth)
 *  @see sequencediagram/command/CommandIgnoreNewpage.java
 *  @see sequencediagram/command/CommandAutoNewpage.java */
export const minwidthOrPagingCommand: Command = {
  pattern: /^(?:minwidth\s+\d+|ignorenewpage|autonewpage\s+\d+)\s*$/i,
  execute() {
    /* ignored — see doc comment above */
  },
};


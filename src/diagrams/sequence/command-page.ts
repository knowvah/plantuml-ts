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

import type { NewpageEvent } from './ast.js';
import { emit, type Command } from './sequence-parse-helpers.js';

/**
 * `newpage [label]` / `@newpage` — `CommandNewpage`.
 *
 * `executeArg` calls `diagram.newpage(...)`, which appends a `Newpage` to the
 * SAME `events` list a message goes into and bumps `countNewpage`
 * (`SequenceDiagram.java:243-250`) — so the page split is an event with a
 * position, not a parser-level marker. It is a NO-OP when `ignorenewpage`
 * has already been issued (`:244-245`), which is why that flag is read here
 * rather than only recorded.
 *
 * The LABEL group is `(.*[%pLN_.].*)` (`:66-68`) — at least one letter,
 * digit, underscore or dot — inside a `RegexOptional`, so `newpage` alone is
 * a match and `newpage :` (an empty label) is NOT, since the optional group
 * cannot match and `RegexLeaf.end()` then fails on the leftovers. This
 * pattern used to accept any trailing run and captured nothing; both are
 * fixed here because the label is now stored.
 *
 * @see sequencediagram/command/CommandNewpage.java:60-92
 * @see sequencediagram/SequenceDiagram.java:243-250
 */
export const newpageCommand: Command = {
  pattern: /^@?newpage(?:(?:[\s\u00A0]*:[\s\u00A0]*|[\s\u00A0]+)(.*[\p{L}\p{N}_.].*))?\s*$/iu,
  execute(state, match) {
    if (state.ast.options.ignoreNewpage === true) return;
    const label = match[1];
    const event: NewpageEvent = {
      kind: 'newpage',
      // `Display.getWithNewlines`, as `dividerCommand` (`command-misc.ts`)
      // already renders it for this engine: a literal `\n` is a LINE BREAK.
      // The same `\t`/`\\`/`\r`/`\l` gap that comment records applies here.
      ...(label !== undefined ? { title: label.replace(/\\n/g, '\n').split('\n') } : {}),
    };
    emit(state, event);
  },
};

/** `minwidth N` — `CommandMinwidth`, `ignorenewpage`/`autonewpage N` —
 *  `CommandIgnoreNewpage`/`CommandAutoNewpage`.
 *
 *  `minwidth` sets a layout hint this port's layout does not read and
 *  `autonewpage` inserts a `newpage` every N messages, which this port does
 *  not implement (a named non-goal of `plans/sequence-newpage-pagination`).
 *  `ignorenewpage` IS honoured: `CommandIgnoreNewpage#executeArg` calls
 *  `diagram.ignoreNewpage()`, which sets the flag `SequenceDiagram#newpage`
 *  tests before adding anything (`SequenceDiagram.java:244-245,255-257`), so
 *  it is the same mechanism as `newpageCommand` rather than a separate
 *  feature. Recorded on the AST because it is sequential: only the `newpage`
 *  commands AFTER it are suppressed.
 *  @see command/CommonCommands.java:71 (minwidth)
 *  @see sequencediagram/command/CommandIgnoreNewpage.java
 *  @see sequencediagram/command/CommandAutoNewpage.java */
export const minwidthOrPagingCommand: Command = {
  pattern: /^(?:minwidth\s+\d+|(ignorenewpage)|autonewpage\s+\d+)\s*$/i,
  execute(state, match) {
    if (match[1] !== undefined) state.ast.options.ignoreNewpage = true;
  },
};

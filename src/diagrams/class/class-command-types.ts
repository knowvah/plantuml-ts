/**
 * Shared `Command` shape for the class diagram dispatch table. Split out so
 * every command-group module (class-command-directives.ts,
 * class-command-containers.ts, class-command-relationships.ts,
 * class-command-declarations.ts, class-command-notes.ts) can type its
 * exported array without importing class-commands.ts itself (which would
 * create a cycle, since class-commands.ts imports those groups).
 */

import type { Command as CoreCommand } from '../../core/command/Command.js';
import type { ParseState } from './parser.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/Command.java:42-58 */
export type Command = CoreCommand<ParseState>;

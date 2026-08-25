/**
 * Classifier declaration commands for the class diagram dispatch table
 * (rules 7-7c of the original class-commands.ts COMMANDS array): the
 * `class`/`interface`/`enum`/`annotation`/`entity`/`circle` declaration,
 * plus the already-split `object`/`map`/`json` declaration groups. Split
 * out of class-commands.ts to stay under the line cap; order preserved
 * (spread fourth in COMMANDS, right after the relationship group).
 */
import {
  applyClassifierDecl,
  parseClassifierDecl,
} from './class-declaration-parser.js';
import { OBJECT_COMMANDS } from './class-object-commands.js';
import { MAP_COMMANDS } from './class-map-commands.js';
import { JSON_COMMANDS } from './class-json-commands.js';
import type { Command } from './class-command-types.js';

/**
 * Order matters: patterns are tested top-to-bottom; first match wins.
 */
export const DECLARATION_COMMANDS: readonly Command[] = [
  // 7. Classifier declarations; bare `abstract Name` also matches (murotu-83-cebo380).
  //    T14 (dispatch-by-parse-attempt): `protocol` added to the keyword
  //    alternation -- see `ClassifierKind`'s `'protocol'` member doc
  //    (class-classifier-ast.ts) for the upstream citation and the sibling
  //    keywords (struct/exception/metaclass/stereotype/dataclass/record)
  //    deliberately left unported.
  {
    pattern: /^(?:abstract\s+class|abstract|class|interface|enum|annotation|entity|circle|protocol)\s+/i,
    execute(state, match) {
      const decl = parseClassifierDecl(match.input);
      if (decl !== null) applyClassifierDecl(state, decl, true);
    },
  },

  // 7a. `object` declaration (CommandCreateEntityObject) — registered right
  //     after the classifier-declaration entry, mirroring upstream
  //     ClassDiagramFactory.initCommandsList's order (CommandCreateClass then
  //     CommandCreateEntityObject). Moved to class-object-commands.ts (line
  //     cap); see that module for the full port + duplicate-declaration
  //     semantics.
  ...OBJECT_COMMANDS,

  // 7b. `map` declaration (CommandCreateMap) — registered right after the
  //     object-multiline opener, mirroring upstream's
  //     CommandCreateEntityObjectMultilines(116) -> CommandCreateMap(117)
  //     order. Moved to class-map-commands.ts (line cap); see that module
  //     for the full port + row/link body semantics.
  ...MAP_COMMANDS,

  // 7c. `json` declaration (CommandCreateJson/-SingleLine) — after `map`,
  //     mirroring upstream's registration order (117-119); see class-json-commands.ts.
  ...JSON_COMMANDS,
];

/**
 * `CommandAutonumber` (`SequenceDiagramFactory.java:146`), the first of the
 * four autonumber commands upstream registers in a row: `CommandAutonumber`
 * (`:146`), `CommandAutonumberStop` (`:147`), `CommandAutonumberResume`
 * (`:148`) and `CommandAutonumberIncrement` (`:149`). Only the first is
 * ported; `stop`/`resume`/`inc` have no rule here yet.
 *
 * @see ~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java:146-149
 */

import { parseDottedStart, type Command } from './sequence-parse-helpers.js';

// 3. autonumber. T13: widened for `autonumber START STEP "FORMAT"`, where
//    START may be a dotted number (`1.1`, `1-1:1`) and FORMAT a quoted
//    DecimalFormat pattern -- see `parseDottedStart`/`formatAutonumber`.
// @see sequencediagram/command/CommandAutonumber.java:58-74
export const autonumberCommand: Command = {
  pattern: /^autonumber(?:\s+([\d][^\s"]*))?(?:\s+(\d+))?(?:\s+"([^"]+)")?\s*$/i,
  execute(state, match) {
    const { prefix, value } = parseDottedStart(match[1] ?? '1');
    const step = match[2] !== undefined ? parseInt(match[2], 10) : 1;
    state.ast.autonumber = {
      enabled: true,
      start: value,
      current: value,
      step,
      prefix,
      ...(match[3] !== undefined ? { format: match[3] } : {}),
    };
  },
};


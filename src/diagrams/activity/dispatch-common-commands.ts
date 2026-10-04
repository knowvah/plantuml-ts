/**
 * The "tried last, right before the unknown-line fallback" common-command
 * handlers (title/sprite/scale/pragma) -- split out of `node-dispatch.ts`
 * (D12/T1p-b) purely to keep that file under the project's 500-line cap
 * (it was already at the exact limit; this task's own `tryPragma` addition
 * needed the room). Pure mechanical move for `tryAnnotation`/`trySprite`/
 * `tryScale`: no behavior change, same doc comments, same priority
 * position in `LINE_HANDLERS` (`node-dispatch.ts`). `tryPragma` is new.
 *
 * @see net/sourceforge/plantuml/command/CommonCommands.java:55-59
 *   -- `addCommonCommands1`: title, then `addCommonCommands2` (pragma,
 *   ..., sprite), then scale, then hides.
 */

import { matchAnnotationCommand } from '../../core/annotations/index.js';
import { matchSpriteCommand } from '../../core/sprite-commands.js';
import { matchScaleCommand } from '../../core/scale-command.js';
import { RE_PRAGMA, type DispatchResult, type ParseContext } from './dispatch-support.js';

/**
 * title/caption/legend/header/footer/mainframe (mission G0b/T6,
 * decisions.md D3) -- tried last, right before the unknown-line fallback
 * (spec position: former parser.ts:607-610). Activity's own multiline note
 * body (`tryNoteMulti`, `node-dispatch.ts`) already owns its lines via a
 * dedicated inner while-loop that never falls through to this point, so a
 * `title`-shaped line inside a note body is never stolen (same
 * top-level-only guarantee as sequence's note bodies).
 */
export function tryAnnotation(ctx: ParseContext, idx: number): DispatchResult | null {
  const match = matchAnnotationCommand(ctx.lines, idx, ctx.annotations);
  if (match === null) return null;
  return { idx: idx + match.consumed };
}

/** `sprite $name [WxH/N[z]] { ... }` definitions (mission SI5b/T4) --
 *  tried immediately after `tryAnnotation`, same last-before-fallback
 *  position, mirroring upstream's title-then-sprite registration order
 *  (CommonCommands.java:54-58). */
export function trySprite(ctx: ParseContext, idx: number): DispatchResult | null {
  const match = matchSpriteCommand(ctx.lines, idx, ctx.sprites);
  if (match === null) return null;
  return { idx: idx + match.consumed };
}

/**
 * `scale ...` (6 forms, `CommonCommands#addCommonScaleCommands`, wired for
 * every `TitledDiagram` factory including `activitydiagram3`) -- mission
 * ubrr-T10 M2's `zovemu-18-keki646` prerequisite. Recognised and consumed
 * only: the resolved factor is NOT applied to the rendered document (no
 * `ast.scale`/renderer wiring here, unlike `sequence`/`description`) --
 * activity-diagram scaling is a separate, unscoped follow-on; this just
 * stops the line from refusing.
 */
export function tryScale(_ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  if (matchScaleCommand(line) === undefined) return null;
  return { idx: idx + 1 };
}

/**
 * `!pragma NAME [VALUE]` (`CommandPragma`, registered via `CommonCommands
 * .addCommonCommands2` BEFORE sprite, `CommonCommands.java:62-89`;
 * `ActivityDiagramFactory3.java:107` wires `addCommonCommands1` for every
 * activity diagram) -- D12/T1p-b. Folds the match into `ctx.pragma`
 * (mirrors `system.getPragma().define(name, value)`,
 * `CommandPragma.java:112`): `name` is lower-cased the same way
 * `StringUtils.goLowerCase(arg.get("NAME", 0))` is; `value` stays raw
 * (`null` when the optional VALUE group did not match, same as upstream's
 * `arg.get("VALUE", 0)`).
 *
 * `svgsize` is upstream's own special case (`:106-110`): routed to
 * `SkinParam#setSvgSize` instead of `Pragma#define` entirely (never
 * reaches the diagram's `Pragma` table). No SVG-size consumer exists
 * anywhere in this port, so it is recognised (the line does not refuse)
 * but left a no-op -- the same "recognised, no observable effect"
 * precedent `tryScale` above already documents for its own unwired facet.
 */
export function tryPragma(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  const match = RE_PRAGMA.exec(line);
  if (match === null) return null;
  const name = match[1]!.toLowerCase();
  if (name !== 'svgsize') ctx.pragma.define(name, match[2] ?? null);
  return { idx: idx + 1 };
}

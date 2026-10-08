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
import type { ActivityArrowLabel } from './ast.js';
import { RE_PRAGMA, swimlaneSpread, type DispatchResult, type ParseContext } from './dispatch-support.js';

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
 * ubrr-T10 M2's `zovemu-18-keki646` prerequisite. add4-T3b (ACT-SCALE):
 * each form calls `diagram.setScale(...)` (`CommandScale.java:104`,
 * `CommandScaleWidthOrHeight.java:82-84`, ...), which REPLACES the previous
 * one (`AbstractDiagram.java:195-197`), so the spec lands on `ctx.scale`
 * unresolved; `layout/document-margin.ts` resolves it at export time
 * against the final dimension (`TextBlockExporter.java:160-166`).
 */
export function tryScale(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  const spec = matchScaleCommand(line);
  if (spec === undefined) return null;
  ctx.scale = spec;
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

/**
 * `page NxM` (`CommandPage.java:55-62`): `setSplitPagesHorizontal/Vertical`
 * (`:92-93`) are read only by `PSystemUtils.splitPng` (`:178`) -- the PNG
 * multi-file splitter -- so a single SVG is unaffected: accepted, no state.
 * Non-positive counts are an upstream `error("Argument must be positive")`
 * (`:88-89`), kept as a refusal here by not matching them.
 */
export const RE_PAGE = /^page\s+(\d+)\s*x*\s*(\d+)$/i;

/** `[hide|show] footbox` (`CommandFootboxIgnored.java:55-56`): ok(), no effect. */
export const RE_FOOTBOX_IGNORED = /^(?:(?:hide|show)\s*)?footbox$/i;

/**
 * `hide|show [GENDER] [empty] PORTION` (`CommandHideShowByGender.java:59-69`);
 * `executeArg` dispatches on class/description/sequence diagrams and "Just
 * ignored" otherwise (`:154-159`, the activity case).
 */
export const RE_HIDE_SHOW_BY_GENDER = new RegExp(
  '^(?:hide|show)\\s+' +
    '(?:(?:class|object|interface|enum|annotation|dataclass|record|abstract|[\\p{L}\\p{N}_.]+|"[^"]+"|<<.*>>)\\s+)*?' +
    '(?:empty\\s+)?' +
    '(?:members?|attributes?|fields?|methods?|circles?|circled?|stereotypes?)$',
  'iu',
);

/** `link #color[;]` (`CommandLink3.java:59-63`). */
export const RE_LINK3 = /^link\s+(#\w+);?$/i;

/**
 * Accepted-and-ignored common commands: `page` (`CommonCommands.java:73`),
 * `footbox` (`ActivityDiagramFactory3.java:105`), hide/show by gender
 * (`CommonCommands.java:106-109`). Each upstream `executeArg` leaves the
 * activity diagram untouched, so the line is consumed without a node.
 */
export function tryIgnoredCommonCommand(_ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  const positivePage = (m: RegExpExecArray | null): boolean => m !== null && Number(m[1]) > 0 && Number(m[2]) > 0;
  const ignored =
    positivePage(RE_PAGE.exec(line)) || RE_FOOTBOX_IGNORED.test(line) || RE_HIDE_SHOW_BY_GENDER.test(line);
  return ignored ? { idx: idx + 1 } : null;
}

/**
 * `link #color` (`CommandLink3.java:76-83`): `setColorNextArrow(Rainbow.
 * fromColor(color, null))` -- the same `setNextLink(LinkRendering.create(
 * rainbow))` as `-[#color]->` with no label (`ActivityDiagram3.java:470-475`,
 * `CommandArrow3.java:99-103`), so it lowers to the identical style-only
 * arrow-label node.
 */
export function tryLink3(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  const match = RE_LINK3.exec(line);
  if (match === null) return null;
  const node: ActivityArrowLabel = { kind: 'arrow-label', label: '', style: match[1]!, ...swimlaneSpread(ctx) };
  return { idx: idx + 1, node };
}

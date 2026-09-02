/**
 * Sequence diagram layout — event geometry (Step 2 of layoutSequence).
 * Extracted from layout.ts to keep file size and per-function complexity
 * within limits; see layout.ts for the overall pipeline.
 *
 * @see .../sequencediagram/SequenceDiagram.java (upstream advances a running
 * Y cursor as it visits each event in source order)
 */

import type {
  ActivationEvent,
  ActivationGeo,
  DelayEvent,
  DividerEvent,
  DividerGeo,
  EventGeo,
  FrameEvent,
  FrameGeo,
  NewpageEvent,
  NewpageGeo,
  NoteEvent,
  NoteGeo,
  ParticipantGeo,
  SequenceEvent,
  SpaceEvent,
  SpaceGeo,
  TextRun,
} from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer, FontSpec } from '../../core/measurer.js';
import { noteFontSpecOf } from './sequence-layout-shared.js';
import {
  DIVIDER_PADDING,
  DIVIDER_LABEL_DELTA_X,
  dividerFontSpecOf,
  dividerPreferredHeight,
} from './divider-style.js';
import { NEWPAGE_TILE_HEIGHT } from './newpage-style.js';
import { displayLines, refBodyLines, refBodyHeight, refBodyWidth, refBodyFontSpecOf } from './text-block-geo.js';
import { sequenceCreoleFont, sequenceCreoleRuns } from './sequence-creole.js';
import { handleMessageEvent } from './sequence-layout-message.js';
import { handleMessageExoEvent } from './sequence-layout-exo.js';
import {
  groupingHeaderDisplay,
  HEADER_PADDING,
  HEADER_FONT_SIZE,
  HEADER_FONT_BOLD,
  GROUP_FONT_SIZE,
  GROUP_FONT_BOLD,
} from './frame-style.js';

/** Pending activation-bar start record. `level` is 1-based and fixed when
 *  the bar OPENS — upstream's `Step#getIndent` for this bar's steps. */
type ActivationRecord = { y: number; level: number; color?: string };

/**
 * The open activation bars for one participant, innermost LAST.
 *
 * A STACK, not a single record, because upstream's activation state is a
 * nesting LEVEL: `LiveBoxes#getLevelAtInternal` replays the event list
 * counting `level++` on every activate and `level = Math.max(0, level - 1)`
 * on every deactivate (`:100-108`), and `getStairs` emits one step per level
 * change. `A -> B++` four deep is four boxes, each with its own extent, which
 * one record per participant cannot hold: the inner activate would overwrite
 * the outer one's start.
 *
 * `Math.max(0, ...)` is the other half, and it is why {@link emitActivation}
 * returns on an empty stack instead of inventing a start: a deactivate that
 * arrives at level 0 leaves the level at 0 and draws nothing at all.
 */
export type ActivationStack = Map<string, ActivationRecord[]>;

/**
 * Shared, mutable context threaded through event processing. Grouping these
 * as one object keeps every handler's parameter count within limits and lets
 * nested frame branches recurse through the same participant geometry and
 * pending-activation records.
 */
export interface EventProcessingContext {
  theme: Theme;
  measurer: StringMeasurer;
  participantMap: Map<string, ParticipantGeo>;
  participantIndex: Map<string, number>;
  activationStart: ActivationStack;
  eventGeos: EventGeo[];
  dividerGeos: DividerGeo[];
  /** The newpage tiles, in layout order — `PlayingSpace#getNewpageTiles`
   *  (`:326-336`). Collected alongside `dividerGeos` for the same reason:
   *  both need `totalWidth` back-filled once Step 3 knows it. */
  newpageGeos: NewpageGeo[];
  /**
   * The participants of `SequenceDiagram.lastEventWithDeactivate` when that
   * event is a MESSAGE, and `undefined` otherwise — a diagram-level field
   * upstream (`:145`), set by `addMessage` (`:204`) and reset to the
   * `GroupingLeaf` by a group `end` (`:438`).
   *
   * Only one reader: a `destroy` binds to it when it `dealWith`s the same
   * participant AND it is an `AbstractMessage` (`:387,396-398`), and an
   * unbound destroy is the one life event that reserves height. `undefined`
   * therefore covers both "nothing yet" and "the last one was a group end",
   * which are the same answer.
   */
  lastMessageParticipants?: readonly string[] | undefined;
}

/** Running Y cursor plus the y of the most recent message arrow. */
export interface EventCursor {
  y: number;
  lastMessageY: number | undefined;
}

/**
 * Process a list of events, mutating `ctx.eventGeos`/`ctx.dividerGeos` in
 * place. Returns the updated Y position after all events are processed.
 */
export function processEvents(
  events: SequenceEvent[],
  startY: number,
  ctx: EventProcessingContext,
): number {
  const cursor: EventCursor = { y: startY, lastMessageY: undefined };
  for (let i = 0; i < events.length; i++) {
    dispatchEvent(events[i]!, cursor, ctx, boundLifeEvents(events, i));
  }
  return cursor.y;
}

/**
 * The life events upstream BINDS to `events[index]`, when that is a message.
 *
 * `SequenceDiagram#activate` calls `lifeEvent.setMessage(lastMessage)` for
 * every activate/deactivate that follows a message (`:396-399`), and
 * `LiveBoxes#getLevelAtInternal` then walks forward from the message picking
 * up exactly those (`le.getMessage() == msg`, `:120-125`) to decide the
 * level AT it.
 *
 * Upstream's walk skips notes (`nextButSkippingNotes`) and `continue`s past
 * a following MESSAGE rather than breaking; this breaks there instead, which
 * is equivalent — a life event after a later message is bound to THAT
 * message, so the `le.getMessage() == msg` test would reject it anyway.
 * It also breaks on anything else, which is upstream's own
 * `if (!(next instanceof LifeEvent || next instanceof AbstractMessage))
 * break;` — and that is what keeps a frame boundary from binding an
 * `activate` inside the frame to the message before it.
 */
function boundLifeEvents(
  events: readonly SequenceEvent[],
  index: number,
): ActivationEvent[] {
  const bound: ActivationEvent[] = [];
  for (let i = index + 1; i < events.length; i++) {
    const next = events[i]!;
    if (next.kind === 'note') continue;
    if (next.kind !== 'activate' && next.kind !== 'deactivate') break;
    bound.push(next);
  }
  return bound;
}

/** Route a single event to its kind-specific handler. */
function dispatchEvent(
  event: SequenceEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
  bound: readonly ActivationEvent[],
): void {
  switch (event.kind) {
    case 'message': handleMessageEvent(event, cursor, ctx, bound); return;
    // Exo geometry is its own module, never `handleMessageEvent`'s:
    // `MessageExo.isSelfMessage()` is FALSE (`MessageExo.java:99-101`, D3)
    // although both of its participants are the same, so the `from === to`
    // reading there would put every exo arrow on a self loop.
    case 'messageExo': handleMessageExoEvent(event, cursor, ctx); return;
    case 'note': handleNoteEvent(event, cursor, ctx); return;
    case 'activate': handleActivateEvent(event, cursor, ctx); return;
    case 'deactivate': handleDeactivateEvent(event, cursor, ctx); return;
    case 'frame': handleFrameEvent(event, cursor, ctx); return;
    case 'divider': handleDividerEvent(event, cursor, ctx); return;
    case 'delay': handleDelayEvent(event, cursor, ctx); return;
    case 'space': handleSpaceEvent(event, cursor, ctx); return;
    case 'newpage': handleNewpageEvent(event, cursor, ctx); return;
  }
}

function handleNoteEvent(
  event: NoteEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  // `note { FontSize 13 }` (`plantuml.skin:312-316`), NOT the ambient font —
  // the box and its text must be sized from one measurement.
  const fontSpec = noteFontSpecOf(ctx.theme);
  const notePadding = 10;
  const lines = event.text.split('\n');
  const lineHeight = ctx.measurer.measure('M', fontSpec).height;
  // C6: that ONE measurement is the CREOLE block's -- `getTextWidth` reads
  // `textBlock.calculateDimension` plus the padding (`AbstractTextualComponent
  // .java:100-108`) over the block `create0` built (`:89-92`), so `<b>bold</b>`
  // reserves the width of `bold` (jar: `moxope-92-roco972`).
  const rows = noteBodyRuns(lines, fontSpec, ctx);
  const noteWidth = blockWidthOf(rows) + notePadding * 2;
  // The DRAWN box is `getTextHeight` tall -- the block plus `padding.top` and
  // `padding.bottom`, both 5 (`ComponentRoseNote:67-70,104-118`). This port
  // used the x padding (10) on both axes, making every note box 10 too tall.
  const noteHeight = lines.length * lineHeight + NOTE_PADDING_Y * 2;

  // And the box is drawn `getPaddingY` BELOW the tile top -- `Rose.paddingY`
  // = 5, handed to the component at `Rose:115` and applied by
  // `AbstractComponent#drawU:142-143`. On `metano-36-gevu843` the jar's box is
  // at y=52 against a tile top of 47.
  const noteGeo = buildNoteGeo(event, noteWidth, noteHeight, cursor.y + NOTE_PADDING_Y, ctx.participantMap);
  const [dx, dy] = [noteGeo.x + notePadding, noteGeo.y + NOTE_PADDING_Y];
  noteGeo.textRuns = rows.map((r) => ({ ...r, x: r.x + dx, y: r.y + dy }));
  ctx.eventGeos.push(noteGeo);
  // `NoteTile#getPreferredHeight:167-171` is the component's height and
  // nothing else -- no spacing either side -- and that is `getTextHeight +
  // 2 * getPaddingY + deltaShadow` (`ComponentRoseNote:88-91`) = `blockH + 20`.
  cursor.y += noteHeight + NOTE_PADDING_Y * 2;
}

/** `ComponentRoseNote`'s own vertical padding, `topRightBottomLeft(5, 15, 5,
 *  15)` (`:67-70`) — and, separately, `Rose.paddingY` (`Rose.java:66`, passed
 *  at `:115`), which is the same 5 and is what offsets the box below its tile
 *  top. The HORIZONTAL padding is 15 upstream against this port's 10; that is
 *  an x term and `findings/vertical-terms.md` §4 does not claim it. */
const NOTE_PADDING_Y = 5;

function handleActivateEvent(
  event: ActivationEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  // Use the last message arrow y when available so the bar top aligns
  // with its triggering arrow, not with the post-arrow spacing position.
  pushActivation(ctx.activationStart, event.participantId, {
    y: cursor.lastMessageY ?? cursor.y,
    ...(event.color !== undefined ? { color: event.color } : {}),
  });
  cursor.lastMessageY = undefined;
}

function handleDeactivateEvent(
  event: ActivationEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  // End at the last message arrow y. If that would give zero/negative
  // height (activate and deactivate at the same y), fall back to
  // post-spacing cursor.y so the bar is always visible.
  const deactStartY = openActivation(ctx.activationStart, event.participantId)?.y;
  const rawEndY = cursor.lastMessageY ?? cursor.y;
  const deactEndY =
    deactStartY !== undefined && rawEndY <= deactStartY ? cursor.y : rawEndY;
  emitActivation(event.participantId, deactEndY, ctx.participantMap, ctx.activationStart, ctx.eventGeos);
  cursor.lastMessageY = undefined;
  if (isDestroyWithoutMessage(event, ctx)) cursor.y += DESTROY_CROSS_SIZE * 2;
}

/**
 * `LifeEventTile#isDestroyWithoutMessage:124-126` — `lifeEvent.getMessage() ==
 * null && lifeEvent.getType() == DESTROY`.
 *
 * `getMessage()` is set only when `SequenceDiagram#activate` reaches its
 * `setMessage` line (`:396-398`), which two earlier guards can skip: a
 * `lastEventWithDeactivate` that does not `dealWith(p)` returns at `:387`, and
 * one that is not an `AbstractMessage` — a group `end`, per `:438` — falls
 * past the `instanceof` test. Both leave the message null, so both make the
 * destroy standalone. `X -> X` followed by `destroy Y` is upstream's own
 * worked example, in the comment above `:387`.
 */
function isDestroyWithoutMessage(
  event: ActivationEvent,
  ctx: EventProcessingContext,
): boolean {
  if (event.destroy !== true) return false;
  return ctx.lastMessageParticipants?.includes(event.participantId) !== true;
}

/** `ComponentRoseDestroy.crossSize` (`:57`); the component is `crossSize * 2`
 *  on both axes (`:68-70,72-74`), and `LifeEventTile:132-136` reserves that
 *  height for a destroy with no message. The cross itself is not drawn here —
 *  reserving its space is the vertical term; emitting its two strokes is an
 *  element-deficit task. */
const DESTROY_CROSS_SIZE = 9;

/**
 * Vertical room an `else` separator plus its bracketed condition occupies.
 * `ElseTile:80` reserves the component's `getPreferredHeight`, whose teoz arm
 * is `getTextHeight + 4` (`ComponentRoseGroupingElse:115-121`) over padding
 * `topRightBottomLeft(1, 5, 1, 5)` (`:65-67`) — so `blockH + 6`, 17 for an
 * 11px condition, where this port used a flat 20. `blockH` is **0** for a bare
 * `else`: the constructor takes `comment == null ? null : "[" + comment + "]"`,
 * so a conditionless branch has no display. Jar-verified on
 * `cazusa-73-masi168`, whose bare rule at 311 chains the next frame at 316 and
 * whose labelled rule at 496 chains it at 512.
 */
function separatorHeight(label: string, ctx: EventProcessingContext): number {
  const blockH =
    label.trim() === ''
      ? 0
      : ctx.measurer.measure('M', {
          family: ctx.theme.fontFamily,
          size: GROUP_FONT_SIZE,
          weight: GROUP_FONT_BOLD ? 'bold' : 'normal',
        }).height;
  return blockH + 2 * ELSE_PADDING_Y + ELSE_TEOZ_DELTA_H;
}

/** The teoz arm's `+ 4` (`ComponentRoseGroupingElse#getPreferredHeight:
 *  115-121`), on top of the component's own `getTextHeight`. */
const ELSE_TEOZ_DELTA_H = 4;

/** `GroupingTile.MARGINX` (`teoz/GroupingTile.java:89`) — how far a group's
 *  frame reaches beyond the tiles it contains, on each side. */
const FRAME_MARGIN_X = 16;

/** Everything a frame's x/width/refBody needs that does NOT depend on
 *  where its branches leave the cursor: participant column bounds are
 *  fixed, and `refBodyLines` reads only `frameType`/`label`. Split out so
 *  `handleFrameEvent` can resolve these BEFORE the branch walk -- see the
 *  mutation-contract doc on `handleFrameEvent` (D2). */
function computeFrameBody(
  event: FrameEvent,
  ctx: EventProcessingContext,
): { x: number; width: number; refBody: readonly TextRun[]; body: readonly string[] } {
  const { minCx, maxCx } = participantCenterXBounds(ctx.participantMap);
  const body = refBodyLines(event.frameType, event.label);
  // `GroupingTile.MARGINX = 16` (`:89`), applied as
  // `tile.getMinX().addFixed(-MARGINX)` and `m.addFixed(MARGINX)` (`:204,207`).
  // Jar-verified on `bovugo-63-lazo401`: its `opt` frame is `x="13.469"`
  // against a leftmost lifeline centre of 29.469 -- 16, not the 20 this port
  // used, which was uncited and made the frame overhang the participant row
  // far enough to shift the whole document's origin.
  const x = minCx - FRAME_MARGIN_X;
  const width = Math.max(
    maxCx - minCx + 2 * FRAME_MARGIN_X,
    refBodyWidth(body, ctx.theme, ctx.measurer),
  );
  return { x, width, refBody: refBodyRuns(body, x, width, ctx), body };
}

/** A creole BLOCK's width -- the max over its stripes that
 *  `TextBlockSimple#calculateDimension` returns (`klimt/shape/TextBlockSimple
 *  .java:60-73`) and `AbstractTextualComponent#getTextWidth` pads (`:100-108`).
 *  Each run carries its line's offset in `x`, so one max IS that maximum; the
 *  `0` seed is the empty block. Cf. {@link creoleLineWidth}, for ONE line. */
function blockWidthOf(runs: readonly TextRun[]): number {
  return Math.max(0, ...runs.map((r) => r.x + r.textWidth));
}

/** A creole line's total advance: its LAST run's right edge, never a sum of
 *  widths -- a non-text atom advances x without producing a run. */
function creoleLineWidth(runs: readonly TextRun[]): number {
  const last = runs.at(-1);
  return last === undefined ? 0 : last.x + last.textWidth;
}

/**
 * A `ref over` frame's body lines, as placed and measured runs (A4), one run
 * per creole atom (C5). The `y` moved here from `renderer.ts#renderRefBody`
 * because the renderer may no longer derive a baseline from a font size (D1),
 * and D5 keeps it there. Upstream draws the body
 * at `(textPos, getOldPaddingY() + textHeaderHeight)`
 * (`ComponentRoseReference.java:125-136`); this port substitutes
 * `+ theme.fontSize` (an SVG `<text>` y is a BASELINE, upstream's translate a
 * block top-left) and `frame.tabHeight` for `textHeaderHeight` (keying the
 * body to the DRAWN tab keeps the two from colliding). The `x` is
 * upstream's centring within the box (`AbstractTextualComponent.java:106-108`),
 * applied to the whole LINE and not to each run: the jar's two-line `ref` puts
 * both lines on one x (74.3, 76.962 in a box of x=70.3 w=76.775), and
 * `cikoca-19-feji527`'s url and `Foo2` sit adjacent at 16 + 121.275.
 */
function refBodyRuns(
  body: readonly string[],
  x: number,
  width: number,
  ctx: EventProcessingContext,
): readonly TextRun[] {
  // `reference { FontSize 12 }` (`plantuml.skin:145-151`), NOT the ambient
  // sequence font (`text-block-geo.ts#REFERENCE_FONT_SIZE`); the box this
  // places into is sized from the same spec by `refBodyWidth`/`refBodyHeight`.
  const font = sequenceCreoleFont(refBodyFontSpecOf(ctx.theme));
  // The ref body's own inter-line advance, unchanged from the renderer it
  // moved out of: NOT the measured line height, and substituting one for the
  // other would move every multi-line `ref`.
  const advance = ctx.theme.fontSize + 2;
  return body.flatMap((line, i) => {
    // Baselines are relative to the block top; `placeRefBody` drops them on.
    const runs = sequenceCreoleRuns(line, font, { leftX: 0, baselineY: i * advance }, ctx.measurer);
    const dx = x + (width - creoleLineWidth(runs)) / 2;
    return runs.map((r) => ({ ...r, x: r.x + dx }));
  });
}

/** Drop `refBodyRuns`' relative baselines onto the frame's own top. Separate
 *  from it because `tabHeight` is resolved by `computeHeaderTab`, after the
 *  body's x is. */
function placeRefBody(
  runs: readonly TextRun[],
  frameY: number,
  tabHeight: number,
  fontSize: number,
): readonly TextRun[] {
  const top = frameY + tabHeight + fontSize;
  return runs.map((r) => ({ ...r, y: top + r.y }));
}

/**
 * The header tab's title and its optional `[comment]`, as placed and measured
 * runs (A4), one run per creole atom (C5). Two FONTS, not two runs -- the
 * title at `HEADER_FONT_SIZE` 13 bold, the comment at the group style's own
 * `smallFont2` 11 bold (`ComponentRoseGroupingHeader.java:89,151-158`) -- and
 * each line becomes as many runs as it has atoms. Jar-verified on
 * `bepipo-37-fego336` (`loop` x=28 w=24.619, `[forever]` x=97.619 w=40.219,
 * one `tabWidth` right of the title) and on `cedeti-10-bufu072`, whose
 * `alt [[https://www.plantuml.com]]` comment is `[`, the url at 125.194, `]`.
 */
function buildTabRuns(
  tab: { readonly tabText: string; readonly tabComment?: string; readonly tabWidth: number },
  x: number,
  y: number,
  ctx: EventProcessingContext,
): readonly TextRun[] {
  // Both halves are TEXT BLOCKS (`ComponentRoseGroupingHeader.java:76-77,89`;
  // see `text-block-geo.ts#displayLines`), and the comment's brackets wrap the
  // whole block, not each line. Jar: `pigifu-13-kele137`, `zedepi-36-come743`.
  // The loop is `TextBlockSimple#drawU`'s (`klimt/shape/TextBlockSimple.java
  // :78-89`) = `text-block-geo.ts#textBlockRuns`, replaced here because that
  // one cannot split a line into atoms.
  const block = (text: string, size: number, bx: number, by: number): readonly TextRun[] => {
    const spec: FontSpec = { family: ctx.theme.fontFamily, size, weight: 'bold' };
    const lh = ctx.measurer.measure('M', spec).height;
    const first = by + lh - ctx.measurer.getDescent(spec, 'M');
    return displayLines(text).flatMap((line, i) =>
      sequenceCreoleRuns(line, sequenceCreoleFont(spec), { leftX: bx, baselineY: first + i * lh }, ctx.measurer));
  };
  const left = x + HEADER_PADDING.left;
  const top = y + HEADER_PADDING.top;
  const title = block(tab.tabText, HEADER_FONT_SIZE, left, top);
  if (tab.tabComment === undefined) return title;
  // `+ 1`: `getOldPaddingY()` again, on the comment's own baseline
  // (`ComponentRoseGroupingHeader.java:151-158`).
  return [...title, ...block(`[${tab.tabComment}]`, GROUP_FONT_SIZE, left + tab.tabWidth, top + 1)];
}

/** The header tab's `Display`, split by `groupingHeaderDisplay`
 *  (`GroupingTile.java:126-127`), then measured at `HEADER_FONT_SIZE` bold
 *  -- `ComponentRoseGroupingHeader.java:107-123` / `AbstractTextualComponent
 *  .java:106-114`, with `getSuppHeightForComment` and `commentMargin * 2`
 *  both 0 since this port draws no separate comment box measurement (the
 *  comment box itself is T4's, `renderer-frame-header.ts`). Layout is the
 *  only stage holding a measurer, hence resolved here. An empty
 *  `branchLabels[0]` is "no comment", as `groupingCommand` defaults a
 *  conditionless frame's label to `''`.
 *
 *  A `ref` NEVER has a comment: `ReferenceTile#getComponent:117-124` builds
 *  `Display("ref") + reference.getStrings()` and `ComponentRoseReference`
 *  splits it at index 1 -- `subList(0, 1)` the header, `subList(1, ...)` the
 *  BODY (`ComponentRoseReference.java:67-78`), where `refBodyLines` already
 *  routes it. */
function computeHeaderTab(
  event: FrameEvent,
  ctx: EventProcessingContext,
): { tabText: string; tabComment?: string; tabTextWidth: number; tabWidth: number; tabHeight: number } {
  const rawComment = event.frameType === 'ref' ? undefined : event.branchLabels[0];
  const comment = rawComment === undefined || rawComment === '' ? undefined : rawComment;
  const { tabText, tabComment } = groupingHeaderDisplay(event.frameType, comment);

  const fontSpec: FontSpec = {
    family: ctx.theme.fontFamily,
    size: HEADER_FONT_SIZE,
    weight: HEADER_FONT_BOLD ? 'bold' : 'normal',
  };
  // `getPureTextWidth`/`getTextHeight` over the title's own text BLOCK
  // (`AbstractTextualComponent.java:106-114`); the corner is drawn at exactly
  // those (`ComponentRoseGroupingHeader.java:141-143,152`), so the tab grows
  // with the TITLE's escaped newlines, never with the comment beside it. C5:
  // at the title's own CREOLE width -- `groupingHeaderDisplay` makes a
  // `group`'s comment its TITLE, so markup reaches here too.
  const titleLines = displayLines(tabText);
  const measured = ctx.measurer.measure(tabText, fontSpec);
  const titleFont = sequenceCreoleFont(fontSpec);
  const tabTextWidth = Math.max(...titleLines.map((l) =>
    creoleLineWidth(sequenceCreoleRuns(l, titleFont, { leftX: 0, baselineY: 0 }, ctx.measurer))));
  const tabWidth = HEADER_PADDING.left + tabTextWidth + HEADER_PADDING.right;
  const tabHeight =
    titleLines.length * measured.height + HEADER_PADDING.top + HEADER_PADDING.bottom;

  return {
    tabText,
    ...(tabComment !== undefined ? { tabComment } : {}),
    tabTextWidth,
    tabWidth,
    tabHeight,
  };
}

/**
 * An `else` branch's bracketed condition, as a placed and measured run (A5).
 *
 * `ComponentRoseGroupingElse` is its OWN component, not the header tab beside
 * it, and it carries its own padding —
 * `ClockwiseTopRightBottomLeft.topRightBottomLeft(1, 5, 1, 5)` (`:65-67`) —
 * which `drawInternalU`'s teoz arm applies as
 * `UTranslate(getOldPaddingX1(), getOldPaddingY() + 2)`, i.e. `(5, 3)`
 * (`:109-112`). The bracket wrapping is upstream's too: the constructor is
 * handed `"[" + comment + "]"`.
 *
 * Jar-verified on `bovugo-63-lazo401`, whose `else sinon` puts `[sinon]` at
 * x=18.469 against a frame at x=13.469 — exactly 5, where this port used 6.
 */
function branchConditionRuns(
  label: string,
  frameX: number,
  separatorY: number,
  ctx: EventProcessingContext,
): readonly TextRun[] {
  const condition = label.trim();
  if (condition === '') return [];
  const text = `[${condition}]`;
  const font: FontSpec = {
    family: ctx.theme.fontFamily,
    size: GROUP_FONT_SIZE,
    weight: GROUP_FONT_BOLD ? 'bold' : 'normal',
  };
  const lineHeight = ctx.measurer.measure('M', font).height;
  const ascent = lineHeight - ctx.measurer.getDescent(font, 'M');
  // C5: the condition is a `Display` like every other component text
  // (`AbstractTextualComponent.java:86-92`), so it goes through the same seam
  // the tab and the `ref` body do. `cedeti-10-bufu072` writes `else [[url]]`,
  // whose captured label is a run of its own carrying the href.
  return sequenceCreoleRuns(
    text,
    sequenceCreoleFont(font),
    {
      leftX: frameX + ELSE_PADDING_X1,
      baselineY: separatorY + ELSE_PADDING_Y + ELSE_TEOZ_DY + ascent,
    },
    ctx.measurer,
  );
}

/** `ComponentRoseGroupingElse`'s own padding, `topRightBottomLeft(1, 5, 1, 5)`
 *  (`:65-67`) — left and top respectively. */
const ELSE_PADDING_X1 = 5;
const ELSE_PADDING_Y = 1;
/** The teoz arm's extra `+ 2` (`ComponentRoseGroupingElse.java:110`). This
 *  engine is teoz-only, so the non-teoz arm has no reader here. */
const ELSE_TEOZ_DY = 2;

/**
 * MUTATION CONTRACT (D2 -- reserve the slot, then fill it).
 *
 * `frameGeo` is pushed into `ctx.eventGeos` BEFORE `event.branches` is
 * walked, so upstream's depth-first PRE-ORDER emission falls out for free,
 * nested groups included: `GroupingTile#drawU:254-275` draws its own
 * component, then recurses into `tiles`, and a nested `handleFrameEvent`
 * call pushes ITS OWN FrameGeo mid-walk -- landing between this frame's
 * push and its post-walk field fill, exactly where upstream's recursive
 * `drawU` would land it.
 *
 * `x`, `width`, `refBody` (via `computeFrameBody`), the tab* fields (via
 * `computeHeaderTab`) and `y` are all resolved BEFORE the push: each comes
 * only from `ctx.participantMap` and `event`'s own `frameType`/`label`/
 * `branchLabels`, none of which the branch walk can change -- `y` in
 * particular is `frameStartY`, `cursor.y` at entry, fixed before any branch
 * advances it. Only `height` and `branchSeparators` depend on where the
 * branches leave the cursor, so those two start as placeholders (`0` and
 * `[]`) at push time and are overwritten by direct mutation on `frameGeo`
 * once `event.branches` has been walked -- mirroring upstream's own
 * construct-then-resolve-gauge split (the `Real`/`YGauge` chain is built at
 * construction, then read once solved).
 */
function handleFrameEvent(
  event: FrameEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  // `frameStartY` is the GAUGE MIN -- the chaining point, NOT the drawn
  // frame's top. Those differ by `EXTERNAL_MARGINY`, and GroupingTile keeps
  // them apart deliberately: a parallel (`&`) sibling chains on the min, so
  // folding the margin into it would drift 4px per pair (`:145-152`).
  const frameStartY = cursor.y;
  const { x, width, refBody, body } = computeFrameBody(event, ctx);
  const tab = computeHeaderTab(event, ctx);
  // `final double h = dim1.getHeight() + MARGINY_MAGIC / 2 + EXTERNAL_MARGINY;`
  // (`GroupingTile.java:156`) -- the body starts below the frame's top margin
  // AND the header, where `dim1` is the header component's own preferred
  // dimension. This port used a flat 30 where upstream MEASURES the header.
  cursor.y = frameStartY + tab.tabHeight + FRAME_MARGINY_MAGIC / 2 + FRAME_EXTERNAL_MARGINY;

  // `getFrameY()` (`:240-242`) -- the drawn border, one top margin below.
  const frameDrawnY = frameStartY + FRAME_EXTERNAL_MARGINY;
  const frameGeo: FrameGeo = {
    kind: 'frame',
    frameType: event.frameType,
    label: event.label,
    x,
    y: frameDrawnY,
    width,
    height: 0, // placeholder -- filled below once the branch walk resolves frameEndY
    ...(event.backColorElement !== undefined ? { backColorElement: event.backColorElement } : {}),
    ...(event.backColorGeneral !== undefined ? { backColorGeneral: event.backColorGeneral } : {}),
    branchSeparators: [], // placeholder -- populated by mutation in the loop below
    refBody,
    ...tab,
    tabRuns: buildTabRuns(tab, x, frameDrawnY, ctx),
  };
  frameGeo.refBody = placeRefBody(refBody, frameDrawnY, tab.tabHeight, ctx.theme.fontSize);
  ctx.eventGeos.push(frameGeo);

  // Process each branch in sequence (alt frames have multiple branches).
  // Every branch after the first opens with an `else`, which upstream draws
  // as a dashed separator carrying that branch's own bracketed condition --
  // record the y it falls at, before the branch's own events advance the
  // cursor past it. `event.branchColors` (T2, D10) is index-aligned with
  // `branchLabels`, so `[i]` is this branch's own `else #color`, or
  // `undefined` where none was given -- `renderer-frame-blotter.ts` falls
  // back to the group colour itself when a band has none
  // (`GroupingTile.java:326-332`).
  event.branches.forEach((branch, i) => {
    if (i > 0) {
      const branchColor = event.branchColors?.[i];
      const branchLabel = event.branchLabels[i] ?? '';
      frameGeo.branchSeparators.push({
        y: cursor.y,
        label: branchLabel,
        ...(branchColor !== undefined ? { backColorGeneral: branchColor } : {}),
        runs: branchConditionRuns(branchLabel, x, cursor.y, ctx),
      });
      cursor.y += separatorHeight(branchLabel, ctx);
    }
    cursor.y = processEvents(branch, cursor.y, ctx);
  });

  const frameEndY = cursor.y;
  // `getTotalHeight = bodyHeight + dimIfEmpty.getHeight() + MARGINY_MAGIC / 2`
  // (`:342-345`), which `frameEndY - frameDrawnY` is exactly: the body offset
  // put `headerH + MARGINY_MAGIC / 2` between them and the walk added the body.
  // The `max` is a `ref`'s floor, not a group's -- `ComponentRoseReference`'s
  // header/body/footer split is deliberately out of C3's set (§1.9).
  frameGeo.height = Math.max(frameEndY - frameDrawnY, refBodyHeight(body, ctx.theme, ctx.measurer));
  // `getPreferredHeight = dim1 + bodyHeight + MARGINY_MAGIC + 2 *
  // EXTERNAL_MARGINY` (`:348-357`), which leaves exactly
  // `EXTERNAL_MARGINY + MARGINY_MAGIC / 2` of slack below the drawn border.
  // This port left one `messageSpacing` (20) there.
  cursor.y = frameEndY + FRAME_EXTERNAL_MARGINY + FRAME_MARGINY_MAGIC / 2;
  // `grouping(... GroupingType.END ...)` sets `lastEventWithDeactivate` to the
  // `GroupingLeaf` (`SequenceDiagram.java:438`), which is not an
  // `AbstractMessage` -- so a `destroy` straight after `end` is standalone.
  ctx.lastMessageParticipants = undefined;
}

/** `GroupingTile.EXTERNAL_MARGINY` (`teoz/GroupingTile.java:88`) — vertical
 *  breathing room around a group frame, on each side. Reserved on both in
 *  `getPreferredHeight`; the TOP one is additionally materialised at draw time
 *  through `getFrameY()`. */
const FRAME_EXTERNAL_MARGINY = 4;

/** `GroupingTile.MARGINY_MAGIC` (`teoz/GroupingTile.java:91`) — always read as
 *  a half (`MARGINY_MAGIC / 2`) above the body and again below the border, and
 *  as the whole in the tile's reserved height. */
const FRAME_MARGINY_MAGIC = 20;

/**
 * `DividerTile` (`teoz/DividerTile.java`) reserves exactly its component's own
 * `getPreferredHeight` and nothing more — tiles stack on `YGauge` with no gap
 * between them — so the cursor advances by that height, not by a spacing.
 *
 * This replaced a fitted `cursor.y += 30` that carried no upstream citation.
 * The label's own box is sized here too, from the SAME measurement, and the
 * renderer only reads it: see `DividerGeo`'s own doc comment.
 *
 * The divider's font is `sequenceDiagram { separator { FontSize 13,
 * FontStyle bold } }` (`plantuml.skin:174-175`), not the diagram font, so it
 * is measured with its own spec.
 */
/**
 * A divider label's runs, positioned RELATIVE to the label box's own top-left.
 *
 * `ComponentRoseDivider#drawInternalU` draws the block at
 * `(xpos + deltaX, ypos + getOldPaddingY())` (`:75-83,104`), where `deltaX` is
 * 6 and the padding is `topRightBottomLeft(4, 4, 4, 4)`. Both terms are known
 * here; `xpos`/`ypos` are not, because they are centred within a band whose
 * width `backfillDividerWidth` resolves in Step 3 — so these carry the inner
 * offset and that function adds the outer one.
 */
function dividerLabelRuns(lines: readonly string[], spec: FontSpec, ctx: EventProcessingContext): readonly TextRun[] {
  const font = sequenceCreoleFont(spec);
  const lineHeight = ctx.measurer.measure('M', spec).height;
  const ascent = lineHeight - ctx.measurer.getDescent(spec, 'M');
  // C6: one run per creole atom -- a divider's label is an
  // `AbstractTextualComponent` `Display` like every other sequence label
  // (`ComponentRoseDivider.java:57-62`); `bakuba-09-fica741` is the last one.
  return lines.flatMap((line, i) => sequenceCreoleRuns(line, font,
    { leftX: DIVIDER_LABEL_DELTA_X, baselineY: DIVIDER_PADDING + ascent + i * lineHeight }, ctx.measurer));
}

function handleDividerEvent(
  event: DividerEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  const font = dividerFontSpecOf(ctx.theme);
  // `\n` splits the label into a multi-line text block, exactly as it does for
  // a `ref` body (`text-block-geo.ts#refBodyLines`): the widest line drives the
  // width and the line COUNT drives the height. Jar-verified on
  // `pigifu-13-kele137`, whose `== divi\ndummy ==` golden carries a 34-tall
  // label box (two 13px lines plus the 4+4 padding), not a 21-tall one.
  const lines = event.text.split('\n');
  const lineHeight = ctx.measurer.measure('M', font).height;
  // Relative to the label BOX's own top-left; `backfillDividerWidth` drops
  // them onto the band once `bandX`/`bandWidth` are known (Step 3), the same
  // construct-then-resolve split `y`/`branchSeparators` use above. C6: the
  // reserved width is that CREOLE block's, less the `deltaX` the runs already
  // carry -- `getTextWidth` reads `calculateDimension`, not the display string.
  const labelRuns = dividerLabelRuns(lines, font, ctx);
  const blockWidth = Math.max(0, blockWidthOf(labelRuns) - DIVIDER_LABEL_DELTA_X);
  const blockHeight = lines.length * lineHeight;
  const dividerGeo: DividerGeo = {
    kind: 'divider',
    text: event.text,
    lines,
    y: cursor.y,
    bandX: 0, // both back-filled once totalWidth is known (Step 3)
    bandWidth: 0,
    height: dividerPreferredHeight(blockHeight),
    textWidth: blockWidth + DIVIDER_PADDING * 2,
    textHeight: blockHeight + DIVIDER_PADDING * 2,
    labelRuns,
  };
  ctx.eventGeos.push(dividerGeo);
  ctx.dividerGeos.push(dividerGeo);
  cursor.y += dividerGeo.height;
}

/**
 * A delay reserves its component's own height and nothing else
 * (`DelayTile#getPreferredHeight:114-118`), and there are two components. A
 * bare `...` is a `ComponentRoseDelayLine`, a constant **20** (`:68-71`) that
 * this port's `messageSpacing` matched by luck; a `...text...` is a
 * `ComponentRoseDelayText`, `getTextHeight + 20` (`:72-75`) over padding
 * `topRightBottomLeft(4, 0, 4, 0)` (`:54`), i.e. `blockH + 28` at
 * `delay { FontSize 11 }` (`plantuml.skin:290-295`). The text is still not
 * DRAWN — a pre-existing element gap — but its space is now reserved.
 */
function handleDelayEvent(
  event: DelayEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  if (event.text === undefined) {
    cursor.y += DELAY_LINE_HEIGHT;
    return;
  }
  const spec: FontSpec = { family: ctx.theme.fontFamily, size: DELAY_FONT_SIZE };
  const blockH = displayLines(event.text).length * ctx.measurer.measure('M', spec).height;
  cursor.y += blockH + 2 * DELAY_PADDING_Y + DELAY_LINE_HEIGHT;
}

/** `ComponentRoseDelayLine#getPreferredHeight:68-71`, and the constant term of
 *  `ComponentRoseDelayText#getPreferredHeight:72-75`. */
const DELAY_LINE_HEIGHT = 20;
/** `ComponentRoseDelayText:54` — `topRightBottomLeft(4, 0, 4, 0)`. */
const DELAY_PADDING_Y = 4;
/** `delay { FontSize 11 }` (`plantuml.skin:290-295`). */
const DELAY_FONT_SIZE = 11;

/**
 * `NewpageTile` (`teoz/NewpageTile.java:63-67`): a tile whose `YGauge` starts
 * at the running cursor and whose height is a CONSTANT
 * `getPreferredHeight()` — no measurement, no participant lookup. The cursor
 * advances by that height like it does past any other tile, which is what
 * makes `newpage` occupy 21px of the diagram rather than nothing.
 *
 * The tile draws nothing in the background pass (`drawU` returns early on
 * `isBackground`) and one `ULine.hline` in the foreground; the band it spans
 * is back-filled in Step 3.
 */
function handleNewpageEvent(
  _event: NewpageEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  const newpageGeo: NewpageGeo = {
    kind: 'newpage',
    y: cursor.y,
    height: NEWPAGE_TILE_HEIGHT,
    bandX: 0, // both back-filled once totalWidth is known (Step 3)
    bandWidth: 0,
  };
  ctx.eventGeos.push(newpageGeo);
  ctx.newpageGeos.push(newpageGeo);
  cursor.y += newpageGeo.height;
}

function handleSpaceEvent(
  event: SpaceEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  const spaceGeo: SpaceGeo = {
    kind: 'space',
    y: cursor.y,
    height: event.pixels,
  };
  ctx.eventGeos.push(spaceGeo);
  // Exactly the requested pixels, and nothing beside them. `HSpaceTile:72-75`
  // returns the `HSpace`'s own pixel count as its preferred height, and
  // `ComponentRoseGroupingSpace#getPreferredHeight:66-69` returns the `space
  // N` argument -- neither adds a gap, because tiles chain flush.
  cursor.y += event.pixels;
}

/**
 * Resolve participant centerX by id, returning 0 as a safe fallback for
 * participants not in the map (e.g., notes referencing unknown participants).
 */
function centerXOf(participantMap: Map<string, ParticipantGeo>, id: string): number {
  return participantMap.get(id)?.centerX ?? 0;
}

/**
 * Compute the bounding centerX range across all participants.
 * Returns [0, 0] when the map is empty (only possible in degenerate inputs
 * since layoutSequence returns early for empty participants).
 */
function participantCenterXBounds(
  participantMap: Map<string, ParticipantGeo>,
): { minCx: number; maxCx: number } {
  const centerXs = [...participantMap.values()].map((g) => g.centerX);
  if (centerXs.length === 0) return { minCx: 0, maxCx: 0 };
  return { minCx: Math.min(...centerXs), maxCx: Math.max(...centerXs) };
}

/** Resolved x offset and (possibly widened) width for a note. */
interface NotePosition {
  noteX: number;
  finalNoteWidth: number;
}

/**
 * Resolve a note's x offset and width based on its position keyword
 * ('left' / 'right' / 'over') and referenced participants.
 */
function computeNotePosition(
  event: NoteEvent,
  noteWidth: number,
  participantMap: Map<string, ParticipantGeo>,
): NotePosition {
  const notePadding = 10;

  if (event.position === 'left') {
    // Safe: parser guarantees at least one participant for 'left' notes
    const noteX = centerXOf(participantMap, event.participants[0]!) - noteWidth - notePadding;
    return { noteX, finalNoteWidth: noteWidth };
  }
  if (event.position === 'right') {
    // Safe: parser guarantees at least one participant for 'right' notes
    const noteX = centerXOf(participantMap, event.participants[0]!) + notePadding;
    return { noteX, finalNoteWidth: noteWidth };
  }
  return computeOverNotePosition(event, noteWidth, participantMap);
}

/** Resolve position/width for an 'over' note (one or many participants). */
function computeOverNotePosition(
  event: NoteEvent,
  noteWidth: number,
  participantMap: Map<string, ParticipantGeo>,
): NotePosition {
  const notePadding = 10;

  if (event.participants.length === 1) {
    // Safe: length === 1 means [0] is defined
    const noteX = centerXOf(participantMap, event.participants[0]!) - noteWidth / 2;
    return { noteX, finalNoteWidth: noteWidth };
  }

  // Span between two (or more) participants
  const centers = event.participants
    .map((id) => centerXOf(participantMap, id))
    .filter((cx) => cx > 0);
  const minCx = Math.min(...centers);
  const maxCx = Math.max(...centers);
  return { noteX: minCx - notePadding, finalNoteWidth: maxCx - minCx + notePadding * 2 };
}

/**
 * Build a NoteGeo from a NoteEvent given pre-computed note dimensions.
 * Extracted to isolate the position-branch logic and simplify processEvents.
 */
function buildNoteGeo(
  event: NoteEvent,
  noteWidth: number,
  noteHeight: number,
  currentY: number,
  participantMap: Map<string, ParticipantGeo>,
): NoteGeo {
  const { noteX, finalNoteWidth } = computeNotePosition(event, noteWidth, participantMap);

  return {
    kind: 'note',
    x: noteX,
    y: currentY,
    width: finalNoteWidth,
    height: noteHeight,
    text: event.text,
    // Filled in by the caller, which alone knows the padding it sized the box
    // with; see `noteBodyRuns`.
    textRuns: [],
    ...(event.color !== undefined ? { color: event.color } : {}),
    ...(event.shape !== undefined ? { shape: event.shape } : {}),
  };
}

/**
 * A note body's lines, as placed and measured runs — one run per creole atom
 * (C6), RELATIVE to the block's own top-left.
 *
 * `ComponentRoseNoteBox#drawInternalU` draws the block at
 * `(getOldPaddingX1() + diffX / 2, getOldPaddingY())` (`:105`) — LEFT-aligned
 * inside the box, not centred, which is what this port had been doing with a
 * `text-anchor="middle"`. `diffX` is the slack when the drawn area is wider
 * than the component's preferred width; this port sizes the box to the text, so
 * it is 0 and the block sits at the padding. Relative rather than absolute
 * because the box's own x derives FROM this block's width
 * (`handleNoteEvent`): the caller adds the origin and padding once it has them.
 * Each entry is one line — a note's `\n` split already happened upstream. */
function noteBodyRuns(lines: readonly string[], spec: FontSpec, ctx: EventProcessingContext): readonly TextRun[] {
  const font = sequenceCreoleFont(spec);
  const lineHeight = ctx.measurer.measure('M', spec).height;
  const ascent = lineHeight - ctx.measurer.getDescent(spec, 'M');
  return lines.flatMap((l, i) => sequenceCreoleRuns(l, font, { leftX: 0, baselineY: ascent + i * lineHeight }, ctx.measurer));
}

/**
 * Emit an ActivationGeo for a participant, consuming any pending activation
 * start record. When no record exists, height is 0 (deactivate without prior
 * activate).
 */
/** Open one activation bar for `participantId`, nested inside any already
 *  open — `level++` in `LiveBoxes#getLevelAtInternal` (`:102-103`). */
export function pushActivation(
  activationStart: ActivationStack,
  participantId: string,
  record: Omit<ActivationRecord, 'level'>,
): void {
  const stack = activationStart.get(participantId);
  if (stack === undefined) activationStart.set(participantId, [{ ...record, level: 1 }]);
  else stack.push({ ...record, level: stack.length + 1 });
}

/** The INNERMOST open activation for `participantId`, or `undefined` at
 *  level 0. */
export function openActivation(
  activationStart: ActivationStack,
  participantId: string,
): ActivationRecord | undefined {
  const stack = activationStart.get(participantId);
  return stack === undefined ? undefined : stack[stack.length - 1];
}

/** How deep `participantId` is currently activated — upstream's own `level`
 *  (`LiveBoxes#getLevelAt`). 0 when nothing is open. */
export function activationLevel(
  activationStart: ActivationStack,
  participantId: string,
): number {
  return activationStart.get(participantId)?.length ?? 0;
}

/**
 * Close every activation still open when the diagram ends, at the body's
 * bottom.
 *
 * Upstream has nothing to close: the level simply never returns to 0, so
 * `getStairs` (`LiveBoxes.java:245-300`) records its last step at that level
 * and `LiveBoxesDrawer` draws the bar on to the end of the lifeline. This
 * port materialises each bar at its deactivate, so an activation with no
 * deactivate needs the equivalent flush -- without it the bar vanishes.
 *
 * Jar-verified on `micaki-01-rexa741`, whose third `alt` branch opens an
 * activation that is never closed: the golden's second bar ends at `y=190`,
 * exactly where its lifelines do.
 *
 * Innermost first, then outward, then participant by participant in
 * declaration order -- deterministic, and the reverse of the order the walk
 * opened them in.
 */
export function flushOpenActivations(
  activationStart: ActivationStack,
  endY: number,
  participantMap: Map<string, ParticipantGeo>,
  eventGeos: EventGeo[],
): void {
  for (const participantId of [...activationStart.keys()])
    while (activationLevel(activationStart, participantId) > 0)
      emitActivation(participantId, endY, participantMap, activationStart, eventGeos);
}

export function emitActivation(
  participantId: string,
  currentY: number,
  participantMap: Map<string, ParticipantGeo>,
  activationStart: ActivationStack,
  eventGeos: EventGeo[],
): void {
  const record = activationStart.get(participantId)?.pop();
  // A deactivate with nothing open draws NOTHING -- not a zero-height box.
  //
  // Upstream never tracks "the open activation": it recomputes a nesting
  // LEVEL per participant by replaying the event list, and every deactivate
  // is clamped -- `level = Math.max(0, level - 1)`
  // (`LiveBoxes#getLevelAtInternal:104-108`, and again at `:136-141` for the
  // future-deactivate lookahead). A deactivate that arrives at level 0 leaves
  // it at 0, so `getStairs` records no step and `LiveBoxesDrawer` draws no
  // box. This port models that level as one open record per participant, and
  // "no record" IS level 0.
  //
  // Without this, `rugeco-70-muro754` emitted a fourth activation -- `a`
  // deactivated twice, once by `a ->> b --++`'s own `--` and once by the
  // standalone `deactivate a` after the group -- as a `height: 0` bar that
  // the renderer then wrapped in a `<g>`, one surplus top-level child
  // against a golden this port otherwise matched element for element.
  if (record === undefined) return;
  const startY = record.y;
  const activationGeo: ActivationGeo = {
    kind: 'activation',
    participantId,
    lifelineX: centerXOf(participantMap, participantId),
    y: startY,
    height: currentY - startY,
    level: record.level,
    ...(record.color !== undefined ? { color: record.color } : {}),
  };
  eventGeos.push(activationGeo);
}

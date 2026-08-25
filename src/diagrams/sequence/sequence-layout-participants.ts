/**
 * Sequence diagram layout — participant column geometry (Step 1 of
 * layoutSequence). Extracted from layout.ts to keep file size and per-function
 * complexity within limits; see layout.ts for the overall pipeline.
 *
 * @see .../sequencediagram/SequenceDiagram.java (upstream lays out
 * participants left-to-right by first-appearance order)
 */

import type {
  Participant,
  ParticipantGeo,
  SequenceDiagramAST,
  SequenceEvent,
} from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { fontSpecOf } from './sequence-layout-shared.js';
import {
  splitStereotypeLabels,
  wrapGuillemet,
} from '../../core/stereotype-decoration.js';

const LEFT_MARGIN = 30;
const LABEL_H_PADDING = 8; // min px between a message label edge and a lifeline
// Actors and database cylinders are taller than plain boxes.
const SEQUENCE_ACTOR_HEIGHT = 90;
const DB_HEIGHT = 80;
const DB_MIN_WIDTH = 40; // cylinders are narrower than plain boxes

export interface ParticipantLayoutResult {
  sortedParticipants: Participant[];
  participantGeos: ParticipantGeo[];
  participantMap: Map<string, ParticipantGeo>;
  participantIndex: Map<string, number>;
  maxParticipantHeight: number;
}

/**
 * Compute participant column geometry: x/width/height/centerX for every
 * participant, sorted into first-appearance order.
 */
export function computeParticipantLayout(
  ast: SequenceDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
): ParticipantLayoutResult {
  const sortedParticipants = [...ast.participants].sort(
    (a, b) => a.order - b.order,
  );
  const adjMaxLabelW: number[] = Array.from(
    { length: sortedParticipants.length - 1 },
    () => 0,
  );
  scanMessageLabels(ast.events, sortedParticipants, theme, measurer, adjMaxLabelW);

  const participantWidths = computeParticipantWidths(sortedParticipants, theme, measurer);
  const { participantGeos, participantMap, participantIndex, maxParticipantHeight } =
    positionParticipants(sortedParticipants, participantWidths, adjMaxLabelW, theme, measurer);

  return {
    sortedParticipants,
    participantGeos,
    participantMap,
    participantIndex,
    maxParticipantHeight,
  };
}

/**
 * Pre-scan: find the widest message label between each adjacent participant
 * pair so the gap can be widened enough for labels to fit between lifelines.
 * Mutates adjMaxLabelW in place; recurses into frame branches.
 */
function scanMessageLabels(
  events: readonly SequenceEvent[],
  sortedParticipants: Participant[],
  theme: Theme,
  measurer: StringMeasurer,
  adjMaxLabelW: number[],
): void {
  const fontSpec = fontSpecOf(theme);
  for (const ev of events) {
    if (ev.kind === 'message' && ev.from !== ev.to) {
      const fi = sortedParticipants.findIndex((p) => p.id === ev.from);
      const ti = sortedParticipants.findIndex((p) => p.id === ev.to);
      if (fi >= 0 && ti >= 0 && Math.abs(fi - ti) === 1) {
        const pairIdx = Math.min(fi, ti);
        const w = measurer.measure(ev.label, fontSpec).width;
        adjMaxLabelW[pairIdx] = Math.max(adjMaxLabelW[pairIdx]!, w);
      }
    } else if (ev.kind === 'frame') {
      for (const branch of ev.branches) {
        scanMessageLabels(branch, sortedParticipants, theme, measurer, adjMaxLabelW);
      }
    }
  }
}

/**
 * Pre-compute each participant's column width. Database cylinders use a
 * smaller minimum and tighter padding so they appear narrower relative to
 * plain participant boxes.
 */
function computeParticipantWidths(
  sortedParticipants: Participant[],
  theme: Theme,
  measurer: StringMeasurer,
): number[] {
  const fontSpec = fontSpecOf(theme);
  return sortedParticipants.map((p) => {
    const lw = Math.max(
      measurer.measure(p.display, fontSpec).width,
      ...visibleStereotypeLines(p, theme).map((l) => measurer.measure(l, fontSpec).width),
    );
    if (p.type === 'database') {
      return Math.max(DB_MIN_WIDTH, lw + theme.sequence.participantPadding);
    }
    return Math.max(
      theme.sequence.participantMinWidth,
      lw + theme.sequence.participantPadding * 2,
    );
  });
}

interface ParticipantColumnResult {
  participantGeos: ParticipantGeo[];
  participantMap: Map<string, ParticipantGeo>;
  participantIndex: Map<string, number>;
  maxParticipantHeight: number;
}

/** Lay out participant boxes left-to-right, then bottom-align their headers. */
function positionParticipants(
  sortedParticipants: Participant[],
  participantWidths: number[],
  adjMaxLabelW: number[],
  theme: Theme,
  measurer: StringMeasurer,
): ParticipantColumnResult {
  const participantGeos: ParticipantGeo[] = [];
  const participantMap = new Map<string, ParticipantGeo>();
  const participantIndex = new Map<string, number>();
  let currentX = LEFT_MARGIN;

  for (let i = 0; i < sortedParticipants.length; i++) {
    const p = sortedParticipants[i]!;
    const width = participantWidths[i]!;
    const geo = buildParticipantGeo(p, width, currentX, theme, measurer);

    participantGeos.push(geo);
    participantMap.set(p.id, geo);
    participantIndex.set(p.id, i);

    currentX = advancePastParticipant(currentX, i, participantWidths, adjMaxLabelW, theme);
  }

  // Use the tallest participant height so all lifelines start at the same Y.
  const maxParticipantHeight = Math.max(...participantGeos.map((g) => g.height));
  // Bottom-align headers: shift each participant's y so its bottom sits at
  // maxParticipantHeight. This preserves natural box proportions while
  // keeping all lifelines starting at the same Y coordinate.
  for (const g of participantGeos) {
    g.y = maxParticipantHeight - g.height;
  }

  return { participantGeos, participantMap, participantIndex, maxParticipantHeight };
}

/**
 * The DISPLAYED labels of a `<<...>>` run, guillemet-wrapped.
 *
 * `StereotypeDecoration#buildComplex` rewrites each chunk to just its LABEL
 * group, dropping the `(CHAR[,COLOR])` / `($sprite[,COLOR])` badge spec that
 * introduced it (`:143-182`) -- so `<< ($APIGateway, #CC2264) APIGateway >>`
 * displays as `«APIGateway»`, which is exactly what the jar emits for
 * `birocu-87-xubi808`. It also yields ONE label per chunk, so a stacked
 * `<<A>><<B>>` is two rows, and 3-bracket `<<<X>>>` chunks are invisible.
 *
 * `core/stereotype-decoration.ts` is that port, shared rather than
 * duplicated -- see its own header for why it no longer lives in the class
 * engine.
 */
function stereotypeLabels(raw: string): string[] {
  const inner = raw.replace(/^<</, '').replace(/>>$/, '');
  return splitStereotypeLabels(inner).map((l) => wrapGuillemet(l));
}

/**
 * The visible stereotype label, or undefined when the resolved style hides it.
 *
 * `AbstractTextualComponent`'s constructor runs the display through
 * `Display#withoutStereotypeIfNeeded(style)` (`:84`), which strips the
 * stereotype only on an explicit `ShowStereotype false` -- an unset value is
 * `ValueNull` and keeps it (`Display.java:127-136`). `theme.colors
 * .showStereotypeByTag` carries exactly the tags that declared the property,
 * so an absent entry is upstream's absent value.
 *
 * `resolveStyleCascade` cleans the token itself, so the raw `<<tag>>` is the
 * lookup key with the guillemets trimmed here and nothing else -- no
 * dependency on the class engine's stereotype splitter.
 */
function visibleStereotypeLines(p: Participant, theme: Theme): readonly string[] {
  if (p.stereotype === undefined) return [];
  const byTag = theme.colors.showStereotypeByTag;
  if (byTag !== undefined) {
    const tag = p.stereotype.replace(/^<<\s*/, '').replace(/\s*>>$/, '').trim().toLowerCase();
    if (byTag[tag] === false) return [];
  }
  return stereotypeLabels(p.stereotype);
}

/** Build the geometry for a single participant column at a given x offset. */
function buildParticipantGeo(
  p: Participant,
  width: number,
  currentX: number,
  theme: Theme,
  measurer: StringMeasurer,
): ParticipantGeo {
  const fontSpec = fontSpecOf(theme);
  const measured = measurer.measure(p.display, fontSpec);
  // A visible stereotype is a SECOND run above the name
  // (`CommandParticipant.java:174-181`; the jar draws `«APIGateway»` on its
  // own line in `birocu-87-xubi808`), so the head grows by one line.
  const stereoLines = visibleStereotypeLines(p, theme);
  const boxHeight = measured.height * (1 + stereoLines.length) + 20;
  const pHeight =
    p.type === 'actor' ? Math.max(boxHeight, SEQUENCE_ACTOR_HEIGHT) :
    p.type === 'database' ? Math.max(boxHeight, DB_HEIGHT) :
    boxHeight;
  const centerX = currentX + width / 2;

  return {
    id: p.id,
    display: p.display,
    ...(stereoLines.length > 0 ? { stereotypeLines: stereoLines } : {}),
    type: p.type,
    x: currentX,
    y: 0,
    width,
    height: pHeight,
    centerX,
  };
}

/**
 * Compute the x offset for the participant after index `i`, widening the
 * natural gap when needed so the widest adjacent message label still fits.
 * Returns `currentX` unchanged for the last participant (matches original:
 * no further column follows it).
 */
function advancePastParticipant(
  currentX: number,
  i: number,
  participantWidths: number[],
  adjMaxLabelW: number[],
  theme: Theme,
): number {
  if (i >= participantWidths.length - 1) return currentX;

  const width = participantWidths[i]!;
  const nextWidth = participantWidths[i + 1]!;
  // Minimum center-to-center gap so the widest adjacent message label fits.
  const minCenterGap = (adjMaxLabelW[i] ?? 0) + LABEL_H_PADDING * 2;
  const naturalCenterGap = width / 2 + theme.sequence.participantGap + nextWidth / 2;
  const centerGap = Math.max(naturalCenterGap, minCenterGap);
  const edgeGap = centerGap - width / 2 - nextWidth / 2;
  return currentX + width + edgeGap;
}

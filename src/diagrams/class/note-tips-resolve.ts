/**
 * Draw-time resolution of a `'TIPS'` leaf against its host -- the port of
 * `EntityImageTips#drawU`'s per-tip loop as a PURE function of the finished
 * geometry, consumed by both draw passes: `class-ink-box.ts#buildInkBox`
 * (this port's `LimitFinder` -- a dropped tip contributes no ink, exactly as
 * upstream's early `return` draws nothing into the limit finder) and
 * `renderer.ts` (the SVG pass). Nothing here runs during the geo build:
 * mission `note-leaf-model` D3 moved this out of `mapNoteGeos`, which used
 * to need every classifier's position + row text BEFORE a note geo could
 * exist -- upstream has no such phase, `GeneralImageBuilder#
 * createEntityImageBlock` hands `EntityImageTips` the `bibliotekon`
 * (`:219-220`) and everything below happens inside `drawU`.
 *
 * Upstream shape being mirrored, line by line of `drawU`:
 *  - `bibliotekon.getOnlyOther(tmp)` / `bibliotekon.getNode(other)` null ->
 *    "Error1"/"Error2" `return` BEFORE the loop: a host that is not a drawn
 *    classifier drops the WHOLE group (jar-verified 2026-08-15 with the
 *    pinned 1.2026.7beta11 jar: `note left of P::m` on a package and a
 *    `remove`d host both print `Error2 in EntityImageTips` and draw no tip,
 *    the canvas shrinking to the remaining leaves).
 *  - `position.reverseDirection()`, then `if (direction == RIGHT && x < 0)
 *    direction = direction.getInv()` -- {@link resolveTipDirection}.
 *  - per tip, in `getTips()` order: `nodeOther.getBestMatch(member)` null ->
 *    `return` (this AND every later tip in the group draw nothing);
 *    `pp1 = (0, dim.height/2)`; `pp2 = (positionOther - positionMe) +
 *    (memberPosition.getMaxX() | getMinX(), memberPosition.getCenterY() -
 *    height)` -- {@link tipAnchor}; `height += dim.height + ySpacing`.
 *    The running `height` term is exactly this tip's own stacked `y` minus
 *    the group's top, which the geo build already folded into `NoteGeo.y`
 *    (`note-layout-tip.ts#mapGroupNoteGeos` advances by `height +
 *    OPALE_Y_SPACING` per tip), so `positionMe.y + height == note.y`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageTips.java#drawU
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/GeneralImageBuilder.java:219-220
 */
import type { NotePosition } from './ast.js';
import { getBestMatchRow, type OpalePoint } from './note-opale.js';
import { ROW_TEXT_LEFT_MARGIN } from './class-layout-helpers.js';
import type { NoteGeo, ClassifierAnchor, TipRequest } from './note-layout-types.js';

/** A resolved tip's notch, LOCAL to the note's own (0,0)-at-top-left frame
 *  (`note-opale.ts#OpaleConnector`) -- what `renderer-note.ts#renderTipNote`
 *  draws. */
export interface TipShape {
  direction: 'left' | 'right';
  pp1: OpalePoint;
  pp2: OpalePoint;
}

/** `'dropped'` == `EntityImageTips#drawU` returned before drawing this tip:
 *  no box, no notch, no text, no ink. */
export type TipResolution = TipShape | 'dropped';

/** One host row as `memberAnchorRows` yields it -- the `{text, y, width,
 *  indent}` shape both classic `rows` and `enhancedBody` parts share. */
type AnchorRow = { text: string; y: number; width?: number; indent: number };

/**
 * G2 N47: a host's member rows for `::member` tip-note matching --
 * `host.rows.slice(1)` (drops the header row) for a classic-body
 * classifier, or `host.enhancedBody`'s OWN flattened row list for an
 * enhanced-body one (whose `host.rows` carries no member content at all,
 * see {@link ClassifierAnchor.enhancedBody}'s doc comment). Tree rows
 * (`EnhancedTreePart`) participate too -- a tree leaf's row is exactly as
 * matchable as a plain enhanced row, same `{text, y, indent, width}` shape.
 */
function memberAnchorRows(host: ClassifierAnchor): ReadonlyArray<AnchorRow> {
  if (host.enhancedBody === undefined) return host.rows.slice(1);
  const out: AnchorRow[] = [];
  for (const part of host.enhancedBody.parts) {
    if (part.kind === 'rows' || part.kind === 'tree') out.push(...part.rows);
  }
  return out;
}

/**
 * A group's shared direction -- `EntityImageTips.java`'s `getPosition()`/
 * `reverseDirection()` plus its one-sided flip correction (`if (direction ==
 * Direction.RIGHT && x < 0) direction = direction.getInv()`). Every member of
 * a group shares the host, side and `x`, so this is computed once per group.
 * @see ~/git/plantuml/.../svek/image/EntityImageTips.java#drawU
 */
function resolveTipDirection(position: NotePosition, hostX: number, noteX: number): 'left' | 'right' {
  // Position.LEFT.reverseDirection() === RIGHT; Position.RIGHT.reverseDirection() === LEFT.
  const initial: 'left' | 'right' = position === 'left' ? 'right' : 'left';
  const xRaw = hostX - noteX;
  return initial === 'right' && xRaw < 0 ? 'left' : initial;
}

/**
 * The zigzag notch's host-side anchor point (`pp2`, LOCAL to the note's own
 * frame) for one resolved member-tip row.
 *
 * G2 N34: jar's real anchor is the row's OWN rendered bounding box
 * (`memberPosition.getMinX()`/`getMaxX()`, `EntityImageTips.java#drawU`).
 * `getMinX()` is the ROW's own left edge -- the icon-zone reservation
 * STARTS there whether or not this particular row has an icon, so it
 * stays the flat `ROW_TEXT_LEFT_MARGIN` constant regardless (jar-verified
 * `sanusa-54-keda128`: icon rows, anchor lands at `host.x + 6`, NOT
 * `host.x + row.indent`). `getMaxX()` is the row's TEXT run's own right
 * edge -- `row.indent` (icon-zone-aware) + the text's own measured width
 * (jar-verified `rubuxe-58-peba652`: `+attribute`, anchor lands at `host.x
 * + row.indent + row.width`, NOT `host.x + ROW_TEXT_LEFT_MARGIN +
 * row.width`). The two ends of the SAME row's bounding box are simply
 * measured from different reference points upstream -- not a symmetric
 * pair.
 * @see ~/git/plantuml/.../svek/image/EntityImageTips.java#drawU
 */
function tipAnchor(host: ClassifierAnchor, note: NoteGeo, req: TipRequest, row: AnchorRow, direction: 'left' | 'right'): OpalePoint {
  const rowCenterY = row.y - req.baselineOffset + req.rowHeight / 2;
  const rowMinX = ROW_TEXT_LEFT_MARGIN;
  const rowMaxX = row.indent + (row.width ?? 0);
  return {
    x: host.x - note.x + (direction === 'left' ? rowMaxX : rowMinX),
    y: host.y - note.y + rowCenterY,
  };
}

/** `EntityImageTips#drawU`'s loop over ONE group's tips, in stacking order:
 *  the first tip whose `::member` matches no host row aborts every later
 *  one (`bestMatch == null` -> `return`, mid-loop). */
function resolveGroup(members: readonly NoteGeo[], host: ClassifierAnchor, out: Map<string, TipResolution>): void {
  const rows = memberAnchorRows(host);
  let aborted = false;
  for (const note of members) {
    const req = note.tipRequest!;
    const match = aborted ? undefined : getBestMatchRow(rows, req.member);
    if (match === undefined) {
      aborted = true;
      out.set(note.id, 'dropped');
      continue;
    }
    const direction = resolveTipDirection(req.position, host.x, note.x);
    out.set(note.id, {
      direction,
      pp1: { x: 0, y: note.height / 2 },
      pp2: tipAnchor(host, note, req, match, direction),
    });
  }
}

/**
 * Resolve every `'TIPS'` leaf in `notes` against `classifiers`. Returns one
 * entry per `'TIPS'` geo (never for a `'NOTE'`), keyed by `NoteGeo.id`.
 *
 * Grouping: upstream keeps ONE `TIPS` entity per (host, side) --
 * `CommandFactoryTipOnEntity`'s `idShort + "$$$" + position` quark -- with
 * every `::member` line a tip inside it, drawn in insertion order. This port
 * keeps one geo per tip, so the group is recovered here by (`target`,
 * `position`) in ARRAY order, which is the same stacking order
 * `note-layout-groups.ts#groupNotes` laid them out in (that module's own
 * `mergeKey`, minus the `implicitTarget` exclusion a `::member` note can
 * never trigger -- it always carries an explicit `of`).
 */
/** Recover upstream's one-`TIPS`-entity-per-(host, side) grouping from the
 *  flat geo array -- see {@link resolveTips}'s own doc comment. */
function groupTips(notes: readonly NoteGeo[]): NoteGeo[][] {
  const groups = new Map<string, NoteGeo[]>();
  for (const note of notes) {
    if (note.kind !== 'tips' || note.tipRequest === undefined) continue;
    const key = `${note.target ?? ''}|${note.tipRequest.position}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(note);
    groups.set(key, bucket);
  }
  return [...groups.values()];
}

export function resolveTips(
  notes: readonly NoteGeo[],
  classifiers: ReadonlyArray<ClassifierAnchor>,
): ReadonlyMap<string, TipResolution> {
  const out = new Map<string, TipResolution>();
  const groups = groupTips(notes);
  if (groups.length === 0) return out;
  const hostById = new Map(classifiers.map((c) => [c.id, c]));
  for (const members of groups) {
    const target = members[0]!.target;
    const host = target === undefined ? undefined : hostById.get(target);
    // `bibliotekon.getOnlyOther`/`getNode(other)` null -> "Error1"/"Error2"
    // return BEFORE the loop: the whole group draws nothing.
    if (host === undefined) {
      for (const note of members) out.set(note.id, 'dropped');
      continue;
    }
    resolveGroup(members, host, out);
  }
  return out;
}

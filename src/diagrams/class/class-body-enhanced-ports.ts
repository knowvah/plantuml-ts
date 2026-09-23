/**
 * class-body-enhanced-ports.ts — CDD B7FU-R2 item (a) (coordinator, journal
 * row 161): the enhanced-body half of the `::member` port-election seam
 * `class-port-rows.ts` already ports for the CLASSIC (fields/methods)
 * path. Split out of `class-body-enhanced-layout.ts` purely to keep that
 * file under this project's 500-line cap (same precedent as `class-body-
 * enhanced-geometry.ts`/`class-body-enhanced-embeds.ts`'s own splits from
 * the SAME parent file).
 *
 * `buildEnhancedBodyResult` (`class-layout-generic-classifier.ts:310-312`)
 * never published a port-election input for an enhanced body, so
 * `FlatBar::prop`-shaped edge endpoints on an enhanced-body classifier
 * (`juxora-90-fisu720`) silently found no elected row and attached to the
 * wrong one (`class-port-rows.ts#classFamilyPortRows`'s own
 * `measured.portMemberSections !== undefined` gate was simply never true
 * for these classifiers). This file supplies that input, in the SAME
 * `{text, top, height}` per-member shape `MethodsOrFieldsArea#getPorts`
 * (java:194-211) elects from -- `class-port-rows.ts`'s own `electedFor`/
 * `sortShortNamesBySize`/`Ports` primitives are the reused election
 * mechanism (see that file's own new `enhancedBodyPortRows` consumer);
 * this file supplies ONLY the per-row `{text, top, height}` triples, never
 * re-deriving the election itself.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/MethodsOrFieldsArea.java:194-211
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyEnhanced1.java (getArea/buildTextBlock -- one MethodsOrFieldsArea per rows-block)
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockVertical.java:106-117 (getPorts -- per-block translateY(y), y += block's own FULL height)
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockMarged.java:99-102 (getPorts -- translateY(top))
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockLineBefore.java:102-106 (getPorts -- pass-through)
 */
import type { Member } from './ast.js';
import type { MemberRowBuild } from './class-member-creole.js';
import type { DotInputPortRow } from '../../core/graph-layout.types.js';
import { Ports } from '../../core/svek/Ports.js';
import { MethodsOrFieldsArea } from '../../core/cucadiagram/MethodsOrFieldsArea.js';
import type { Elected } from '../../core/cucadiagram/Elected.js';

/**
 * One enhanced-body member row's port-election input -- `text` is the SAME
 * election string `class-port-rows.ts#electionTextFor`'s class-family
 * branch computes (`formatMemberText(member, false)`), identical to
 * `class-body-enhanced-layout.ts#buildRowsBlockRows`'s own `texts[i]`
 * since that call's default `keepVisibilityChar = false` matches exactly
 * -- reused directly, never recomputed. `top`/`height` mirror
 * `MethodsOrFieldsArea#getPorts`'s own `y`/`dim.getHeight()` accumulation
 * (java:194-211): `top` is this row's OWN top (BEFORE the row-height
 * increment), not its baseline -- `Ports#add`'s `position` parameter,
 * which `MethodsOrFieldsArea#getPorts` feeds from that SAME pre-increment
 * `y`. Coordinate space: the SAME `geo.y`-relative (classifier-top-
 * relative, `headerRowHeight`-inclusive) space every `ClassifierGeo.rows[]
 * .y` already uses -- matches `class-port-rows.ts#classPortRows`'s own
 * `position` convention (`compartmentTop` starts at the caller's
 * `headerHeight`), so no further translation is needed once these values
 * reach `class-layout-generic-classifier.ts`.
 */
export interface EnhancedPortMemberInput {
  readonly text: string;
  readonly top: number;
  readonly height: number;
}

/**
 * One rows-block's port-election inputs, in LOCAL (pre-translate)
 * coordinates -- built alongside `class-body-enhanced-layout.ts
 * #buildRowsBlockRows`'s own `rows[]` loop, over the SAME `members`/
 * `texts`/`builds` triples (embeds already excluded by that function's own
 * `extractEmbeds` call, matching `MethodsOrFieldsArea`'s ctor separating
 * embedded blocks from `this.members` before `getPorts` ever runs, java:
 * 109-123).
 */
export function buildPortMembers(
  members: readonly Member[],
  texts: readonly string[],
  builds: readonly MemberRowBuild[],
  startTop: number,
): readonly EnhancedPortMemberInput[] {
  let top = startTop;
  return members.map((_m, i) => {
    const height = builds[i]!.height;
    const row: EnhancedPortMemberInput = { text: texts[i]!, top, height };
    top += height;
    return row;
  });
}

/** Same shift as `class-body-enhanced-layout.ts#translateRows`/
 *  `translateEmbeds`, for a rows-block's own port-election inputs (built
 *  at the origin by the `layoutPlainDividerRows`/`layoutTitledDividerRows`
 *  probe, same reason -- see those functions' own doc comments). */
export function translatePortMembers(
  members: readonly EnhancedPortMemberInput[],
  contentTop: number,
): readonly EnhancedPortMemberInput[] {
  return contentTop === 0 ? members : members.map((m) => ({ ...m, top: m.top + contentTop }));
}

/** `MethodsOrFieldsArea#getElected`/`#sortBySize` reused via the SAME
 *  prototype-call trick `class-port-rows.ts#electedFor`'s own doc comment
 *  justifies in full (both methods are pure over their own parameters) --
 *  NOT imported from that file to avoid a circular import (`class-port-
 *  rows.ts` itself calls INTO this file's {@link enhancedBodyPortRows}). */
function electedFor(memberText: string, sortedShortNames: readonly string[]): Elected | null {
  return MethodsOrFieldsArea.prototype.getElected(memberText, sortedShortNames);
}

/** @see {@link electedFor}'s doc comment -- same reuse rationale, for the
 *  private `sortBySize` half. */
function sortShortNamesBySize(shortNames: Iterable<string>): string[] {
  const proto = MethodsOrFieldsArea.prototype as unknown as { sortBySize(all: Iterable<string>): string[] };
  return proto.sortBySize(shortNames);
}

/**
 * The port bands of an ENHANCED body's rows-blocks -- `class-port-rows.ts
 * #classFamilyPortRows`'s dispatch target when `MeasuredClassifier
 * .enhancedPortRows` is set. Unlike that file's own `classPortRows` (the
 * classic fields/methods path), `members[].top` is ALREADY absolute
 * (`EnhancedPortMemberInput`'s own doc comment) -- an enhanced body's real
 * per-block margin/divider geometry (`ClassifierBodyGeometry.derive
 * HeightOffsets`, block-by-block) does not match the classic path's flat
 * `SECTION_MARGIN`-per-compartment formula, so no position re-derivation
 * happens here: this function ONLY runs the election
 * (`MethodsOrFieldsArea#getPorts`, java:194-211: `ports.add(elected
 * .getShortName(), elected.getScore(), y, dim.getHeight())` per elected
 * row) over the supplied, already-correct positions.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/MethodsOrFieldsArea.java:194-211
 */
export function enhancedBodyPortRows(
  members: readonly EnhancedPortMemberInput[],
  portShortNames: Iterable<string>,
): DotInputPortRow[] {
  const sortedShortNames = sortShortNamesBySize(portShortNames);
  if (sortedShortNames.length === 0) return [];
  const ports = new Ports();
  for (const member of members) {
    const elected = electedFor(member.text, sortedShortNames);
    if (elected !== null) ports.add(elected.getShortName(), elected.getScore(), member.top, member.height);
  }
  return ports.getAllPortGeometry().map((g) => ({ id: g.getId(), position: g.getPosition(), height: g.getHeight() }));
}

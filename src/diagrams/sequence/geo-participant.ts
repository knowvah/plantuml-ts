/**
 * PARTICIPANT geometry — the head/foot boxes and their stereotype badges.
 *
 * One of the four per-renderer geometry modules `geo.ts` was split into
 * (mission `sequence-text-and-y-convergence`, D8): this one pairs with
 * `renderer-participant-shapes.ts`, so the task that owns that renderer owns
 * this type too and no two Phase A tasks contend on one file.
 *
 * Re-exported by `geo.ts`, which is re-exported by `ast.ts`, so every
 * pre-existing `from './ast.js'` import still resolves these names.
 */

import type { Paint } from '../../core/paint.js';
import type { ParticipantType } from './ast.js';

/**
 * A participant's stereotype BADGE, in `StereotypeDecoration`'s two forms.
 *
 * `Display#createStereotype` picks between them on `stereotype.isSpotted()`:
 * a `CircledCharacter` for `<<(C,#color) Label>>`, otherwise the sprite from
 * `stereotype.getSprite(...)` (`Display.java:671-689`). Both occupy a box the
 * name block is pushed right of, so both carry `width`/`height`.
 */
export type ParticipantBadge =
  | { readonly kind: 'sprite'; readonly dataUri: string; readonly width: number; readonly height: number }
  /** The jar draws the circle and NOT the character: across
   *  `nimoxu-60-xale291`, `fakova-98-suze610` and `xakuro-97-tado489` no
   *  `<text>` carries the declared letter, only a filled `<ellipse>`. */
  | { readonly kind: 'char'; readonly color: string | undefined; readonly width: number; readonly height: number };

export interface ParticipantGeo {
  id: string;
  display: string;
  type: ParticipantType;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  /** Displayed form of {@link Participant.stereotype}: one guillemet-wrapped
   *  entry per `<<...>>` chunk, badge specs already stripped
   *  (`core/stereotype-decoration.ts`). Absent when there is none, when every
   *  chunk is invisible, or when the style hides it. */
  stereotypeLines?: readonly string[];
  /**
   * The box's resolved fill and stroke.
   *
   * `Participant#getUsedStyles` merges the kind's style signature -- `root,
   * element, sequenceDiagram, <kind>` for every kind
   * (`ParticipantType.java:55-80`) -- and then lets the participant's OWN
   * colours override it (`eventuallyOverride(getColors())`, `:88`). So the
   * precedence is inline `#color` > `<style> <kind> {}` bucket > theme
   * default, resolved in layout so the sprite badge's gradient can start
   * from the same value the box is painted with.
   */
  background: Paint;
  border: Paint;
  /** The rasterised sprite badge a `<<($name) Label>>` stereotype declares,
   *  drawn LEFT of the name block (`TextBlockSprited.java:65-77`). Absent
   *  when there is none, or when the name does not resolve in the registry. */
  badge?: ParticipantBadge;
}

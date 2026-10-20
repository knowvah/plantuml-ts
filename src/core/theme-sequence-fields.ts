/**
 * `Theme.sequence` field shape — split out of theme.ts (cdd-T30) to keep
 * that file under the project's 500-line file-size cap. See theme.ts's own
 * doc comment for the full module map. Only the fields with no `Style`
 * counterpart remain: every other sequence value is read through the
 * per-event `Style` path (`plantuml.skin`).
 */

export interface ThemeSequenceFields {
  /**
   * Horizontal gap between adjacent participant boxes.
   *
   * `LivingSpaces#addConstraints:61-71` is the whole rule:
   * `current.getPosA().ensureBiggerThan(previous.getPosE().addFixed(10))`.
   * `posA` is `posB - marginBefore` and `posE` is `posD + marginAfter`
   * (`LivingSpace.java:292-298`), with `posB`/`posD` the box's left and
   * right edges (`:238-248`) and the two margins zero unless an englober
   * or a self-message overflow widened them
   * (`Doll.java:220-221`, `CommunicationTileSelf.java:208-213`). So for
   * ordinary participants the constraint is `nextLeft >= prevRight + 10`:
   * a ten-pixel gap between box EDGES.
   */
  participantGap: number;
  /** Width of the activation box drawn on a lifeline */
  activationWidth: number;
}

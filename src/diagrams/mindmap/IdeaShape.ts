/**
 * IdeaShape — whether a mindmap node draws a box around its label, no box
 * at all ("boxless"), or a pseudo shape. Faithful port of the 3-value enum
 * plus its single static factory.
 *
 * As-const object + string union, not a TS `enum` (project convention,
 * `src/core/abel/Direction.ts`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/IdeaShape.java:38-47
 */
export const IdeaShape = {
  BOX: 'BOX',
  NONE: 'NONE',
  PSEUDO: 'PSEUDO',
} as const;
export type IdeaShape = (typeof IdeaShape)[keyof typeof IdeaShape];

/**
 * `IdeaShape.fromDesc(String)` — the `_` marker (an underscore captured by
 * every mindmap node command's optional `SHAPE` regex group) means "no box"
 * (`NONE`); anything else, including `undefined` for an absent capture
 * group (Java's `"_".equals(s)` is null-safe), means `BOX`. `PSEUDO` has no
 * textual form and is never produced here, matching upstream (no caller of
 * `fromDesc` ever observes `PSEUDO`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/IdeaShape.java:41-46
 */
export function fromDesc(s: string | undefined): IdeaShape {
  if (s === '_') return IdeaShape.NONE;
  return IdeaShape.BOX;
}

/**
 * EntityPosition — where a leaf sits relative to its parent group's
 * frontier: a normal inner node, or one of the border-attached
 * entry/exit points, pins, expansion nodes, and ports.
 *
 * Upstream: abel/EntityPosition.java (9 values, :54). As-const object +
 * string union per project convention (`src/core/skin/ActorStyle.ts`);
 * methods become free functions.
 *
 * SI1/T2 (batch 1); ADR-1 — the base's own faithful abel version
 * (the state engine's `state-entity-position.ts` is untouched).
 *
 * DEFERRED members (reported in the T2 report; ActorStyle.ts precedent —
 * blocked, not skipped):
 * - `drawSymbol(UGraphic, Rankdir)` (:82-118) and
 *   `getDimension(Rankdir)` (:120-128) — `Rankdir`
 *   (klimt/geom/Rankdir.java, 2 values) is unported and its home
 *   `src/core/klimt/geom/` is T4's write-set this batch, so the
 *   parameter type cannot be created here. The drawing deps
 *   (`UGraphic`, `UEllipse.build`, `URectangle.build`,
 *   `ULine.hline/vline`, `UTranslate`, `XPoint2D`) are already ported.
 * - `getShapeType()` (:143-150) — needs the full 12-value
 *   svek/ShapeType.java incl. `RECTANGLE_PORT`; the existing port
 *   (`src/core/svek/image/EntityImageDescriptionSupport.ts`) carries
 *   only 5 values and is an engine file this task must not modify.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPosition.java:54
 */
export const EntityPosition = {
  NORMAL: 'NORMAL',
  ENTRY_POINT: 'ENTRY_POINT',
  EXIT_POINT: 'EXIT_POINT',
  INPUT_PIN: 'INPUT_PIN',
  OUTPUT_PIN: 'OUTPUT_PIN',
  EXPANSION_INPUT: 'EXPANSION_INPUT',
  EXPANSION_OUTPUT: 'EXPANSION_OUTPUT',
  PORTIN: 'PORTIN',
  PORTOUT: 'PORTOUT',
} as const;
export type EntityPosition = (typeof EntityPosition)[keyof typeof EntityPosition];

/**
 * `EntityPosition.RADIUS` — the entry/exit-point circle radius.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPosition.java:56
 */
export const RADIUS = 6;

/**
 * `EntityPosition.getInputs()` — a fresh set per call, like upstream's
 * `EnumSet.of`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPosition.java:58-60
 */
export function getInputs(): Set<EntityPosition> {
  return new Set([
    EntityPosition.ENTRY_POINT,
    EntityPosition.INPUT_PIN,
    EntityPosition.EXPANSION_INPUT,
    EntityPosition.PORTIN,
  ]);
}

/**
 * `EntityPosition.getOutputs()`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPosition.java:62-64
 */
export function getOutputs(): Set<EntityPosition> {
  return new Set([
    EntityPosition.EXIT_POINT,
    EntityPosition.OUTPUT_PIN,
    EntityPosition.EXPANSION_OUTPUT,
    EntityPosition.PORTOUT,
  ]);
}

/**
 * `EntityPosition.getNormals()`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPosition.java:66-68
 */
export function getNormals(): Set<EntityPosition> {
  return new Set([EntityPosition.NORMAL]);
}

/**
 * `EntityPosition#isNormal()`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPosition.java:70-72
 */
export function isNormal(position: EntityPosition): boolean {
  return position === EntityPosition.NORMAL;
}

/**
 * `EntityPosition#isInput()`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPosition.java:74-76
 */
export function isInput(position: EntityPosition): boolean {
  return getInputs().has(position);
}

/**
 * `EntityPosition#isOutput()`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPosition.java:78-80
 */
export function isOutput(position: EntityPosition): boolean {
  return getOutputs().has(position);
}

/**
 * `EntityPosition.fromStereotype(String)` — maps the border-position
 * stereotype labels, case-insensitively (`equalsIgnoreCase`); the
 * dormant `<<port>>` label throws (upstream
 * `UnsupportedOperationException`), anything else is `NORMAL`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPosition.java:153-176
 */
export function fromStereotype(label: string): EntityPosition {
  const lower = label.toLowerCase();
  if (lower === '<<port>>') throw new Error('UnsupportedOperationException: <<port>>');

  if (lower === '<<entrypoint>>') return EntityPosition.ENTRY_POINT;

  if (lower === '<<exitpoint>>') return EntityPosition.EXIT_POINT;

  if (lower === '<<inputpin>>') return EntityPosition.INPUT_PIN;

  if (lower === '<<outputpin>>') return EntityPosition.OUTPUT_PIN;

  if (lower === '<<expansioninput>>') return EntityPosition.EXPANSION_INPUT;

  if (lower === '<<expansionoutput>>') return EntityPosition.EXPANSION_OUTPUT;

  return EntityPosition.NORMAL;
}

/**
 * `EntityPosition#isPort()` — `PORTIN`/`PORTOUT` (the commented-out
 * `PORT` value is preserved upstream only as a comment).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPosition.java:182-184
 */
export function isPort(position: EntityPosition): boolean {
  return position === EntityPosition.PORTIN || position === EntityPosition.PORTOUT;
}

/**
 * `EntityPosition#usePortP()` — ports plus entry/exit points use the
 * svek `P`-port naming scheme.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPosition.java:186-188
 */
export function usePortP(position: EntityPosition): boolean {
  return (
    isPort(position) ||
    position === EntityPosition.EXIT_POINT ||
    position === EntityPosition.ENTRY_POINT
  );
}

/**
 * `EntityImageJson` / `TextBlockCucaJSon` — the margins a `json` leaf
 * embedded in a cuca diagram insets its cells and title by.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageJson.java
 *
 * Both the class and state engines render json leaves, and each declared
 * this whole set locally. They are one upstream shape: `EntityImageJson` is
 * dispatched from `GeneralImageBuilder` like any other leaf image, so the
 * numbers are not per-engine and never were.
 *
 * Deliberately NOT merged with the `map` leaf's own margins, which hold the
 * same values: `JSON_NAME_MARGIN` and `MAP_NAME_MARGIN` are independently
 * defined upstream (the class engine's own comment already said so), and
 * equal values are not grounds to merge.
 */

/** `EntityImageJson:97` — `withMargin(display.create(...), 2, 2)` on the title. */
export const JSON_NAME_MARGIN = 2;

/** `TextBlockCucaJSon#getTextBlock` — `withMargin(result, 5, 2)`, applied to
 *  BOTH a key cell and a scalar value cell. */
export const JSON_CELL_MARGIN_X = 5;
export const JSON_CELL_MARGIN_Y = 2;

/** `EntityImageJson:225` — `private int xMarginCircle = 5`. */
export const JSON_X_MARGIN_CIRCLE = 5;

/** `BodierLikeClassOrObject#marginEmptyFieldsOrMethod`, substituted by
 *  `getMethodOrFieldHeight` when the entries area is empty. Unlike `map`,
 *  this DOES fire for `json` — leafType JSON is not excluded, only MAP is. */
export const JSON_EMPTY_HEIGHT_FALLBACK = 13;

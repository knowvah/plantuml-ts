/**
 * activity-string-bounder -- the ONE `StringBounder` an activity render
 * measures with, layout and draw alike.
 *
 * Upstream never builds a measurer of its own inside the activity engine:
 * every ftile is sized through the factory's `getStringBounder()`
 * (`FtileFactoryDelegator.java:223-225` -> `VCompactFactory.java:83-85,91`)
 * and every `drawU` re-measures through `ug.getStringBounder()` -- the same
 * bounder, since `Swimlanes#drawU` builds the factory FROM that `UGraphic`
 * (`Swimlanes.java:239,246`: `getFtileFactory(ug.getStringBounder())`). This port's `theme` is the value threaded through every sizer
 * and drawer the way `ug` is upstream, so the render's injected measurer
 * (`options.measurer` -> `activityPlugin.layoutSync`) rides on it under a
 * module-private symbol: invisible to `Object.keys`/JSON, copied by the
 * object spreads that derive a theme (`{ ...theme, sprites }`).
 *
 * A theme without it is a caller that skipped {@link withActivityMeasurer}
 * -- a programming error, so {@link activityMeasurer} throws rather than
 * falling back to a measurer of its own.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:239-246
 */
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';

const MEASURER_KEY: unique symbol = Symbol('activity.stringBounder');

type ThemeWithMeasurer = Theme & { readonly [MEASURER_KEY]?: StringMeasurer };

/** `theme` carrying `measurer` as the render's string bounder. */
export function withActivityMeasurer<T extends Theme>(theme: T, measurer: StringMeasurer): T {
  return { ...theme, [MEASURER_KEY]: measurer };
}

/** The render's string bounder (`ug.getStringBounder()`). */
export function activityMeasurer(theme: Theme): StringMeasurer {
  const measurer = (theme as ThemeWithMeasurer)[MEASURER_KEY];
  if (measurer === undefined) {
    throw new Error('activity: theme carries no measurer -- wrap it with withActivityMeasurer');
  }
  return measurer;
}

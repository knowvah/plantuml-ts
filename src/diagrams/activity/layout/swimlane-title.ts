/**
 * The text a swimlane title draws and is measured by: the lane's
 * `|name|LABEL` display when it has one, else its name, each with
 * `[[url label]]` creole links resolved (SLURL, `nesozi-09-zezu092`).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlane.java:60,74-80
 *   -- the display starts as the name and `setDisplay` replaces it.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:285-293
 *   -- `getTitle` creates the title from `swimlane.getDisplay()`.
 */
import { resolveInlineLinks } from '../../../core/url/inline-links.js';

export function swimlaneTitleText(name: string, display: string | undefined): string {
  return resolveInlineLinks(display ?? name);
}

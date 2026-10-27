import type { SName } from '../../core/style/SName.js';
import type { Style } from '../../core/style/Style.js';

/**
 * GanttStyle -- style lookup by one or two `SName` path elements (the Java
 * interface's two overloads are one method with an optional second name).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttStyle.java:35-41
 */
export interface GanttStyle {
  getStyle(param: SName, param2?: SName): Style;
}

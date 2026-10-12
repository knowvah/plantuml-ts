import { ELK_CORE_OPTIONS_PACKAGE, elkEnum } from '../../../elk-object.js';

/**
 * `HierarchyHandling.INCLUDE_CHILDREN` is the real ELK constant
 * (`Reflect.field`), passed through unchanged (`ElkWithProperty.java:43-44`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/core/options/HierarchyHandling.java:5-11
 */
export const HierarchyHandling = {
  INCLUDE_CHILDREN: elkEnum(`${ELK_CORE_OPTIONS_PACKAGE}.HierarchyHandling`, 'INCLUDE_CHILDREN'),
} as const;

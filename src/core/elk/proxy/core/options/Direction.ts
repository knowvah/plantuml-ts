import { ELK_CORE_OPTIONS_PACKAGE, elkEnum } from '../../../elk-object.js';

/**
 * `Direction.DOWN` is the real ELK constant (`Reflect.field`), not a proxy
 * enum, so `ElkWithProperty#setProperty` passes it through unchanged
 * (`ElkWithProperty.java:43-44`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/core/options/Direction.java:5-9
 */
export const Direction = {
  DOWN: elkEnum(`${ELK_CORE_OPTIONS_PACKAGE}.Direction`, 'DOWN'),
} as const;

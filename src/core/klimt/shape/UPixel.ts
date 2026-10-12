import type { UShape } from '../UShape.js';

/**
 * UPixel — a single pixel at the graphic's current translate: an empty
 * `UShape` marker whose meaning lives entirely in its drivers
 * (`driver-pixel-svg.ts#DriverPixelSvg`, `LimitFinder`'s `addPoint(x, y)`).
 *
 * Upstream: klimt/shape/UPixel.java — `public class UPixel implements
 * UShape {}`, ported in full (no members exist upstream). Being a class,
 * not an object literal, matters: `UGraphicSvg`'s driver map and
 * `LimitFinder#draw` both dispatch on its runtime constructor.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/UPixel.java:40-41
 */
export class UPixel implements UShape {}

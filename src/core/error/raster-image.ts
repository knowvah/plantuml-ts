/**
 * A bundled raster the error pages draw: its pixel size (`PortableImage
 * #getWidth`/`#getHeight`) and the data URI the jar's SVG embeds for it.
 */
export interface RasterImage {
  readonly width: number;
  readonly height: number;
  readonly href: string;
}

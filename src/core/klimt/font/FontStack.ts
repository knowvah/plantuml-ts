/**
 * FontStack — a comma-separated font-family definition (`FontName`), as
 * the SVG and PDF back ends name it. Value-equal by `fullDefinition`, so
 * upstream's `build` interning cache (java:55-69) has no observable effect
 * and is not ported; nor is the AWT `Font` resolution (`getFonts`,
 * `getFont`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontStack.java:46-189
 */
export class FontStack {
  /** @see FontStack.java:48 */
  static readonly MONOSPACE = 'Monospaced';
  /** @see FontStack.java:49 */
  static readonly SANS_SERIF = 'SansSerif';
  /** @see FontStack.java:50 */
  static readonly SERIF = 'Serif';

  /** @see FontStack.java:71-73 */
  private constructor(private readonly fullDefinition: string) {}

  /** @see FontStack.java:65-69 */
  static build(fullDefinition: string): FontStack {
    return new FontStack(fullDefinition);
  }

  /** @see FontStack.java:154-162 */
  equals(other: unknown): boolean {
    return other instanceof FontStack && other.fullDefinition === this.fullDefinition;
  }

  /** @see FontStack.java:169-172 */
  toString(): string {
    return `FontStack[${this.fullDefinition}]`;
  }

  /** @see FontStack.java:174-176 */
  getFullDefinition(): string {
    return this.fullDefinition;
  }

  /** The three logical families map to CSS generics; else `"` becomes `'`. @see FontStack.java:178-188 */
  getSvgFamily(): string {
    switch (this.fullDefinition) {
      case FontStack.SERIF:
        return 'serif';
      case FontStack.SANS_SERIF:
        return 'sans-serif';
      case FontStack.MONOSPACE:
        return 'monospace';
    }
    return this.fullDefinition.replaceAll('"', "'");
  }
}

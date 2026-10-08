import type { GraphicPosition } from './graphic-strings.js';

/**
 * The "Welcome to PlantUML!" block. Upstream renders it as its own diagram for
 * an empty document, AND stacks it on top of the error diagram whenever the
 * failing source is shorter than 5 lines
 * (`PSystemError#getTextBlock` → `getSource().getTotalLineCountLessThan5()`) —
 * live-oracle verified: a 4-line source with an orphan `!endif` shows it, a
 * 7-line one does not.
 *
 * The strings carry upstream's creole: `<b>` (bold), `""…""` (monospace), and
 * `<u>…</u>` (underline). `error-renderer.ts` draws all three.
 *
 * A placed Welcome block also draws the PlantUML logo
 * (`PSystemVersion.getPlantumlImage()`) in that corner: top-right on an error
 * page (`PSystemError.java:255-258`), bottom-right as a diagram of its own
 * (`PSystemWelcomeFactory.java:52-53`), where four more blank lines make room
 * for it (`PSystemWelcome.java:73-78`). Unplaced, it is text only
 * (`PSystemWelcome.java:83-86`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemWelcome.java
 */

export class PSystemWelcome {
  private readonly strings: string[] = [];

  constructor(private readonly position?: GraphicPosition) {
    this.strings.push('<b>Welcome to PlantUML!');
    this.strings.push(' ');
    this.strings.push('You can start with a simple UML Diagram like:');
    this.strings.push(' ');
    this.strings.push('""Bob->Alice: Hello""');
    this.strings.push(' ');
    this.strings.push('Or');
    this.strings.push(' ');
    this.strings.push('""class Example""');
    this.strings.push(' ');
    this.strings.push('You will find more information about PlantUML syntax on <u>https://plantuml.com</u>');
    this.strings.push(' ');
    this.strings.push('(Details by typing ""license"" keyword)');
    this.strings.push(' ');
    if (position === 'BACKGROUND_CORNER_BOTTOM_RIGHT') for (let i = 0; i < 4; i++) this.strings.push(' ');
  }

  /** Where the logo goes; `undefined` draws none. */
  getPosition(): GraphicPosition | undefined {
    return this.position;
  }

  /** The lines a black-on-white `GraphicStrings` block draws. */
  getStrings(): readonly string[] {
    return this.strings;
  }

  /** @see ~/git/plantuml/.../eggs/PSystemWelcome.java#getDescription */
  getDescription(): string {
    return '(Empty)';
  }
}

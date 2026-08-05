import type { Display } from '../klimt/creole/Display.js';
import type { Position } from './Position.js';
import type { Colors } from './Colors.js';
import { NoteLinkStrategy } from './NoteLinkStrategy.js';

/**
 * CucaNote — an attached `note top/bottom of` block: its text, side,
 * colors, and link-sizing strategy.
 *
 * SI1/T5 — full port (7/7 members). Batch-1's `NoteLinkStrategy.ts`
 * header slotted this file into T6's write-set alongside `Link`; it
 * lands here instead because `Entity#addNote` CONSTRUCTS one
 * (`CucaNote.build`) — a value-level use no type-only forward can
 * satisfy. `src/core/abel/**` is T5's declared write-set and batch
 * sequencing (T6 depends on this batch) prevents a write conflict;
 * journaled.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/CucaNote.java:43
 */
export class CucaNote {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/CucaNote.java:44-47 */
  private readonly display: Display;
  private readonly position: Position;
  private readonly colors: Colors;
  private readonly strategy: NoteLinkStrategy;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/CucaNote.java:49-54 */
  private constructor(display: Display, position: Position, colors: Colors, strategy: NoteLinkStrategy) {
    this.display = display;
    this.position = position;
    this.colors = colors;
    this.strategy = strategy;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/CucaNote.java:56-58 */
  static build(display: Display, position: Position, colors: Colors): CucaNote {
    return new CucaNote(display, position, colors, NoteLinkStrategy.NORMAL);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/CucaNote.java:60-62 */
  withStrategy(strategy: NoteLinkStrategy): CucaNote {
    return new CucaNote(this.display, this.position, this.colors, strategy);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/CucaNote.java:64-66 */
  getDisplay(): Display {
    return this.display;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/CucaNote.java:68-70 */
  getStrategy(): NoteLinkStrategy {
    return this.strategy;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/CucaNote.java:72-74 */
  getColors(): Colors {
    return this.colors;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/CucaNote.java:76-78 */
  getPosition(): Position {
    return this.position;
  }
}

/**
 * StripeStyle — the per-line style tag every non-plain `Stripe` producer
 * (`StripeTable`/`StripeTree`/`StripeCode`/`StripeLatex`, all still
 * unported) carries: which `StripeStyleType` the line is, its nesting
 * `order` (list depth / heading level), and a raw style `char`.
 * `getHeader` builds the optional leading glyph atom a
 * LIST_WITHOUT_NUMBER/LIST_WITH_NUMBER line draws before its text.
 *
 * Upstream: klimt/creole/StripeStyle.java. Ported: the constructor,
 * `getType`, `getOrder`, `getStyle`, and `getHeader`'s full dispatch
 * (including its implicit "any other type -> null" fallthrough, the ONLY
 * branch reachable in this port today — see below).
 *
 * ## `getHeader`'s two list-header branches are cited, throwing seams
 *
 * `LIST_WITHOUT_NUMBER` needs `new Bullet(fontConfiguration, order)`
 * (klimt/creole/atom/Bullet.java, 84 lines) — which itself needs `HColor`
 * (`fontConfiguration.getColor()`, `color.bg()`), a color model this port
 * does not have anywhere (`Position.ts`'s own doc comment: "`HColor` is
 * not ported anywhere"; `ISkinSimple.ts`'s own doc comment omits
 * `getIHtmlColorSet()` for the identical reason). `LIST_WITH_NUMBER` needs
 * `AtomTextUtils.createListNumber` (klimt/creole/legacy/AtomTextUtils.java,
 * 161 lines), which needs the concrete legacy `AtomText` OOP class —
 * `atom/Atom.ts`'s own doc comment documents that class as deliberately
 * NOT re-ported (this port's data-oriented `CreoleAtom` replaces it for
 * the port's reachable scope) — plus an unported `DelayedDouble` callback
 * type. Both are genuinely large, separable dependency chains reaching
 * into the unported OOP `Atom` layer and the wholly-missing `HColor`
 * color model — not a small sibling class, matching the ADR-8 corollary's
 * bar for a cited, throwing seam rather than a silent drop or wrong-output
 * stub. `StripeStyleType.ts`'s own doc comment already documents bullet
 * lists as out of L1 scope: no fixture in this port constructs a
 * `StripeStyle` with either LIST_* type today (`classifyStripeLine` never
 * produces one), so this seam is a build/test-time signal only, not a
 * runtime one in any shipped path.
 *
 * `context.getLocalNumber(order)`'s counter-advancing side effect IS
 * still executed before the LIST_WITH_NUMBER seam throws — matching
 * upstream's own evaluation order (java:64) — so a future caller
 * exercising this path through a mock `CreoleContext` observes the same
 * counter state upstream would, even though the resulting atom is not
 * yet buildable.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/StripeStyle.java
 */
import { StripeStyleType } from './StripeStyleType.js';
import type { CreoleContext } from './CreoleContext.js';
import type { FontConfiguration } from '../shape/UText.js';
import type { Atom } from './SheetBlock1.js';

/** One labelled, cited "blocked on the unported OOP Atom/HColor layer"
 *  seam — thrown, never silently dropped or stubbed to wrong output
 *  (ADR-8 corollary). `javaPath` is relative to `net/sourceforge/plantuml/`
 *  in `~/git/plantuml`. */
function blockedOnAtomLayer(what: string, javaPath: string, javaLines: number): Error {
  return new Error(
    `StripeStyle.getHeader: ${what} is not yet supported -- ${javaPath} ` +
      `(${javaLines} lines) is unported and itself needs the unported OOP ` +
      `Atom layer and/or this port's wholly-missing HColor color model ` +
      `(batch-3a/T10a, ADR-8 corollary: flagged as a genuinely large, ` +
      `separable follow-on, not silently dropped or stubbed -- see ` +
      `.agent-notes/T10a-separator-primitives.md). No StripeStyleType ` +
      `producer in this port constructs a LIST_WITHOUT_NUMBER/` +
      `LIST_WITH_NUMBER StripeStyle today, so reaching this is a ` +
      `build/test-time signal, not a runtime one in any shipped path.`,
  );
}

export class StripeStyle {
  private readonly type: StripeStyleType;
  private readonly order: number;
  private readonly style: string;

  constructor(type: StripeStyleType, order: number, style: string) {
    this.type = type;
    this.order = order;
    this.style = style;
  }

  getType(): StripeStyleType {
    return this.type;
  }

  getHeader(_fontConfiguration: FontConfiguration, context: CreoleContext): Atom | null {
    if (this.type === StripeStyleType.LIST_WITHOUT_NUMBER) {
      throw blockedOnAtomLayer('a bullet-list header ("*" line)', 'klimt/creole/atom/Bullet.java', 84);
    }
    if (this.type === StripeStyleType.LIST_WITH_NUMBER) {
      // java:64 -- context.getLocalNumber(order) is evaluated (and its
      // counter-advancing side effect applied) BEFORE the atom is built.
      context.getLocalNumber(this.order);
      throw blockedOnAtomLayer(
        'a numbered-list header ("#" line)',
        'klimt/creole/legacy/AtomTextUtils.java (createListNumber)',
        161,
      );
    }
    return null;
  }

  getOrder(): number {
    return this.order;
  }

  getStyle(): string {
    return this.style;
  }
}

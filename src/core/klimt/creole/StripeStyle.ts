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
 * ## cdd-T28: both list-header branches are REAL now
 *
 * They were cited, throwing seams while `classifyStripeLine` could not
 * produce a LIST_* style and the OOP atom layer did not exist. Both
 * premises have since expired: `SheetBlock1.ts#Atom` (T8) is that layer,
 * `FontConfiguration.color` is already a resolved colour string (so
 * `Bullet` needs no `HColor`), and T28 ported the FULL-mode `*`/`#`
 * branches of `CreoleStripeSimpleParser`. `LIST_WITHOUT_NUMBER` now
 * builds `atom/Bullet.ts`; `LIST_WITH_NUMBER` builds
 * `legacy/AtomTextUtils.ts#createListNumber` AFTER advancing
 * `context.getLocalNumber(order)` — upstream's own evaluation order
 * (java:64-66).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/StripeStyle.java
 */
import { StripeStyleType } from './StripeStyleType.js';
import type { CreoleContext } from './CreoleContext.js';
import type { FontConfiguration } from '../shape/UText.js';
import type { Atom } from './SheetBlock1.js';
import { Bullet } from './atom/Bullet.js';
import { createListNumber } from './legacy/AtomTextUtils.js';

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

  /** java:59-69. */
  getHeader(fontConfiguration: FontConfiguration, context: CreoleContext): Atom | null {
    if (this.type === StripeStyleType.LIST_WITHOUT_NUMBER) {
      return new Bullet(fontConfiguration, this.order);
    }
    if (this.type === StripeStyleType.LIST_WITH_NUMBER) {
      // java:64 -- `context.getLocalNumber(order)` is evaluated (and its
      // counter-advancing side effect applied) BEFORE the atom is built.
      const localNumber = context.getLocalNumber(this.order);
      return createListNumber(fontConfiguration, this.order, localNumber);
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

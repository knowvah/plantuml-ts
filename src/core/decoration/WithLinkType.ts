import type { UStroke } from '../klimt/UStroke.js';
import { ColorType } from '../abel/ColorType.js';
import { Colors, type HColor } from '../abel/Colors.js';
import { parseSimpleColor } from '../klimt/color/HColorSet.js';
import type { LinkType } from './LinkType.js';

/**
 * `HColorSet.instance().getColorOrWhite(s)` adaptation: this port's
 * `HColorSet.ts` is free functions (`parseSimpleColor`), not the OOP
 * singleton (see `src/core/abel/Colors.ts`'s audit of the same
 * divergence). Upstream returns `HColors.WHITE` when the name/hex does
 * not resolve; `parseSimpleColor('white')` is that same white.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorSet.java (getColorOrWhite)
 */
const WHITE: HColor = parseSimpleColor('white') as HColor;
function getColorOrWhite(s: string): HColor {
  return parseSimpleColor(s) ?? WHITE;
}

/**
 * WithLinkType — the abstract base carrying a mutable `LinkType` plus
 * the arrow-style mutation surface (`goDashed`/`goBold`/`goSingle`/…,
 * `applyStyle` parsing). `Link` extends it; `isSingle` is read from
 * `net.atmp.CucaDiagram#containsSimilarLink` (the `-[single]->` dedup
 * hook — ADR-3, and CLAUDE.md's own net.atmp cautionary example).
 *
 * SI1/T6 — full port (verified against the whole `net/` root: the only
 * subclasses are `abel/Link` and test fakes; the only cross-package
 * caller of `isSingle` is `net.atmp.CucaDiagram:904`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/WithLinkType.java:49
 */
export abstract class WithLinkType {
  /** Java `protected LinkType type;` — null until the subclass
   * constructor assigns it (definite-assignment `!` mirrors that).
   * @see decoration/WithLinkType.java:51 */
  protected type!: LinkType;

  /** @see decoration/WithLinkType.java:52 */
  protected hidden = false;

  /** @see decoration/WithLinkType.java:53 */
  private single = false;

  /** Java field `useNodeStyle` — renamed: a TS class cannot carry a
   * field and a method of the same name (`useNodeStyle()` below is the
   * upstream public surface; `Entity.ts`'s `staticFlag` precedent).
   * @see decoration/WithLinkType.java:54 */
  private useNodeStyleFlag = false;

  /** @see decoration/WithLinkType.java:56 */
  private colors: Colors = Colors.empty();

  /** @see decoration/WithLinkType.java:58 */
  private supplementary: Colors[] = [];

  /** @see decoration/WithLinkType.java:60-62 */
  getSpecificColor(): HColor | undefined {
    return this.colors.getColor(ColorType.LINE);
  }

  /** Both upstream overloads (`(HColor)` delegates with `i = 0`).
   * @see decoration/WithLinkType.java:64-74 */
  setSpecificColor(specificColor: HColor | undefined, i = 0): void {
    if (i === 0) {
      this.colors = this.colors.add(ColorType.LINE, specificColor);
    } else {
      this.supplementary.push(this.colors.add(ColorType.LINE, specificColor));
    }
  }

  /** `Collections.unmodifiableList` → readonly view.
   * @see decoration/WithLinkType.java:76-78 */
  getSupplementaryColors(): readonly Colors[] {
    return this.supplementary;
  }

  /** @see decoration/WithLinkType.java:80-82 */
  setColors(colors: Colors): void {
    this.colors = colors;
  }

  /** @see decoration/WithLinkType.java:84-86 */
  getColors(): Colors {
    return this.colors;
  }

  /** @see decoration/WithLinkType.java:88-90 */
  goDashed(): void {
    this.type = this.type.goDashed();
  }

  /** @see decoration/WithLinkType.java:92-94 */
  goDotted(): void {
    this.type = this.type.goDotted();
  }

  /** @see decoration/WithLinkType.java:96-98 */
  goThickness(thickness: number): void {
    this.type = this.type.goThickness(thickness);
  }

  /** @see decoration/WithLinkType.java:100-102 */
  goHidden(): void {
    this.hidden = true;
  }

  /** @see decoration/WithLinkType.java:104 */
  abstract goNorank(): void;

  /** @see decoration/WithLinkType.java:106-108 */
  goBold(): void {
    this.type = this.type.goBold();
  }

  /** @see decoration/WithLinkType.java:110-112 */
  goSingle(): void {
    this.single = true;
  }

  /** ADR-3's dedup keystone — read by `net.atmp.CucaDiagram:904`.
   * @see decoration/WithLinkType.java:114-116 */
  isSingle(): boolean {
    return this.single;
  }

  /** @see decoration/WithLinkType.java:118-120 */
  goNodeStyle(): void {
    this.useNodeStyleFlag = true;
  }

  /** @see decoration/WithLinkType.java:122-124 */
  useNodeStyle(): boolean {
    return this.useNodeStyleFlag;
  }

  /** `StringTokenizer(arrowStyle, ";")` — consecutive/leading/trailing
   * delimiters yield no token, hence the empty-string filter (the token
   * index `i` advances per TOKEN, exactly as upstream).
   * @see decoration/WithLinkType.java:126-137 */
  applyStyle(arrowStyle: string | undefined): void {
    if (arrowStyle == null) return;

    const st = arrowStyle.split(';').filter((t) => t.length > 0);
    let i = 0;
    for (const s of st) {
      this.applyOneStyle(s, i);
      i++;
    }
  }

  /** Same `StringTokenizer` note as {@link applyStyle}, delimiter `","`.
   * `Double.parseDouble` → `Number.parseFloat` (lenient where Java
   * throws `NumberFormatException` on trailing garbage — documented
   * adaptation, input already matched the `thickness=` prefix).
   * @see decoration/WithLinkType.java:139-166 */
  private applyOneStyle(arrowStyle: string, i: number): void {
    for (const s of arrowStyle.split(',').filter((t) => t.length > 0)) {
      if (s.toLowerCase() === 'dashed') {
        this.goDashed();
      } else if (s.toLowerCase() === 'bold') {
        this.goBold();
      } else if (s.toLowerCase() === 'dotted') {
        this.goDotted();
      } else if (s.toLowerCase() === 'hidden') {
        this.goHidden();
      } else if (s.toLowerCase() === 'single') {
        this.goSingle();
      } else if (s.toLowerCase() === 'plain') {
        // Do nothing
      } else if (s.toLowerCase() === 'node') {
        this.goNodeStyle();
      } else if (s.toLowerCase() === 'norank') {
        this.goNorank();
      } else if (s.startsWith('thickness=')) {
        this.goThickness(Number.parseFloat(s.substring('thickness='.length)));
      } else {
        const tmp = getColorOrWhite(s);
        this.setSpecificColor(tmp, i);
      }
    }
    // #lizard forgives -- the 10-branch keyword chain mirrors upstream's
    // applyOneStyle verbatim (WithLinkType.java:139-166);
    // do-not-refactor-while-porting.
  }

  /** @see decoration/WithLinkType.java:168-170 */
  getType(): LinkType {
    return this.type;
  }

  /** @see decoration/WithLinkType.java:172-174 */
  getUStroke(): UStroke {
    throw new Error('UnsupportedOperationException');
  }
}

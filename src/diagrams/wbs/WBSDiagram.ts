/**
 * WBSDiagram — one `@startwbs` block: the WBS tree (its single root and the
 * last node added), the org-mode "smart level" scanner, the coded nodes the
 * `->` links name, and the links themselves.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/WBSDiagram.java
 */
import type { HColor } from '../../core/abel/Colors.js';
import { createAnnotations, type DiagramAnnotations } from '../../core/annotations/index.js';
import type { Colors } from '../../core/abel/Colors.js';
import { ColorType } from '../../core/abel/ColorType.js';
import type { Direction } from '../../core/abel/Direction.js';
import { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import { AbstractCommonUGraphic } from '../../core/klimt/AbstractCommonUGraphic.js';
import { HColorGradient } from '../../core/klimt/color/HColorGradient.js';
import { HColorSimple } from '../../core/klimt/color/HColorSimple.js';
import { Display } from '../../core/klimt/creole/Display.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import type { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import type { ScaleSpec } from '../../core/scale-command.js';
import type { SpriteRegistry } from '../../core/sprite-registry.js';
import { Stereotype } from '../../core/stereo/Stereotype.js';
import { NoStyleAvailableException } from '../../core/style/StyleLoader.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import { TitledDiagram } from '../../core/TitledDiagram.js';
import type { UmlSource } from '../../core/TitledDiagram.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import type { IdeaShape } from '../mindmap/IdeaShape.js';
import { Fork } from './Fork.js';
import type { SkinParam } from './wbs-skin-param.js';
import { WBSLink } from './WBSLink.js';
import { WElement, type WElementDecoration } from './WElement.js';

/** `ug.apply(new UTranslate(10, 10))`. @see WBSDiagram.java:101 */
const DRAW_OFFSET = 10;
/** `.delta(20)`. @see WBSDiagram.java:106 */
const DIMENSION_DELTA = 20;
/** @see WBSDiagram.java:170, 233 */
const NO_STYLE_AVAILABLE = 'General failure: no style available.';

/**
 * `patternStereotype` — `Pattern2.cmpile` (CASE_INSENSITIVE,
 * regex/Pattern2.java:114) matched with `matches()` (whole string). Java's
 * `\s` is the ASCII class `[ \t\n\x0B\f\r]` and its `.` excludes the line
 * terminators `\n \r \u0085 \u2028 \u2029` (Pattern javadoc), transcribed
 * literally.
 * @see WBSDiagram.java:143
 */
export const patternStereotype =
  /^[ \t\n\x0B\f\r]*([^\n\r\u0085\u2028\u2029]*?)[ \t\n\x0B\f\r]*(<<[ \t\n\x0B\f\r]*([^\n\r\u0085\u2028\u2029]*)[ \t\n\x0B\f\r]*>>)[ \t\n\x0B\f\r]*$/i;

/**
 * The string `addIdea` overload's per-node inputs (`backColor`, `label`,
 * `shape`), grouped for the repo's ≤5-parameter complexity hook — the
 * `WElementDecoration`/`mindmap/Idea.ts#IdeaContent` precedent. Read
 * verbatim. @see WBSDiagram.java:145-146
 */
export interface WBSIdeaLabel {
  readonly backColor: HColor | undefined;
  readonly label: string;
  readonly shape: IdeaShape;
}

/**
 * The `Display` `addIdea` overload's per-node inputs (`backColor`,
 * `display`, `stereotype`, `shape`) — {@link WElementDecoration} without
 * the style builder, which `add`/`initRoot` read from the skin param.
 * @see WBSDiagram.java:157-158
 */
export type WBSIdeaContent = Omit<WElementDecoration, 'styleBuilder'>;

/**
 * WBSDiagram — see the module doc comment. Upstream's `implements
 * TextBlock`: `getTextBlock` returns the diagram itself.
 *
 * The skin param is built by the factory and passed in, where upstream's
 * `TitledDiagram` constructor builds it (the `MindMapDiagram` precedent).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/WBSDiagram.java:78-258
 */
export class WBSDiagram extends TitledDiagram implements TextBlock {
  /** @see WBSDiagram.java:80 */
  private root: WElement | undefined = undefined;
  /** @see WBSDiagram.java:81 */
  private last: WElement | undefined = undefined;
  /** @see WBSDiagram.java:82 */
  private first: string | undefined = undefined;
  /** A `LinkedHashMap` upstream; a JS `Map` is insertion-ordered too. @see WBSDiagram.java:83 */
  private readonly codes = new Map<string, WElement>();
  /** @see WBSDiagram.java:84 */
  private readonly links: WBSLink<WElement>[] = [];
  private readonly skinParam: SkinParam;
  /** `TitledDiagram`'s title/caption/legend/header/footer/mainframe
   *  (`CommonCommands.addTitleCommands`), read by the chrome step —
   *  `MindMapDiagram.ts:52`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java */
  readonly annotations: DiagramAnnotations = createAnnotations();
  /** `CommandScale*`'s target (`UmlDiagram#setScale`) — `MindMapDiagram.ts:54`.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/UmlDiagram.java */
  scale: ScaleSpec | undefined = undefined;

  /** @see WBSDiagram.java:90-92 */
  constructor(source: UmlSource, preprocessing: PreprocessingArtifact, skinParam: SkinParam) {
    super(source, 'WBS', undefined, preprocessing);
    this.skinParam = skinParam;
  }

  getSkinParam(): SkinParam {
    return this.skinParam;
  }

  /** The skin param's sprites (`SkinParam#addSprite`'s map), read by the
   *  sprite commands and the chrome step — `MindMapDiagram.ts:70`. */
  get sprites(): SpriteRegistry {
    return this.skinParam.getSprites();
  }

  /** @see WBSDiagram.java:86-88 */
  getDescription(): string {
    return 'Work Breakdown Structure';
  }

  /** @see WBSDiagram.java:94-97 */
  getTextBlock(): TextBlock {
    return this;
  }

  /** @see WBSDiagram.java:99-102 */
  drawU(ug: UGraphic): void {
    this.drawMe(ug.apply(new UTranslate(DRAW_OFFSET, DRAW_OFFSET)));
  }

  /** @see WBSDiagram.java:104-107 */
  calculateDimension(stringBounder: StringBounder): XDimension2D {
    return this.getDrawingElement().calculateDimension(stringBounder).delta(DIMENSION_DELTA);
  }

  /**
   * The fork at the current translate; then, only on an
   * `AbstractCommonUGraphic`, every link under the reversed translate (the
   * links carry absolute positions recorded by `setGeometry`).
   * @see WBSDiagram.java:122-137
   */
  private drawMe(ug: UGraphic): void {
    let translate: UTranslate | undefined = undefined;
    if (ug instanceof AbstractCommonUGraphic) translate = ug.getTranslate();

    const fork = this.getDrawingElement();
    fork.drawU(ug);

    if (translate === undefined) return;

    ug = ug.apply(translate.reverse());
    for (const link of this.links) link.drawU(ug);
  }

  /** A NEW `Fork` on every call. A missing root is Java's NPE inside
   *  `Fork`'s `idea.withBackColor(skinParam)`. @see WBSDiagram.java:139-141 */
  private getDrawingElement(): Fork {
    if (this.root === undefined) throw new Error('NullPointerException: the WBS diagram has no root');
    return new Fork(this.skinParam, this.root, this.skinParam.atomOps);
  }

  /**
   * The string overload: a trailing `<<…>>` split off the label, the rest
   * through `Display.getWithNewlines`.
   * @see WBSDiagram.java:145-155
   */
  addIdea(
    code: string | undefined,
    level: number,
    content: WBSIdeaLabel,
    direction: Direction,
  ): CommandExecutionResult {
    let label = content.label;
    const m = patternStereotype.exec(label);
    let stereotype: string | undefined = undefined;
    if (m !== null) {
      label = m[1]!;
      stereotype = m[2];
    }
    const display = Display.getWithNewlines(this.getPragma(), label);
    return this.addIdeaDisplay(
      code,
      level,
      { backColor: content.backColor, label: display, stereotype: Stereotype.build(stereotype), shape: content.shape },
      direction,
    );
  }

  /** The `Display` overload. @see WBSDiagram.java:157-172 */
  addIdeaDisplay(
    code: string | undefined,
    level: number,
    content: WBSIdeaContent,
    direction: Direction,
  ): CommandExecutionResult {
    try {
      if (level === 0) {
        if (this.root !== undefined)
          return CommandExecutionResult.error('WBS diagram only accepts one root first declared.');

        this.initRoot(content);
        return CommandExecutionResult.ok();
      }
      return this.add(code, level, content, direction);
    } catch (e) {
      if (e instanceof NoStyleAvailableException) return CommandExecutionResult.error(NO_STYLE_AVAILABLE);
      throw e;
    }
  }

  /** @see WBSDiagram.java:174-177 */
  private initRoot(content: WBSIdeaContent): void {
    this.root = new WElement(
      content.backColor,
      content.label,
      content.stereotype,
      this.skinParam.getCurrentStyleBuilder(),
      content.shape,
    );
    this.last = this.root;
  }

  /** `last`'s `nb`-th ancestor. @see WBSDiagram.java:179-185 */
  private getParentOfLast(nb: number): WElement {
    let result = this.requireLast();
    for (let i = 0; i < nb; i++) result = requireElement(result.getParent());

    return result;
  }

  /**
   * Org-mode's indentation-to-depth resolver. While there is no root every
   * call answers 0 and remembers its `type` as `first`. The final `throw` is
   * upstream's uncaught `UnsupportedOperationException` (the
   * `MindMapDiagram.getSmartLevel` precedent: a crash, not a refusal).
   * @see WBSDiagram.java:187-208
   */
  getSmartLevel(type: string): number {
    if (this.root === undefined) {
      this.first = type;
      return 0;
    }
    type = type.replaceAll('\t', ' ');
    if (!type.includes(' ')) return type.length - 1;

    const first = requireFirst(this.first);

    if (type.endsWith(first)) return type.length - first.length;

    if (type.trim().length === 1) return type.length - 1;

    if (type.startsWith(first)) return type.length - first.length;

    throw new Error(`UnsupportedOperationException: type=<${type}>[${first}]`);
  }

  /**
   * Upstream's two arms are verbatim twins and keep their own
   * `NoStyleAvailableException` catch (the caller catches it too).
   * @see WBSDiagram.java:210-235
   */
  private add(
    code: string | undefined,
    level: number,
    content: WBSIdeaContent,
    direction: Direction,
  ): CommandExecutionResult {
    try {
      const last = this.requireLast();
      if (level === last.getLevel() + 1) {
        const newIdea = last.createElement(this.decoration(content), level, direction);
        this.last = newIdea;
        if (code !== undefined) this.codes.set(code, newIdea);
        return CommandExecutionResult.ok();
      }
      if (level <= last.getLevel()) {
        const diff = last.getLevel() - level + 1;
        const newIdea = this.getParentOfLast(diff).createElement(this.decoration(content), level, direction);
        this.last = newIdea;
        if (code !== undefined) this.codes.set(code, newIdea);
        return CommandExecutionResult.ok();
      }
      return CommandExecutionResult.error('Bad tree structure');
    } catch (e) {
      if (e instanceof NoStyleAvailableException) return CommandExecutionResult.error(NO_STYLE_AVAILABLE);
      throw e;
    }
  }

  /** `createElement`'s grouped arguments with `getSkinParam().getCurrentStyleBuilder()`
   *  read at the call, as java:214-215 and :223-224 do. */
  private decoration(content: WBSIdeaContent): WElementDecoration {
    return { ...content, styleBuilder: this.skinParam.getCurrentStyleBuilder() };
  }

  /**
   * A link between two coded nodes, coloured by the `LINE` colour else the
   * `root.element.wbsDiagram.arrow` style (with the stereotype's styles)
   * `LineColor`.
   * @see WBSDiagram.java:237-256
   */
  link(code1: string, code2: string, colors: Colors, stereotype?: Stereotype): CommandExecutionResult {
    const element1 = this.codes.get(code1);
    if (element1 === undefined) return CommandExecutionResult.error(`No such node ${code1}`);
    const element2 = this.codes.get(code2);
    if (element2 === undefined) return CommandExecutionResult.error(`No such node ${code2}`);
    let color = colors.getColor(ColorType.LINE);

    if (color === undefined) {
      const style = StyleSignatureBasic.of('root', 'element', 'wbsDiagram', 'arrow')
        .withTOBECHANGED(stereotype)
        .getMergedStyle(this.skinParam.getCurrentStyleBuilder());
      if (style === undefined) throw new Error('NullPointerException: no wbsDiagram arrow style');

      color = style.value('LineColor').asColor(this.skinParam.getIHtmlColorSet());
    }

    this.links.push(new WBSLink(element1, element2, linkColor(color)));

    return CommandExecutionResult.ok();
  }

  /** `last` is set with the root; `add` is reached only past `level == 0`
   *  once a root exists, else Java's NPE on `last.getLevel()`. */
  private requireLast(): WElement {
    return requireElement(this.last);
  }
}

/**
 * `WBSLink` draws with `ug.apply(color)`; the port's `UGraphic` takes the
 * style layer's `HColorSimple`/`HColorGradient` (the `Style.ts#foregroundOf`
 * precedent). Java's cast otherwise.
 */
function linkColor(color: HColor): HColorSimple | HColorGradient {
  if (color instanceof HColorSimple || color instanceof HColorGradient) return color;
  throw new Error('ClassCastException: link colour is not an HColorSimple');
}

/** `type.endsWith(first)` on a `null` `first` (no `getSmartLevel` call
 *  before the root) is Java's NPE; the port throws at the same point. */
function requireFirst(first: string | undefined): string {
  if (first === undefined) throw new Error('NullPointerException: getSmartLevel has no first type');
  return first;
}

/** Java dereferences `null` (an NPE); the port throws at the same point. */
function requireElement(element: WElement | undefined): WElement {
  if (element === undefined) throw new Error('NullPointerException: no such WBS element');
  return element;
}

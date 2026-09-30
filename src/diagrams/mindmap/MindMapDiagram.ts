import { Direction } from '../../core/abel/Direction.js';
import type { DiagramAnnotations } from '../../core/annotations/index.js';
import { createAnnotations } from '../../core/annotations/index.js';
import type { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import { HColorSimple } from '../../core/klimt/color/HColorSimple.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { Rankdir } from '../../core/klimt/geom/Rankdir.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import type { Paint } from '../../core/paint.js';
import type { ScaleSpec } from '../../core/scale-command.js';
import type { SpriteRegistry } from '../../core/sprite-registry.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import { TitledDiagram } from '../../core/TitledDiagram.js';
import type { UmlSource } from '../../core/TitledDiagram.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import type { IdeaContent } from './Idea.js';
import { MindMap } from './MindMap.js';
import type { SkinParam } from './mindmap-skin-param.js';

/** `getTextBlock`'s extra width. @see MindMapDiagram.java:100 (`width + 10`) */
const TEXT_BLOCK_EXTRA_WIDTH = 10;

/**
 * MindMapDiagram — one `@startmindmap` block: the list of `MindMap` trees
 * it contains (more than one when the source declares a second level-0
 * root), the default left/right-or-up/down placement new ideas get, the
 * org-mode "smart level" scanner, and the `TitledDiagram` state the common
 * commands fill (title/caption/legend/header/footer/mainframe, sprites,
 * scale).
 *
 * The skin param is built by `MindMapDiagramFactory` (it needs the
 * preprocessor's style sources and the diagram's sprite registry) where
 * upstream's `TitledDiagram` constructor builds it; the constructor then
 * sets its rankdir to LEFT_TO_RIGHT exactly as upstream does (java:76).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/MindMapDiagram.java:60-159
 */
export class MindMapDiagram extends TitledDiagram {
  private readonly mindmaps: MindMap[];
  private readonly skinParam: SkinParam;
  /** @see MindMapDiagram.java:64 */
  private defaultDirection = true;
  /** `getSmartLevel`'s own memo of the first TYPE string it ever saw.
   * @see MindMapDiagram.java:134 */
  private first: string | undefined;
  /** `TitledDiagram`'s title/caption/legend/header/footer/mainframe
   *  (`CommonCommands.addTitleCommands`), read by `src/index.ts`'s chrome
   *  step. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java */
  readonly annotations: DiagramAnnotations = createAnnotations();
  /** `CommandScale*`'s target (`UmlDiagram#setScale`). */
  scale: ScaleSpec | undefined = undefined;

  /** @see MindMapDiagram.java:74-78 */
  constructor(source: UmlSource, preprocessing: PreprocessingArtifact, skinParam: SkinParam) {
    super(source, 'MINDMAP', undefined, preprocessing);
    this.skinParam = skinParam;
    this.skinParam.setRankdir(Rankdir.LEFT_TO_RIGHT);
    this.mindmaps = [new MindMap(skinParam, skinParam.atomOps)];
  }

  getSkinParam(): SkinParam {
    return this.skinParam;
  }

  /** The skin param's sprites (`SkinParam#addSprite`'s map), read by the
   *  sprite commands and `src/index.ts`'s chrome step. */
  get sprites(): SpriteRegistry {
    return this.skinParam.getSprites();
  }

  /** @see MindMapDiagram.java:80-104 */
  getTextBlock(): TextBlock {
    const mindmaps = this.mindmaps;
    return {
      drawU(ug: UGraphic): void {
        for (const mindmap of mindmaps) {
          mindmap.drawU(ug);
          const dim = mindmap.calculateDimension(ug.getStringBounder());
          ug = ug.apply(UTranslate.dy(dim.getHeight()));
        }
      },
      calculateDimension(stringBounder: StringBounder): XDimension2D {
        let width = 0;
        let height = 0;
        for (const mindmap of mindmaps) {
          const dim = mindmap.calculateDimension(stringBounder);
          height += dim.getHeight();
          width = Math.max(width, dim.getWidth());
        }
        return new XDimension2D(width + TEXT_BLOCK_EXTRA_WIDTH, height);
      },
    };
  }

  /**
   * The `document` background (`TitledDiagram#calculateBackColor`), as the
   * klimt `Paint` the SVG root carries.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:279-289
   */
  calculateBackColor(): Paint {
    const style = StyleSignatureBasic.of('root', 'document', 'mindmapDiagram').getMergedStyle(
      this.skinParam.getCurrentStyleBuilder(),
    );
    const backgroundColor = style?.value('BackGroundColor').asColor(this.skinParam.getIHtmlColorSet());
    if (!(backgroundColor instanceof HColorSimple))
      throw new Error('ClassCastException: backcolor is not an HColorSimple');
    return backgroundColor.asPaint();
  }

  /** @see MindMapDiagram.java:66-68 */
  setDefaultDirection(direction: Direction): void {
    this.defaultDirection = direction === Direction.RIGHT || direction === Direction.DOWN;
  }

  /** Consumed by the tests (upstream's `mindmaps` is private). */
  getMindmaps(): readonly MindMap[] {
    return this.mindmaps;
  }

  /** @see MindMapDiagram.java:110-112 */
  private last(): MindMap {
    return this.mindmaps[this.mindmaps.length - 1]!;
  }

  /**
   * Merges upstream's three `addIdea` overloads
   * (java:106-108 `addIdea(HColor,int,Display,IdeaShape)`; :114-124
   * `addIdea(HColor,int,Display,IdeaShape,boolean)`; :126-132
   * `addIdea(Stereotype,HColor,int,Display,IdeaShape)`) into one method: TS
   * has no overload DISPATCH (only overload type SIGNATURES over one body),
   * and the project's ≤5-param complexity hook already forced `IdeaContent`
   * grouping (see `Idea.ts`). The three upstream forms differ along exactly
   * two independent axes, both expressible as optional/defaulted
   * parameters:
   *  - `direction` — explicit (:114-124's 5-arg form) or
   *    `this.defaultDirection` (the other two forms) -> TS default
   *    parameter `= this.defaultDirection`.
   *  - `content.stereotype` — auto-extracted from a trailing `<<...>>` on
   *    the label (:116-118, the two `HColor`-first forms) or supplied
   *    directly, skipping extraction (:126-132's `Stereotype`-first form)
   *    -> branch on whether the CALLER already set `content.stereotype`.
   */
  addIdea(content: IdeaContent, level: number, direction: boolean = this.defaultDirection): CommandExecutionResult {
    const resolved = content.stereotype === undefined ? extractEndingStereotype(content) : content;
    if (this.last().isFull(level)) this.mindmaps.push(new MindMap(this.skinParam, this.skinParam.atomOps));
    return this.last().addIdeaInternal(resolved, level, direction);
  }

  /**
   * `getSmartLevel` — org-mode's indentation-to-depth resolver. `first` is
   * this diagram's very first call's `type` string, remembered for every
   * later call to compare against.
   *
   * The final `throw` (java:156) is upstream's own uncaught path: it
   * escapes `CommandMindMapOrgmode#executeArg` and every layer above it
   * (`SingleLineCommand2#execute` catches only `NoSuchColorException`;
   * `PSystemCommandFactory#executeFewLines`/`#createSystem` catch nothing)
   * until `PSystemBuilder#createPSystem`'s outermost `catch (Throwable t)`
   * (java:274-279) — the port's OWN `parse-refusal.ts` file header already
   * names this exact spot "the crash path ... a different outcome from a
   * syntax refusal" and reserves `throw` for it. So this method throws a
   * plain `Error`, uncaught by `MindMapDiagramFactory.ts`'s dispatch loop,
   * rather than returning a `ParseRefusal`. Confirmed against the real jar
   * (T0c `LayoutProbe`, `plans/mindmap-engine-port/tools/probe/`) against
   * an authored two-line fixture (`#* root` then a tab-indented `*# child`,
   * first="#*"): `UnsupportedOperationException: type=< *#>[#*]` at
   * `MindMapDiagram.getSmartLevel(MindMapDiagram.java:156)`, called from
   * `CommandMindMapOrgmode.executeArg(CommandMindMapOrgmode.java:109)`.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/MindMapDiagram.java:136-159
   */
  getSmartLevel(type: string): number {
    if (this.first === undefined) this.first = type;

    let t = type;
    if (t.endsWith('**')) t = t.replaceAll('\t', ' ').trim();
    t = t.replaceAll('\t', ' ');

    if (!t.includes(' ')) return t.length - 1;
    if (t.endsWith(this.first)) return t.length - this.first.length;
    if (t.trim().length === 1) return t.length - 1;
    if (t.startsWith(this.first)) return t.length - this.first.length;

    throw new Error(`type=<${t}>[${this.first}]`);
  }
}

/** `label.getEndingStereotype()`/`removeEndingStereotype()` — the auto-strip
 *  half of {@link MindMapDiagram.addIdea}'s merged overload; see its doc
 *  comment. @see MindMapDiagram.java:116-118 */
function extractEndingStereotype(content: IdeaContent): IdeaContent {
  const stereotype = content.label.getEndingStereotype();
  if (stereotype === undefined) return content;
  return { ...content, stereotype, label: content.label.removeEndingStereotype() };
}

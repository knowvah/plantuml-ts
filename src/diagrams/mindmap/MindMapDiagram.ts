import { Direction } from '../../core/abel/Direction.js';
import type { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import { Pragma } from '../../core/skin/Pragma.js';
import type { IdeaContent } from './Idea.js';
import type { MindMapStyleSource } from './MindMap.js';
import { MindMap } from './MindMap.js';

/**
 * Placeholder `MindMapStyleSource` used when a caller does not supply a
 * real `ISkinParam` (this port has no concrete implementation of the full
 * interface yet — see `MindMap.ts`'s own doc comment). `getCurrentStyleBuilder`
 * returns an empty object, satisfying the opaque `StyleBuilder` stand-in
 * (`core/abel/ISkinParam.ts`) without resolving any real style. T4a/T5a
 * replace this default once a concrete `ISkinParam` lands.
 */
const DEFAULT_STYLE_SOURCE: MindMapStyleSource = {
  getCurrentStyleBuilder: () => ({}),
};

/**
 * MindMapDiagram — parse-time state for one `@startmindmap` block: the list
 * of `MindMap` trees it contains (more than one when the source declares a
 * second level-0 root), the default left/right-or-up/down placement new
 * ideas get, and the org-mode "smart level" scanner.
 *
 * Parse-part-only port (this task's scope): `setDefaultDirection`, the
 * three `addIdea` overloads (merged into one TS method — see {@link
 * addIdea}'s own doc comment), `getSmartLevel`. `getTextBlock` (java:80-104,
 * the chrome/drawing entry point) and extending `TitledDiagram` are D5's
 * (chrome-wiring batch): this class is a plain, standalone object here
 * rather than a `TitledDiagram` subclass, because `TitledDiagram`'s
 * abstract `getSkinParam(): ISkinParam` would force implementing font/
 * color/style members this task's boundary explicitly excludes ("no
 * style-engine imports", brief). `rankdir` (`CommandRankDir`'s target,
 * upstream `((SkinParam) getSkinParam()).setRankdir(...)`) is stored as a
 * local field for the same reason, rather than through a real `SkinParam`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/MindMapDiagram.java:60-159
 */
export class MindMapDiagram {
  private readonly mindmaps: MindMap[];
  private readonly pragma = Pragma.createEmpty();
  private readonly skinParam: MindMapStyleSource;
  /** @see MindMapDiagram.java:64 */
  private defaultDirection = true;
  /** @see MindMapDiagram.java:76 (`setRankdir(Rankdir.LEFT_TO_RIGHT)` in the
   *  constructor) — the ONLY diagram type in this port whose default is LR,
   *  not TB; see class doc for why this is a local field, not a real
   *  `SkinParam`. */
  private rankdir: 'LR' | 'TB' = 'LR';
  /** `getSmartLevel`'s own memo of the first TYPE string it ever saw.
   * @see MindMapDiagram.java:134 */
  private first: string | undefined;

  /** @see MindMapDiagram.java:74-78 */
  constructor(skinParam: MindMapStyleSource = DEFAULT_STYLE_SOURCE) {
    this.skinParam = skinParam;
    this.mindmaps = [new MindMap(skinParam)];
  }

  /** @see MindMapDiagram.java:66-68 */
  setDefaultDirection(direction: Direction): void {
    this.defaultDirection = direction === Direction.RIGHT || direction === Direction.DOWN;
  }

  /** Consumed by T5a's chrome wiring (`getTextBlock`, java:81-104). */
  getMindmaps(): readonly MindMap[] {
    return this.mindmaps;
  }

  getPragma(): Pragma {
    return this.pragma;
  }

  getSkinParam(): MindMapStyleSource {
    return this.skinParam;
  }

  /** `CommandRankDir`'s target — see class doc. */
  setRankdir(rankdir: 'LR' | 'TB'): void {
    this.rankdir = rankdir;
  }

  getRankdir(): 'LR' | 'TB' {
    return this.rankdir;
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
    if (this.last().isFull(level)) this.mindmaps.push(new MindMap(this.skinParam));
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

/**
 * The json family's `SkinParam` slice: the style engine `TextBlockJson` and `SmetanaForJson` read through
 * `skinParam.getCurrentStyleBuilder()` and `getIHtmlColorSet()` (`TextBlockJson.java:112`,
 * `SmetanaForJson.java:119-120`).
 *
 * Upstream's `JsonDiagram` is a `TitledDiagram`, so its `SkinParam` is the default skin's `StyleBuilder` after
 * `StyleExtractor#applyStyles` has run (`JsonDiagramFactory.java:99-104`, `YamlDiagramFactory.java:96-101`): the
 * `skin` line, then the `<style>` blocks. No `skinparam` command ever executes -- `StyleExtractor` consumes the
 * line and keeps only `handwritten` (`StyleExtractor.java:88-96`) -- and `HclDiagramFactory` has the whole call
 * commented out (`HclDiagramFactory.java:86-92`). The registry parses before `styleInput` cuts the preprocessed
 * sources (`json-family-style-input.ts`), so the parse makes the same cut itself, as `files/parser.ts#jarStyleSource`
 * does for `FilesDiagram`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/StyleExtractor.java:60-138
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import {
  createMindmapSkinParam,
  executeDeclaration,
  positionedDeclarationsOf,
} from '../../core/style/mindmap-style-builder.js';
import { StyleParsingException } from '../../core/style/parser/StyleParser.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { getMissingRootProperties, loadSkin, NoStyleAvailableException } from '../../core/style/StyleLoader.js';
import { extractStyle, upstreamSourceLines } from './StyleExtractor.js';

/** The style sources `createMindmapSkinParam` and the declaration loop read. */
type StyleSource = NonNullable<UmlSource['styleSource']>;

/** The three block types of the family. */
export type JsonFamilyType = 'json' | 'yaml' | 'hcl';

/**
 * The family's style slice, as `JsonDiagramAST.skinParam` carries it.
 * `styleName` is `jsonDiagram` for `@startjson` only: yaml AND hcl resolve as `yamlDiagram`
 * (`TextBlockJson.java:113`, `SmetanaForJson.java:112-115`: anything but `DiagramType.JSON`).
 * `styleError` is the error a `skin`/`<style>` block raised; upstream prints it and carries on
 * (`Logme.error(e)`, `JsonDiagramFactory.java:102-104`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/TextBlockJson.java:112-114
 */
export interface JsonSkinParam {
  /** @see SkinParam.java:156-162 */
  getCurrentStyleBuilder(): StyleBuilder;
  /** @see SkinParam.java:1052-1054 */
  getIHtmlColorSet(): HColorSet;
  readonly styleName: 'jsonDiagram' | 'yamlDiagram';
  readonly styleError?: Error;
}

/** The one `skinparam` key `StyleExtractor` keeps. @see StyleExtractor.java:89-90 */
const HANDWRITTEN = 'handwritten';
/** A hand-built source's style sources: no skin, no skinparam, no style. */
const EMPTY_STYLE_SOURCE: StyleSource = { skinparam: new Map<string, string>(), styles: [] };
/** `skin <name>` names `<name>.skin`. @see StyleExtractor.java:116 */
const SKIN_EXTENSION = '.skin';

/**
 * `jsonDiagram` for a json block, `yamlDiagram` for yaml and hcl.
 * @see TextBlockJson.java:113, SmetanaForJson.java:112-115
 */
function styleNameOf(type: JsonFamilyType): JsonSkinParam['styleName'] {
  return type === 'json' ? 'jsonDiagram' : 'yamlDiagram';
}

/**
 * The style sources the family's `applyStyles` reaches: skinparams dropped except `handwritten`
 * (`StyleExtractor.java:88-96`); for hcl also the `skin`, the `<style>` blocks and a theme's, since
 * `HclDiagramFactory` never calls `applyStyles` (`HclDiagramFactory.java:86-92`). The same cut as
 * `jsonFamilyStyleInput` / `hclStyleInput`, which the jar-compatible render applies to the theme.
 */
export function jsonFamilyJarStyleSource(source: UmlSource, type: JsonFamilyType): StyleSource {
  const given = source.styleSource ?? EMPTY_STYLE_SOURCE;
  const { handwritten } = extractStyle(upstreamSourceLines(source, type));
  const skinparam = new Map<string, string>(handwritten ? [[HANDWRITTEN, 'true']] : []);
  const order = given.declarationOrder;
  const kept = {
    ...given,
    skinparam,
    ...(order === undefined
      ? {}
      : {
          declarationOrder: {
            ...order,
            skinparam: new Map([...order.skinparam].filter(([key]) => skinparam.has(key))),
          },
        }),
  };
  if (type !== 'hcl') return kept;
  const { skin: _skin, ...withoutSkin } = kept;
  return {
    ...withoutSkin,
    styles: [],
    ...(kept.declarationOrder === undefined ? {} : { declarationOrder: { ...kept.declarationOrder, styles: [] } }),
  };
}

/**
 * The error `applyStyles` raises for the `skin` line before it touches a `<style>` block: a sheet that does not
 * load is "Cannot find style", one without every mandatory root property is "Incomplete style".
 * @see StyleExtractor.java:115-129
 */
function skinErrorOf(skin: string | undefined): StyleParsingException | undefined {
  if (skin === undefined) return undefined;
  let loaded: StyleBuilder;
  try {
    loaded = loadSkin(skin + SKIN_EXTENSION);
  } catch (e) {
    if (e instanceof NoStyleAvailableException) return new StyleParsingException(`Cannot find style ${skin}`);
    if (e instanceof StyleParsingException) return e;
    throw e;
  }
  const missing = getMissingRootProperties(loaded);
  if (missing.length === 0) return undefined;
  return new StyleParsingException(`Incomplete style ${skin}: root does not define [${missing.join(', ')}]`);
}

/**
 * Executes every declaration in source order; answers the first style error. The caller then discards the
 * builder: the jar collects every `<style>` line (a theme's included) into ONE `BlocLines` and parses it in
 * one `StyleParser#parse`, so a parse error throws before `muteStyle` and NO block applies.
 * @see StyleExtractor.java:132-136
 */
function applyDeclarations(
  style: ReturnType<typeof createMindmapSkinParam>,
  source: UmlSource,
  styleSource: StyleSource,
): StyleParsingException | undefined {
  for (const declaration of positionedDeclarationsOf(styleSource, source.stylePositions ?? [])) {
    try {
      executeDeclaration(style, declaration, styleSource.skinparam);
    } catch (e) {
      if (!(e instanceof StyleParsingException)) throw e;
      return e;
    }
  }
  return undefined;
}

/**
 * The style slice of one `@startjson` / `@startyaml` / `@starthcl` block, built the way the factories build it:
 * the default skin, `StyleExtractor#applyStyles` (the jar cut of {@link jsonFamilyJarStyleSource} applied inside,
 * because the parse runs before `styleInput`). A bad `skin` ends `applyStyles` before any `<style>` block
 * (`StyleExtractor.java:121-128`) and leaves the default skin.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/JsonDiagramFactory.java:97-109
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/yaml/YamlDiagramFactory.java:94-106
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/hcl/HclDiagramFactory.java:84-93
 */
export function createJsonSkinParam(source: UmlSource, type: JsonFamilyType): JsonSkinParam {
  const styleSource = jsonFamilyJarStyleSource(source, type);
  const skinError = skinErrorOf(styleSource.skin);
  let style = createMindmapSkinParam(skinError === undefined ? styleSource : {});
  const styleError = skinError ?? applyDeclarations(style, source, styleSource);
  // StyleExtractor.java:132-135: `muteStyle(new StyleParser(...).parse(all <style> lines))` -- all or nothing.
  if (styleError !== undefined && skinError === undefined) style = createMindmapSkinParam(styleSource);
  return {
    getCurrentStyleBuilder: () => style.getCurrentStyleBuilder(),
    getIHtmlColorSet: () => HColorSet.instance(),
    styleName: styleNameOf(type),
    ...(styleError === undefined ? {} : { styleError }),
  };
}

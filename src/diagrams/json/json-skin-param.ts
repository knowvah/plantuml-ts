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
  type ConvertSkinparam,
  type PositionedDeclaration,
} from '../../core/style/mindmap-style-builder.js';
import { convertSkinparam } from '../../core/style/FromSkinparamToStyle.js';
import { StyleParsingException } from '../../core/style/parser/StyleParser.js';
import { Style } from '../../core/style/Style.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { getMissingRootProperties, loadSkin, NoStyleAvailableException } from '../../core/style/StyleLoader.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import { isExtended } from './json-family-style-input.js';
import { extractStyle, upstreamSourceLines } from './StyleExtractor.js';

/** The style sources `createMindmapSkinParam` and the declaration loop read. */
type StyleSource = NonNullable<UmlSource['styleSource']>;

/** The three block types of the family. */
export type JsonFamilyType = 'json' | 'yaml' | 'hcl';

/**
 * The family's style slice, as `JsonDiagramAST.skinParam` carries it.
 * `styleName` is `jsonDiagram` for `@startjson` only: yaml AND hcl resolve as `yamlDiagram`
 * (`TextBlockJson.java:113`, `SmetanaForJson.java:112-115`: anything but `DiagramType.JSON`), in both modes
 * (user ruling 2026-10-29, jse decisions Amendment 1).
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
  readonly styleError?: Error | undefined;
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
 * Executes `declarations` in source order; answers the first style error. The caller then discards the
 * builder: the jar collects every `<style>` line (a theme's included) into ONE `BlocLines` and parses it in
 * one `StyleParser#parse`, so a parse error throws before `muteStyle` and NO block applies.
 * @see StyleExtractor.java:132-136
 */
function applyDeclarations(
  style: ReturnType<typeof createMindmapSkinParam>,
  declarations: readonly PositionedDeclaration[],
  styleSource: StyleSource,
): StyleParsingException | undefined {
  for (const declaration of declarations) {
    try {
      executeDeclaration(style, declaration, styleSource.skinparam);
    } catch (e) {
      if (!(e instanceof StyleParsingException)) throw e;
      return e;
    }
  }
  return undefined;
}

/** The `skinparam` key `defaultFontColor`, as `SkinParam#cleanForKey` hands it to the converter. */
const DEFAULT_FONT_COLOR = 'defaultfontcolor';
/** The property the one extension wrapper copies. @see FromSkinparamToStyle.java:157 */
const FONT_COLOR = 'FontColor';

/**
 * Extended mode's converter: `FromSkinparamToStyle` for every key (`FromSkinparamToStyle.java:80-400`), plus ONE
 * wrapper. `defaultFontColor` converts to `root { FontColor }` (`:157`), but the family's skin carries an explicit
 * `yamlDiagram,jsonDiagram { FontColor black }` (`plantuml.skin:456-457`) that outranks `root`, so a node's text
 * would stay black. The wrapper also answers `<styleName> { FontColor }` with the same value, which makes the
 * directive behave as if the skin had no explicit FontColor for the diagram (ddc T3a's meaning of the directive).
 * Port-only: the jar drops the skinparam before it ever reaches the converter (`StyleExtractor.java:88-96`).
 */
function extendedConverterFor(styleName: JsonSkinParam['styleName']): ConvertSkinparam {
  return (key, value, builder) => {
    const styles = convertSkinparam(key, value, builder);
    if (key !== DEFAULT_FONT_COLOR) return styles;
    const signature = StyleSignatureBasic.of(styleName);
    return [
      ...styles,
      ...styles
        .filter((style) => style.hasValue(FONT_COLOR))
        .map((style) => new Style(signature, new Map([[FONT_COLOR, style.value(FONT_COLOR)]]))),
    ];
  };
}

/** What {@link buildStyle} answers: the builder-holding skin param and the error a `skin`/`<style>` block raised. */
interface BuiltStyle {
  readonly styleName: JsonSkinParam['styleName'];
  readonly style: ReturnType<typeof createMindmapSkinParam>;
  readonly styleError: Error | undefined;
}

/**
 * The family's `SkinParam` in one mode. Jar-compatible: the default skin, `StyleExtractor#applyStyles` over the
 * cut of {@link jsonFamilyJarStyleSource} (`skin`, then the `<style>` blocks). Extended: the same over the FULL
 * style source -- every skinparam through {@link extendedConverterFor}, and for hcl the `skin`, `<style>` blocks
 * and theme the jar drops (`HclDiagramFactory.java:86-92`). A bad `skin` ends `applyStyles` before any `<style>`
 * block (`StyleExtractor.java:121-128`), and one bad block mutes them all (`:132-135`); the extended skinparams are
 * not `applyStyles` input, so they still apply.
 */
function buildStyle(source: UmlSource, type: JsonFamilyType, extended: boolean): BuiltStyle {
  const styleSource = extended ? (source.styleSource ?? EMPTY_STYLE_SOURCE) : jsonFamilyJarStyleSource(source, type);
  const styleName = styleNameOf(type);
  const convert = extended ? extendedConverterFor(styleName) : convertSkinparam;
  const skinError = skinErrorOf(styleSource.skin);
  const fresh = () => createMindmapSkinParam(skinError === undefined ? styleSource : {}, convert);
  const declarations = positionedDeclarationsOf(styleSource, source.stylePositions ?? []);
  let style = fresh();
  const styleError = skinError ?? applyDeclarations(style, declarations, styleSource);
  if (styleError === undefined) return { styleName, style, styleError };
  // StyleExtractor.java:132-135: `muteStyle(new StyleParser(...).parse(all <style> lines))` -- all or nothing.
  style = fresh();
  if (extended)
    applyDeclarations(
      style,
      declarations.filter((declaration) => 'key' in declaration),
      styleSource,
    );
  return { styleName, style, styleError };
}

/**
 * The style slice of one `@startjson` / `@startyaml` / `@starthcl` block, built the way the factories build it
 * ({@link buildStyle}). Built on first read, not at the parse: the registry parses before `styleInput` marks the
 * source jar-compatible (`json-family-style-input.ts#isExtended`), and the layout is the first reader.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/JsonDiagramFactory.java:97-109
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/yaml/YamlDiagramFactory.java:94-106
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/hcl/HclDiagramFactory.java:84-93
 */
export function createJsonSkinParam(source: UmlSource, type: JsonFamilyType): JsonSkinParam {
  let built: BuiltStyle | undefined;
  const build = (): BuiltStyle => (built ??= buildStyle(source, type, isExtended(source)));
  return {
    getCurrentStyleBuilder: () => build().style.getCurrentStyleBuilder(),
    getIHtmlColorSet: () => HColorSet.instance(),
    get styleName() {
      return build().styleName;
    },
    get styleError() {
      return build().styleError;
    },
  };
}

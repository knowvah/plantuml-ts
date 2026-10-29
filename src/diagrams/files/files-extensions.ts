/**
 * The files engine's documented skinparam extensions (DIVERGENCES.md "Extensions", ddc D8, user ruling
 * 2026-10-23): styling the jar's `StyleExtractor` path discards, honoured in the default (extended) mode and
 * left out of the jar-compatible one. `FilesDiagram` runs no `skinparam` command (FilesDiagram.java:62-80) and
 * `StyleExtractor` keeps only `handwritten`, which nothing reads (StyleExtractor.java:88-96), so a jar never
 * sees any of these.
 *
 * Five directives, each with the meaning a class diagram gives it:
 *  - `defaultFontName`  -> `root { FontName }`     (FromSkinparamToStyle.java:156)
 *  - `defaultFontSize`  -> `element { FontSize }`  (FromSkinparamToStyle.java:91)
 *  - `defaultFontColor` -> `root { FontColor }`    (FromSkinparamToStyle.java:157)
 *  - `shadowing`        -> `root { Shadowing }`, `true` = 3, `false` = 0 (FromSkinparamToStyle.java:330-333, 386-394)
 *  - `handwritten true` -> `UGraphicHandwritten` around the exported graphic (SkinParam.java:1076-1078,
 *                          TextBlockExporter.java:174-175)
 * The first four reach the diagram as styles through the real style engine, at their position
 * among the `<style>` blocks; `handwritten` is a graphic decorator, so it is a flag.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { cleanForKeySlow } from '../../core/style/mindmap-style-builder.js';

type StyleSource = NonNullable<UmlSource['styleSource']>;

/** The cleaned (`SkinParam#cleanForKey`) names of the style directives. */
const STYLE_DIRECTIVES: ReadonlySet<string> = new Set([
  'defaultfontname',
  'defaultfontsize',
  'defaultfontcolor',
  'shadowing',
]);
const HANDWRITTEN = 'handwritten';

/**
 * The sources whose render is jar-compatible. `SyncPlugin.styleInput` runs only then, after the parse, on the
 * very source the parse took; the mark is how the layout learns the mode. Keyed weakly: it dies with the source.
 */
const JAR_COMPATIBLE = new WeakSet<UmlSource>();

/** Records that `source` is rendered jar-compatibly (`files-style-input.ts`). */
export function markJarCompatible(source: UmlSource): void {
  JAR_COMPATIBLE.add(source);
}

/** True unless {@link markJarCompatible} saw `source`: the default mode honours the extensions. */
export function isExtended(source: UmlSource): boolean {
  return !JAR_COMPATIBLE.has(source);
}

function cleanedKey(key: string): string {
  return cleanForKeySlow(key)[0] ?? '';
}

/** The skinparams `keep` accepts, with their declaration order. */
function onlyKeys(styleSource: StyleSource, keep: (cleaned: string) => boolean): StyleSource {
  const skinparam = new Map([...styleSource.skinparam].filter(([key]) => keep(cleanedKey(key))));
  const order = styleSource.declarationOrder;
  return {
    ...styleSource,
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
}

/** `styleSource` reduced to the style directives of this module (a jar-style source has no skinparam at all). */
export function styleDirectivesOf(styleSource: StyleSource): StyleSource {
  return onlyKeys(styleSource, (cleaned) => STYLE_DIRECTIVES.has(cleaned));
}

/** True when the source declares at least one style directive. */
export function hasStyleDirective(styleSource: StyleSource): boolean {
  return styleDirectivesOf(styleSource).skinparam.size > 0;
}

/**
 * `skinparam handwritten true`: `SkinParam#handwritten` is `isTrue("handwritten")` (SkinParam.java:1076-1078),
 * the value compared case-insensitively. The last assignment wins, as the skinparam map keeps it.
 */
export function isHandwrittenRequested(styleSource: StyleSource): boolean {
  const entry = [...styleSource.skinparam].filter(([key]) => cleanedKey(key) === HANDWRITTEN).at(-1);
  return entry?.[1].trim().toLowerCase() === 'true';
}

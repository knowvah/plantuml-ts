import { BUILTIN_SKINS } from '../skins-builtin.js';
import { parseStyles, StyleParsingException } from './parser/StyleParser.js';
import { PNAMES, type PName } from './PName.js';
import { PLANTUML_SKIN, STRICTUML_SKIN } from './skins/plantuml-skin.js';
import { DELTA_PRIORITY_FOR_STEREOTYPE } from './Style.js';
import { StyleBuilder } from './StyleBuilder.js';
import { StyleSignatureBasic } from './StyleSignatureBasic.js';
import type { Value } from './Value.js';
import { ValueImpl } from './ValueImpl.js';

export { DELTA_PRIORITY_FOR_STEREOTYPE };

/**
 * `NoStyleAvailableException` — no `.skin` text for the requested name.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/NoStyleAvailableException.java:38-40
 */
export class NoStyleAvailableException extends Error {
  constructor() {
    super('No .skin file seems to be available');
    this.name = 'NoStyleAvailableException';
  }
}

/** `cache.size() >= 30` clears the whole cache. @see StyleLoader.java:68-69 */
const CACHE_LIMIT = 30;

/**
 * Parsed skins by filename (StyleLoader.java:61). Module-level, as
 * upstream's static `ConcurrentHashMap`: every entry is a fully built
 * builder that is only ever handed out through `cloneMe()`, so no caller
 * can reach (or mutate) a cached one — the cache changes cost, never
 * results.
 */
const cache = new Map<string, StyleBuilder>();

/**
 * A clone of the builder parsed from `filename` (cached).
 * @throws NoStyleAvailableException when there is no text for `filename`.
 * @throws StyleParsingException when the text defines no style.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleLoader.java:66-87
 */
export function loadSkin(filename: string): StyleBuilder {
  if (cache.size >= CACHE_LIMIT) cache.clear();
  let builder = cache.get(filename);
  if (builder === undefined) {
    builder = loadSkinSlow(filename);
    cache.set(filename, builder);
  }
  return builder.cloneMe();
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleLoader.java:89-110 */
function loadSkinSlow(filename: string): StyleBuilder {
  const styleBuilder = new StyleBuilder();

  const internalIs = getInputStreamForStyle(filename);
  if (internalIs === undefined) throw new NoStyleAvailableException();

  const styles = parseStyles(internalIs, styleBuilder);
  // A text that parses but defines no style is not a style sheet (java:99-104).
  if (styles.length === 0) throw new StyleParsingException(`No style found in ${filename}`);

  for (const newStyle of styles) styleBuilder.loadInternal(newStyle.getSignature(), newStyle);

  return styleBuilder;
}

/**
 * The `skin <name>` texts of `skins-builtin.ts` that are byte-identical to
 * the oracle jar's `skin/<name>.skin` (`unzip -p` + `cmp`, 1.2026.8beta1).
 * The jar's fifth resource, `sonyxperiadev.skin`, differs from the port's
 * copy and is left out; `reddress.skin` is not a jar resource at all.
 */
const JAR_IDENTICAL_BUILTIN_SKINS: ReadonlySet<string> = new Set(['debug', 'rose']);

const SKIN_SUFFIX = '.skin';

/**
 * The text `/skin/<filename>` names. Upstream tries a local file, then the
 * jar resource (java:112-142); a browser-safe library has no file system,
 * so only embedded resources answer: the drift-gated jar text of
 * `plantuml.skin`/`strictuml.skin`, then the jar-identical entries of the
 * port's `skin <name>` registry. `undefined` where upstream's
 * `getResourceAsStream` returns `null`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleLoader.java:112-142
 */
export function getInputStreamForStyle(filename: string): string | undefined {
  if (filename === 'plantuml.skin') return PLANTUML_SKIN;
  if (filename === 'strictuml.skin') return STRICTUML_SKIN;
  const name = filename.endsWith(SKIN_SUFFIX) ? filename.substring(0, filename.length - SKIN_SUFFIX.length) : '';
  return JAR_IDENTICAL_BUILTIN_SKINS.has(name) ? BUILTIN_SKINS[name] : undefined;
}

/**
 * Root properties any complete style sheet defines; a sheet missing one is
 * a fragment (`strictuml.skin`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleLoader.java:157-158
 */
const MANDATORY_ROOT_PROPERTIES: readonly PName[] = [
  'FontName',
  'FontSize',
  'FontStyle',
  'FontColor',
  'LineColor',
  'LineThickness',
  'BackGroundColor',
  'HorizontalAlignment',
];

/**
 * The mandatory root properties `styleBuilder` does not define; empty for
 * a complete sheet. A missing builder misses them all.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleLoader.java:166-176
 */
export function getMissingRootProperties(styleBuilder: StyleBuilder | undefined): readonly PName[] {
  const root = styleBuilder?.getMergedStyle(StyleSignatureBasic.of('root'));
  return MANDATORY_ROOT_PROPERTIES.filter((property) => root === undefined || !root.hasValue(property));
}

/**
 * Every value lifted by `DELTA_PRIORITY_FOR_STEREOTYPE`, into a new map in
 * PName order (an `EnumMap`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleLoader.java:180-186
 */
export function addPriorityForStereotype(tmp: ReadonlyMap<PName, Value>): Map<PName, Value> {
  const result = new Map<PName, Value>();
  for (const key of PNAMES) {
    const value = tmp.get(key);
    if (value === undefined) continue;
    if (!(value instanceof ValueImpl)) throw new Error(`ClassCastException: ${key} is not a ValueImpl`);
    result.set(key, value.addPriority(DELTA_PRIORITY_FOR_STEREOTYPE));
  }
  return result;
}

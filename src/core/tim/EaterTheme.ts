/**
 * `!theme <name>` (optionally `from <path>`), and the theme load behind it.
 *
 * `EaterTheme#getTheme` calls `ThemeUtils#loadTheme`, which reads the theme's
 * text and wraps it in a `Theme` (a `ReadLineWithYamlHeader` that strips the
 * leading `---` metadata block). Both collaborators are ported here, as the
 * module-level {@link loadTheme} and {@link Theme}: they have no other caller
 * upstream, and this file is their only consumer.
 *
 * PLANTUML-TS DIVERGENCE (the include seam, `TContext.ts` DIVERGENCE 1):
 * where upstream opens a file, a URL or a jar resource, this reads
 *   - bundled themes from the generated `themes-source.ts` (upstream's
 *     `/themes/` jar resources, verbatim);
 *   - everything else from the synchronous {@link IncludeStore} -- the same
 *     store `!include` reads, keyed the same way.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/EaterTheme.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/theme/ThemeUtils.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/theme/Theme.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/preproc/ReadLineWithYamlHeader.java
 */

import { THEME_SOURCES } from '../themes-source.js';
import { Eater } from './Eater.js';
import { EaterException } from './EaterException.js';
import { EMPTY_INCLUDE_STORE, type IncludeStore } from './IncludeStore.js';
import { readLines } from './ReadLineReader.js';
import { StringLocated } from './StringLocated.js';
import type { TContext } from './TFunction.js';
import type { TMemory } from './TMemory.js';

const FROM_MARKER = ' from ';

/** `ThemeUtils.java` `THEME_FILE_PREFIX` / `THEME_FILE_SUFFIX` / `THEME_PATH`. */
const THEME_FILE_PREFIX = 'puml-theme-';
const THEME_FILE_SUFFIX = '.puml';
const THEME_PATH = 'themes';

/** `ReadLineWithYamlHeader.java#isSeparator`. */
const YAML_SEPARATOR = '---';

/** `http://` / `https://` -- `ThemeUtils.java:66`. */
const RE_HTTP = /^https?:\/\//u;

/**
 * A loaded theme: its lines with the YAML header removed, and that header's
 * `key: value` pairs. Upstream reads it lazily through `readLine()`; the port
 * holds the whole text, so it is read once, eagerly.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/theme/Theme.java
 */
export interface Theme {
  readonly lines: readonly StringLocated[];
  /** `Theme#getMetadata` -- insertion-ordered, as upstream's `LinkedHashMap`. */
  readonly metadata: Readonly<Record<string, string>>;
}

/**
 * `ReadLineWithYamlHeader#readLine`: when the FIRST line is exactly `---`,
 * every line up to the next `---` is header -- each `key: value` (colon past
 * index 0) recorded, trimmed -- and both separators are dropped.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/preproc/ReadLineWithYamlHeader.java
 */
export function readThemeWithYamlHeader(lines: readonly StringLocated[]): Theme {
  const metadata: Record<string, string> = {};
  if (lines[0]?.getString() !== YAML_SEPARATOR) return { lines, metadata };

  let i = 1;
  for (; i < lines.length && lines[i]!.getString() !== YAML_SEPARATOR; i++) {
    const tmp = lines[i]!.getString();
    const idx = tmp.indexOf(':');
    if (idx > 0) metadata[tmp.substring(0, idx).trim()] = tmp.substring(idx + 1).trim();
  }
  return { lines: lines.slice(i + 1), metadata };
}

/** `ThemeUtils#getFilename`. */
export function getFilename(filename: string): string {
  return `${THEME_FILE_PREFIX}${filename}${THEME_FILE_SUFFIX}`;
}

/** `ThemeUtils#getFullPath`. */
function getFullPath(from: string, filename: string): string {
  return `${from.endsWith('/') ? from : `${from}/`}${getFilename(filename)}`;
}

/** A bundled theme's verbatim text; `Object.hasOwn` so `constructor` et al. miss. */
function bundledSource(name: string): string | undefined {
  return Object.hasOwn(THEME_SOURCES, name) ? THEME_SOURCES[name] : undefined;
}

function themeOf(content: string, description: string): Theme {
  return readThemeWithYamlHeader(readLines(content, description));
}

/**
 * The store key `loadTheme` reads for `!theme <name>[ from <from>]`, for the
 * async prefetch (`include-resolver.ts`) to fill: `undefined` for a bundled
 * theme (nothing to fetch). A `<lib>` location yields the `<lib/file>` stdlib
 * key `loadStdlibTheme` tries first; the name/location split is
 * `EaterTheme#analyze`'s (`EaterTheme.java:62-70`), minus the substitution a
 * text scan cannot do.
 */
export function themeStoreKey(args: string): string | undefined {
  const x = args.toLowerCase().indexOf(FROM_MARKER);
  const name = (x === -1 ? args : args.slice(0, x)).trim();
  if (x === -1) return bundledSource(name) === undefined ? getFilename(name) : undefined;

  const from = args.slice(x + FROM_MARKER.length).trim();
  if (from.startsWith('<') && from.endsWith('>')) return `<${from.substring(1, from.length - 1)}/${getFilename(name)}>`;
  return getFullPath(from, name);
}

/**
 * `ThemeUtils#loadTheme` (desktop branches; the TeaVM browser branch,
 * `ThemeUtils.java:53-59`, is not what the jar oracle runs). `undefined` is
 * upstream's `null`: the caller turns it into `Cannot load theme ...`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/theme/ThemeUtils.java#loadTheme
 */
export function loadTheme(store: IncludeStore, name: string, from: string | undefined): Theme | undefined {
  if (from === undefined) return loadBundledOrLocalTheme(store, name);

  if (from.startsWith('<') && from.endsWith('>')) return loadStdlibTheme(store, name, from);

  // `loadHttpTheme` / `loadFileTheme` (`ThemeUtils.java:66-70`): both read
  // `getFullPath(from, name)`; here both are one store lookup (a URL reaches
  // the store through the async prefetch, where URL policy is applied).
  const content = store.get(getFullPath(from, name));
  if (content === undefined) return undefined;

  return themeOf(content, RE_HTTP.test(from) ? getFullPath(from, name) : `${name} from ${from}`);
}

/** `ThemeUtils.java:128-147`: the bundled resource first, then a local file. */
function loadBundledOrLocalTheme(store: IncludeStore, name: string): Theme | undefined {
  const bundled = bundledSource(name);
  if (bundled !== undefined) return themeOf(bundled, `</${THEME_PATH}/${getFilename(name)}>`);

  const local = store.get(getFilename(name));
  return local === undefined ? undefined : themeOf(local, `theme ${name}`);
}

/**
 * `ThemeUtils.java:149-158`: `Stdlib.getPumlResource(<from>/<file>)`. An
 * exact-key store hit wins first, as `IncludeExecutor#load` does for the
 * `<bundle/thing>` form of `!include`.
 */
function loadStdlibTheme(store: IncludeStore, name: string, from: string): Theme | undefined {
  const res = `${from.substring(1, from.length - 1)}/${getFilename(name)}`;
  const content = store.get(`<${res}>`) ?? store.getPumlResource?.(res);
  return content === undefined ? undefined : themeOf(content, `${name} from ${from}`);
}

/**
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/EaterTheme.java
 */
export class EaterTheme extends Eater {
  private realName = '';
  private name = '';
  private from: string | undefined;
  private readonly store: IncludeStore;

  /** `pathSystem` upstream: where a non-bundled theme is read from. */
  constructor(s: StringLocated, store: IncludeStore = EMPTY_INCLUDE_STORE) {
    super(s);
    this.store = store;
  }

  /** @throws EaterException (thrown, not returned) on a malformed directive. */
  analyze(context: TContext, memory: TMemory): void {
    this.skipSpaces();
    this.checkAndEatChar('!theme');
    this.skipSpaces();
    this.name = this.eatAllToEnd();

    const x = this.name.toLowerCase().indexOf(FROM_MARKER);
    if (x !== -1) {
      const fromTmp = this.name.slice(x + FROM_MARKER.length).trim();
      this.from = context.applyFunctionsAndVariables(memory, new StringLocated(fromTmp, this.getLineLocation()));
      this.name = this.name.slice(0, x).trim();
    }

    this.realName =
      context.applyFunctionsAndVariables(memory, new StringLocated(this.name, this.getLineLocation())) ?? '';
  }

  /**
   * @throws EaterException `Cannot load theme <realName>[ in <from>]` when no
   *         source resolves (`EaterTheme.java:82-85`).
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/EaterTheme.java#getTheme
   */
  getTheme(): Theme {
    const theme = loadTheme(this.store, this.realName, this.from);
    if (theme === undefined) {
      const location = this.from === undefined ? '' : ` in ${this.from}`;
      throw new EaterException(`Cannot load theme ${this.realName}${location}`, this.getStringLocated());
    }
    return theme;
  }

  getName(): string {
    return this.name;
  }

  getRealName(): string {
    return this.realName;
  }

  getFrom(): string | undefined {
    return this.from;
  }
}

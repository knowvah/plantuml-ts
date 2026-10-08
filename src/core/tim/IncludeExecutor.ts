/**
 * `TContext#executeInclude` / `#executeIncludesub` / `#executeIncludeDef` /
 * `#executeImport` -- the four directives that reach OUTSIDE the source being
 * interpreted.
 *
 * Extracted from `TContext` (upstream keeps them as private methods on it) for
 * the same reason `buildCodeIterator.ts` was: this repo's per-file size gate.
 * It holds the state upstream's `TContext` holds for them -- `filesUsedCurrent`
 * (the `!include` dedup set) and the `PathSystem` (here: an {@link IncludeStore}
 * plus the prefixes `!import` registered) -- and nothing else.
 *
 * Where upstream opens a file, this reads the pre-populated, SYNCHRONOUS
 * {@link IncludeStore}: see `IncludeStore.ts` for why the I/O is split into an
 * async prefetch pass plus a sync interpreter lookup.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/TContext.java#executeInclude
 */

import { EaterException } from './EaterException.js';
import { EaterImport } from './EaterImport.js';
import { EaterInclude, PreprocessorIncludeStrategy } from './EaterInclude.js';
import { EaterIncludeDef } from './EaterIncludeDef.js';
import { EaterIncludesub } from './EaterIncludesub.js';
import { extractDiagram } from './DiagramExtractor.js';
import {
  EMPTY_INCLUDE_STORE,
  IncludeNotFoundError,
  StdlibNotBundledError,
  stdlibPathOf,
  type IncludeStore,
} from './IncludeStore.js';
import { readLines } from './ReadLineReader.js';
import { mergeEndingBackslashLines } from './ReadFilterMergeLines.js';
import type { StringLocated } from './StringLocated.js';
import type { TContext } from './TContext.js';
import type { TMemory } from './TMemory.js';
import { Sub } from './iterator/Sub.js';
import { JAR_STDLIB_FOLDERS } from './stdlib-folders.js';

/** `http://` / `https://` include target -- upstream's `SURL` branch. */
const RE_URL = /^https?:\/\//u;

export class IncludeExecutor {
  private readonly store: IncludeStore;
  private readonly subs: Map<string, Sub>;

  /** @see ~/git/plantuml/.../tim/TContext.java#filesUsedCurrent */
  private readonly filesUsedCurrent = new Set<string>();

  /**
   * What `!import` registered. Upstream's `!import` calls
   * `PathSystem#addImportFile`, adding a searchable LOCATION (a folder or zip)
   * that later `!include`s resolve against; these are that, as store-key
   * prefixes.
   */
  private readonly importedPaths: string[] = [];

  constructor(subs: Map<string, Sub>, store: IncludeStore = EMPTY_INCLUDE_STORE) {
    this.subs = subs;
    this.store = store;
  }

  /** @see ~/git/plantuml/.../tim/TContext.java#executeInclude */
  executeInclude(context: TContext, memory: TMemory, s: StringLocated): void {
    const include = new EaterInclude(s.getTrimmed());
    include.analyze(context, memory);
    const strategy = include.getPreprocessorIncludeStrategy();
    const { what, suf } = splitSuffix(include.getWhat());

    // Upstream applies the dedup only in its local-FILE branch: a stdlib or URL
    // include is re-read every time it is named.
    const dedup = stdlibPathOf(what) === undefined && !RE_URL.test(what);
    if (dedup && this.filesUsedCurrent.has(what)) {
      if (strategy === PreprocessorIncludeStrategy.ONCE)
        throw new EaterException('This file has already been included', s);

      if (strategy === PreprocessorIncludeStrategy.DEFAULT) return;
    }

    const lines = readLines(this.load(what, '!include', s), what, s.getLocation());
    this.filesUsedCurrent.add(what);

    // A file that is itself a whole `@startuml ... @enduml` document contributes
    // only its block's lines (and `!suffix` picks WHICH block); a bare fragment
    // contributes all of them.
    const body = extractDiagram(lines, suf) ?? lines;
    context.executeLines(memory, body, undefined, false);
  }

  /** @see ~/git/plantuml/.../tim/TContext.java#executeIncludesub */
  executeIncludesub(context: TContext, memory: TMemory, s: StringLocated): void {
    const include = new EaterIncludesub(s.getTrimmed());
    include.analyze(context, memory);
    const what = include.getWhat();

    const idx = what.indexOf('!');
    let sub: Sub | undefined;
    if (idx !== -1) {
      const filename = what.substring(0, idx);
      const blocname = what.substring(idx + 1);
      // `TContext.java:659-661`: an `!includesub`d file's reader is wrapped in
      // `ReadFilterMergeLines` directly -- unlike `executeInclude` /
      // `executeIncludeDef` below, which are NOT (upstream never wraps those).
      const lines = mergeEndingBackslashLines(
        readLines(this.load(filename, '!includesub', s), filename, s.getLocation()),
      );
      sub = Sub.fromLines(lines, blocname, context, memory);
    }
    sub ??= this.subs.get(what);
    if (sub === undefined) throw new EaterException(`cannot include ${what}`, s);

    context.executeLines(memory, sub.lines(), undefined, false);
  }

  /**
   * PLANTUML-TS DIVERGENCE: upstream reads the named definition from its
   * `DefinitionsContainer` -- the `@startuml(id=NAME)` blocks of the file set
   * the CLI happens to be processing (`BlockUmlBuilder#getDefinition`). This
   * port has no such container (it is handed one source string, not a file set),
   * so a `!includedef NAME` resolves through the include seam, keyed by NAME.
   *
   * @see ~/git/plantuml/.../tim/TContext.java#executeIncludeDef
   */
  executeIncludeDef(context: TContext, memory: TMemory, s: StringLocated): void {
    const include = new EaterIncludeDef(s.getTrimmed());
    include.analyze(context, memory);
    const definitionName = include.getLocation();
    const body = readLines(this.load(definitionName, '!includedef', s), definitionName, s.getLocation());
    context.executeLines(memory, body, undefined, false);
  }

  /**
   * PLANTUML-TS DIVERGENCE: upstream resolves the path on the filesystem and
   * throws `Cannot import` when it is missing or is a directory. There is no
   * filesystem here to check against, so the path is simply registered as a
   * lookup prefix for subsequent `!include`s ({@link importedPaths}) and the
   * directive never throws.
   *
   * @see ~/git/plantuml/.../tim/TContext.java#executeImport
   */
  executeImport(context: TContext, memory: TMemory, s: StringLocated): void {
    const _import = new EaterImport(s.getTrimmed());
    _import.analyze(context, memory);
    this.importedPaths.push(_import.getWhat());
  }

  /**
   * The seam: where upstream opens a file, this reads the store. A miss is a
   * thrown, TYPED error naming the path -- never a silent skip.
   *
   * For the `<bundle/thing>` stdlib form, an exact-key `get()` hit (a host
   * keying `'<bundle/thing>'` or `'bundle/thing'` directly, e.g.
   * `MapIncludeStore`) still wins first -- {@link IncludeStore#getPumlResource}
   * (SI5b's `StdlibStore.ts`, mirroring `Stdlib.getPumlResource`) is consulted
   * only once that misses, right before this would otherwise throw
   * `StdlibNotBundledError`.
   *
   * @throws IncludeNotFoundError  the store cannot serve `what`.
   * @throws EaterException        an `!include <bundle/thing>` miss the jar
   *                               itself reports -- see {@link throwJarStdlibMiss}.
   * @throws StdlibNotBundledError `what` is the `<bundle/thing>` stdlib form, the
   *                               jar ships that bundle, and no host bundle/store
   *                               resolves it.
   */
  private load(what: string, directive: string, s: StringLocated): string {
    const direct = this.store.get(what);
    if (direct !== undefined) return direct;

    for (const prefix of this.importedPaths) {
      const joined = prefix.endsWith('/') ? prefix + what : `${prefix}/${what}`;
      const imported = this.store.get(joined);
      if (imported !== undefined) return imported;
    }

    const stdlib = stdlibPathOf(what);
    if (stdlib !== undefined) {
      const bundled = this.store.getPumlResource?.(stdlib);
      if (bundled !== undefined) return bundled;

      if (directive === '!include') throwJarStdlibMiss(stdlib, s);
      throw new StdlibNotBundledError(what, stdlib);
    }

    throw new IncludeNotFoundError(what, directive);
  }
}

/**
 * The `!include <...>` misses whose jar output does not depend on which assets
 * a host supplied, mirrored exactly. Before any reader exists,
 * `TContext#executeInclude` calls `PathSystem#getInputFile(what)`
 * (`TContext.java:815`), which lowercases the path, cuts the folder name at the
 * first `/` and calls `Stdlib.retrieve(libname)` (`PathSystem.java:196-201`).
 * Both failures escape as unchecked exceptions -- `substring(0, -1)` when there
 * is no `/`, and `Stdlib.retrieve`'s `UncheckedIOException` for a folder the
 * jar does not ship (`Stdlib.java:166-176`) -- and `executeOneLineSafe` turns
 * either into `Fatal parsing error` (`TContext.java:374-384`). Jar fixtures:
 * tests/fixtures/unwind-U3/include-stdlib-{unknown,no-slash}.svg.
 *
 * Only reached once the store has missed: a host's exact-key entry or bundle
 * wins first (the port's include seam), where the jar would fail regardless.
 * Returns -- and the caller throws `StdlibNotBundledError` -- for a folder the
 * jar DOES ship: the jar then either renders the include or reports `cannot
 * include <what>` (`TContext.java:885`) for a file the folder lacks, and an
 * asset-free core that was not handed the bundle cannot tell those apart.
 */
function throwJarStdlibMiss(stdlib: string, s: StringLocated): void {
  const full = stdlib.toLowerCase();
  const slash = full.indexOf('/');
  if (slash === -1 || !JAR_STDLIB_FOLDERS.has(full.substring(0, slash)))
    throw new EaterException('Fatal parsing error', s);
}

/**
 * `!include file.puml!SUF` -> `{ what: 'file.puml', suf: 'SUF' }`. The suffix
 * selects one diagram block out of the included file (see `DiagramExtractor`).
 * @see ~/git/plantuml/.../tim/TContext.java#executeInclude (`what.lastIndexOf('!')`)
 */
function splitSuffix(target: string): { what: string; suf: string | undefined } {
  const idx = target.lastIndexOf('!');
  if (idx === -1) return { what: target, suf: undefined };

  return { what: target.substring(0, idx), suf: target.substring(idx + 1) };
}

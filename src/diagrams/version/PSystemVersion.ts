/**
 * `PSystemVersion` — the `about`/`authors` and bare `stdlib` pages: lines of
 * creole drawn black on white with the PlantUML logo in the bottom-right
 * corner (`PlainStringsDiagram`).
 *
 * This port prints its own version string where the jar prints
 * `Version.versionString()` (`core/version.ts`; user ruling 2026-10-08, "keep
 * own version string", DIVERGENCES.md "Error pages print this port's
 * version").
 *
 * Not ported:
 * - `createShowVersion` (java:172-202, the `version` page): after its first
 *   four lines it prints host state the port does not have — the `dot`
 *   executable's status (`GraphvizUtils.addDotStatus`), JVM system properties
 *   (`OptionPrint.interestingProperties`) and the `PLANTUML_LIMIT_SIZE`
 *   environment variable (`OptionPrint.interestingValues`). The oracle's
 *   `-DPLANTUML_DETERMINISTIC_TEXT` swaps the string bounder only
 *   (`FileFormat.java:185-192`), so those lines are the oracle host's. Stop 14
 *   (host-only behaviour), reported for a ruling.
 * - `createTestDot`, `createKeyDistributor` and the private image constructor
 *   (java:83-89, :256-279): `testdot` and the key tools are out (decisions.md D8).
 * - The other image getters (`getTime01`, `getTime15`, `getCharlieImage`,
 *   `getPlantumlSmallIcon(2)`, `getArecibo`, `getDotc`, `getDotd`,
 *   `getApple2Image`, java:96-169): resources of other pages, owned where they
 *   are drawn (`eggs/charlie-image.ts`, `core/error/`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersion.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { PLANTUML_LOGO } from '../../core/error/plantuml-logo.js';
import type { RasterImage } from '../../core/error/raster-image.js';
import { GraphicPosition } from '../../core/klimt/geom/GraphicPosition.js';
import { PlainStringsDiagram } from '../../core/PlainStringsDiagram.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { COMPILE_TIME_STRING, versionString } from '../../core/version.js';
import { License } from './License.js';
import { STDLIB_CATALOG } from './stdlib-catalog.js';

/** `DiagramDescription("(Version)")`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersion.java:294 */
const DESCRIPTION = '(Version)';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersion.java:208 */
const BLANK = ' ';

/** `s.replaceAll("\\</?\\w+\\>", "")`: Java's `\w` is `[a-zA-Z_0-9]`, as JS's.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersion.java:249 */
const TAG = /<\/?\w+>/g;

/** The authors lines between the licence line and the closing link.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersion.java:227-239 */
const AUTHORS = [
  '<u>Original idea</u>: Arnaud Roques',
  '<u>Word Macro</u>: Alain Bertucat & Matthieu Sabatier',
  '<u>Word Add-in</u>: Adriaan van den Brand',
  '<u>J2V8 & viz.js integration</u>: Andreas Studer',
  '<u>Official Eclipse Plugin</u>: Hallvard Tr\u00e6tteberg',
  '<u>Original Eclipse Plugin</u>: Claude Durif & Anne Pecoil',
  '<u>Servlet & XWiki</u>: Maxime Sinclair',
  '<u>Docker</u>: David Ducatel',
  '<u>AWS lib</u>: Chris Passarello',
  '<u>Stdlib Icons</u>: tupadr3',
  '<u>Site design</u>: Raphael Cotisson',
  '<u>Logo</u>: Benjamin Croizet',
  '<u>Web Assembly</u>: Sakir Temel',
] as const;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersion.java:241-243 */
const AUTHORS_END = [BLANK, 'https://plantuml.com', BLANK] as const;

/** `getImage("logo.png")`: the bundled logo (`core/error/plantuml-logo.ts`).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersion.java:92-94 */
export function getPlantumlImage(): RasterImage {
  return PLANTUML_LOGO;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersion.java:247-252 */
function add(result: string[], s: string, withTag: boolean): void {
  result.push(withTag ? s : s.replaceAll(TAG, ''));
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersion.java:219-245 */
export function getAuthorsStrings(withTag: boolean): string[] {
  const strings: string[] = [];
  add(strings, `<b>PlantUML version ${versionString()}</b> (${COMPILE_TIME_STRING})`, withTag);
  add(strings, `(${License.getCurrent().toString()} source distribution)`, withTag);
  add(strings, BLANK, withTag);
  for (const line of AUTHORS) add(strings, line, withTag);
  for (const line of AUTHORS_END) add(strings, line, withTag);
  return strings;
}

/**
 * `Stdlib.addInfoVersion`: one block per stdlib folder. Upstream reads the
 * folders at runtime (`getAllFolderNames`, `Stdlib.retrieve`); the port reads
 * the generated {@link STDLIB_CATALOG} (decisions.md D5), so the `IOException`
 * arm (java:333-336) has no counterpart.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/preproc/Stdlib.java:320-337
 */
export function addInfoVersion(strings: string[], details: boolean): void {
  for (const { name, version, source } of STDLIB_CATALOG) {
    if (details) strings.push(`<b>${name}`, `Version ${version}`, `Delivered by ${source}`, BLANK);
    else strings.push(`* ${name} (Version ${version})`);
  }
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersion.java:67 */
export class PSystemVersion extends PlainStringsDiagram {
  /**
   * The `!TeaVM.isTeaVM()` arm (java:72): this port mirrors the JVM jar. The
   * `try`/`catch` around `getPlantumlImage()` (java:73-80) guards a classpath
   * read; the bundled logo cannot fail.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersion.java:69-81
   */
  constructor(source: UmlSource, withImage: boolean, args: readonly string[], preprocessing: PreprocessingArtifact) {
    super(source, preprocessing);
    this.strings.push(...args);
    if (withImage) {
      this.image = getPlantumlImage();
      this.imagePosition = GraphicPosition.BACKGROUND_CORNER_BOTTOM_RIGHT;
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersion.java:205-211 */
  static createStdLib(source: UmlSource, preprocessing: PreprocessingArtifact): PSystemVersion {
    const strings: string[] = [];
    addInfoVersion(strings, true);
    strings.push(BLANK);
    return new PSystemVersion(source, true, strings, preprocessing);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersion.java:214-217 */
  static createShowAuthors(source: UmlSource, preprocessing: PreprocessingArtifact): PSystemVersion {
    return new PSystemVersion(source, true, getAuthorsStrings(true), preprocessing);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersion.java:293-295 */
  getDescription(): string {
    return DESCRIPTION;
  }

  /** `Collections.unmodifiableList(strings)`.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersion.java:297-299 */
  getLines(): readonly string[] {
    return [...this.strings];
  }
}

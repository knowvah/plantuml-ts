/**
 * Measurement primitives for `pin-corpus-tree.ts`, split out to keep that
 * file under the 500-line complexity cap (CLAUDE.md / code-principles.md).
 *
 * Every classifier here is a DELIBERATE duplicate of the one the two gates
 * own -- `tests/oracle/svg-conformance/routing-conformance.test.ts:124-167`
 * (`diagramTypeOf`, `isJarErrorPage`, `readHead`) and
 * `refusal-coverage.test.ts:167-201` (`weErroredIn`, `engineOf`) -- not an
 * import of either. Both are `.test.ts` files; `refusal-coverage.test.ts`'s
 * own header explains why its sibling gate is duplicated rather than
 * imported: importing a `.test.ts` module executes its top-level body,
 * which would register that file's own ~3572-fixture measurement a second
 * time. The regexes, byte budget and field derivations below are copied
 * verbatim from those two files so this tool's measurement is the gates'
 * own, not a re-derived approximation of it.
 */
import { readFileSync, readdirSync, existsSync, openSync, readSync, closeSync } from 'node:fs';
import { join } from 'node:path';

import { renderSync } from '../src/index.js';
import { DeterministicMeasurer } from '../src/core/measurer-deterministic.js';
import { fullDescription } from '../src/core/version.js';
import { fixtureIncludeStore } from '../tests/helpers/fixture-include-store.js';

/** `TextBlockExporter.java:292-294`'s root attribute, read from either a
 *  golden or our own rendered document. */
const DIAGRAM_TYPE_ATTR_RE = /data-diagram-type="([A-Z]+)"/;

/** Only the head is read for a GOLDEN: the attribute is always on the root
 *  element, and `sequence/zudize-61-vomi445`'s golden is 8.26 MB
 *  (routing-conformance.test.ts:116-119). */
const HEAD_BYTES = 4096;

/** The value recorded when a document carries no root attribute at all --
 *  real on both sides, never an "unmeasured" sentinel (routing gate D4). */
const NO_DIAGRAM_TYPE = 'NONE';

export function diagramTypeOf(head: string): string {
  return DIAGRAM_TYPE_ATTR_RE.exec(head)?.[1] ?? NO_DIAGRAM_TYPE;
}

/** Upstream's two graphical error pages, keyed on the text PlantUML itself
 *  writes into them -- `PSystemError#header()` (`PSystemError.java:148-155`)
 *  and `ReportLog#anErrorHasOccurred` (`ReportLog.java:103-108`). See
 *  `routing-conformance.test.ts:128-157` for the full derivation. */
const JAR_ERROR_PAGE_RE = />(?:PlantUML version [^<]*\[[^<]*\]|An error has occurred[^<]*)<\/text>/;

export function isJarErrorPage(head: string): boolean {
  return JAR_ERROR_PAGE_RE.test(head);
}

/** OUR error banner, built from `fullDescription()` itself -- never spelled
 *  out -- so a version bump cannot silently blind this classifier
 *  (refusal-coverage.test.ts:171-178). */
const OUR_ERROR_BANNER = `>${fullDescription()}</text>`;

/** Deliberately scans the WHOLE document, not a head window: the banner's
 *  offset moves with source length (refusal-coverage.test.ts:179-189). */
export function weErroredIn(ours: string): boolean {
  return ours.includes(OUR_ERROR_BANNER);
}

/** `ErrorUml#getError`'s suffix, printed only once a parser has committed to
 *  a diagram type; absent on a crash. */
const ASSUMED_TYPE_RE = /\(Assumed diagram type: ([^)<]+)\)/;

export function engineOf(ours: string, errored: boolean): string {
  if (errored) return ASSUMED_TYPE_RE.exec(ours)?.[1] ?? 'unknown';
  return diagramTypeOf(ours.slice(0, HEAD_BYTES)).toLowerCase();
}

export function readHead(path: string): string {
  const fd = openSync(path, 'r');
  try {
    const buf = Buffer.alloc(HEAD_BYTES);
    return buf.subarray(0, readSync(fd, buf, 0, HEAD_BYTES, 0)).toString('utf8');
  } finally {
    closeSync(fd);
  }
}

/** Immediate child directories of `treeDir` holding both `in.puml` and
 *  `in.svg` -- the flat layout every `dot-cache/<type>/` tree uses, and the
 *  parked `dot-cache-unknown-2026-09-20/` tree beside it (D6). Sidecar files
 *  written next to a parked tree (`capture-result.json`,
 *  `dispatcher-per-fixture.json`, `measured-through-gates.json`) are not
 *  directories and never reach the `existsSync` check. */
export function listFixtureSlugs(treeDir: string): string[] {
  return readdirSync(treeDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((slug) => existsSync(join(treeDir, slug, 'in.puml')) && existsSync(join(treeDir, slug, 'in.svg')))
    .sort((a, b) => a.localeCompare(b));
}

export interface MeasuredFixture {
  readonly slug: string;
  readonly jarType: string;
  readonly ourType: string;
  readonly jarErrored: boolean;
  readonly jarRendered: boolean;
  readonly weErrored: boolean;
  readonly engine: string;
}

/** One fixture, through the SAME seams both gates measure with: `renderSync`
 *  + `DeterministicMeasurer` + `fixtureIncludeStore()` (mission brief's
 *  Context paragraph; routing-conformance.test.ts:243-269,
 *  refusal-coverage.test.ts:278-296). */
export function measureFixture(
  treeDir: string,
  slug: string,
  store: ReturnType<typeof fixtureIncludeStore>,
): MeasuredFixture {
  const dir = join(treeDir, slug);
  const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
  const ours = renderSync(markup, { includeStore: store, measurer: new DeterministicMeasurer() });
  const golden = readHead(join(dir, 'in.svg'));
  const jarErrored = isJarErrorPage(golden);
  const weErrored = weErroredIn(ours);
  return {
    slug,
    jarType: diagramTypeOf(golden),
    ourType: diagramTypeOf(ours.slice(0, HEAD_BYTES)),
    jarErrored,
    jarRendered: !jarErrored,
    weErrored,
    engine: engineOf(ours, weErrored),
  };
}

/** Measures every fixture under `treeDir`, in slug order. The only impure
 *  loop this tool has -- reproducing the gates' own measurement is the
 *  point, and 825 fixtures through `renderSync` takes a few minutes, which
 *  is the whole reason the tree this tool was built for stays parked
 *  instead of being re-rendered per task (`.agent-notes/
 *  unknown-bucket-mapping.md`). */
export function measureTree(treeDir: string): MeasuredFixture[] {
  const store = fixtureIncludeStore();
  return listFixtureSlugs(treeDir).map((slug) => measureFixture(treeDir, slug, store));
}

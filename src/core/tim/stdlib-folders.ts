/**
 * The stdlib folder names the jar ships -- one `stdlib/<name>/info.spm`
 * resource per folder, the file `Stdlib`'s constructor opens first
 * (`Stdlib.java:84-95` -> `SpmChannel#getInternalInputStream`,
 * `SpmChannel.java:69-72`).
 *
 * Only the NAMES are here, never content: the core package stays asset-free
 * (bundles ship as the opt-in `@knowvah/plantuml-stdlib*` packages). The names
 * decide what the jar does with an `!include <bundle/thing>`:
 * `PathSystem#getInputFile` calls `Stdlib.retrieve(libname)` before any reader
 * exists (`PathSystem.java:196-201`, from `TContext.java:815`), and for a
 * folder the jar does not have that throws an `UncheckedIOException`
 * (`Stdlib.java:166-176`) which becomes "Fatal parsing error"
 * (`TContext.java:374-384`).
 *
 * Source: the folders of `~/git/plantuml-stdlib/stdlib/`, identical
 * (case-folded) to the pinned oracle jar's `stdlib/<name>/info.spm` entries
 * and to this repo's `assets/stdlib/` (34 each, checked 2026-10-08). Kept
 * lowercase because `getInputFile` lowercases the path before cutting the
 * folder name out of it (`PathSystem.java:197`).
 */
export const JAR_STDLIB_FOLDERS: ReadonlySet<string> = new Set([
  'adaml',
  'archimate',
  'aws',
  'awslib',
  'awslib10',
  'awslib14',
  'awslib20',
  'azure',
  'bootstrap',
  'bootstrap1.12.1',
  'bootstrap1.13.1',
  'c4',
  'classy',
  'classy-c4',
  'cloudinsight',
  'cloudogu',
  'domainstory',
  'edgy',
  'eip',
  'elastic',
  'gcp',
  'ibm',
  'k8s',
  'kubernetes',
  'logos',
  'material',
  'material2',
  'material2.1.19',
  'material7',
  'material7.4.47',
  'office',
  'osa',
  'osa2',
  'tupadr3',
]);

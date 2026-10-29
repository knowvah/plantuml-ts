# T1f — files authored fixtures (D7)

Agent: `typescript-pro` (sonnet), worktree `ddc-T1f`. Commit:
`test(files): authored @startfiles fixtures with jar oracles (T1f)`.
Read [../task-contract.md](../task-contract.md) first.

## Context
Nine files rows exist (8 corpus + `tests/fixtures/lengthadjust/files-*` and
the authored `files-directory-tree-with-note`). `FilesDiagram.java`,
`FilesListing.java`, `FEntry.java` have branches no row exercises. T0b's
`files.authored.ratchet.test.ts` reads `tests/fixtures/files/<slug>.puml` +
`.svg`; the orchestrator writes `authored-baseline.json` rows at the close.

## Task
Author `tests/fixtures/files/<slug>.puml` (flat) + `<slug>.svg` via
`scripts/oracle-render.sh <ABSOLUTE out-dir> <puml>`, one construct each
(≥ 10): root-level note before any entry (`lastCreated == null`); note after
a trailing-slash folder path (`FEntry.addRawEntry` returns null → root);
note after a file (attaches to the file's parent); two notes in a row;
duplicate folder segments merged (`/a/x`, `/a/y`); deep nesting (5 levels);
unicode and emoji file names; a name with spaces and dots; creole in a note
(`**bold**`, `//italic//`, a `<:1f600:>` emoji, a newline); `title` +
`caption`; `header`/`footer`; `<style> filesDiagram { FontColor; FontSize;
note { BackGroundColor; LineColor } }` (jar behaviour, D3); `<style> root
{ BackgroundColor }` (nixaro pattern); `!theme crt-amber` (nojeru pattern);
`skinparam shadowing true` (expected to be IGNORED by the jar — the oracle
proves it); an empty diagram (`@startfiles` / `@endfiles` only); a line that
is neither `/`, `<note>` nor a known command (the jar ignores it silently).

Hand-back: one line per slug — construct, Java branch (`file:line`), and
the oracle's root element attributes (so T1b/T2c can read expectations).

## Write-set
`tests/fixtures/files/*` only (no harness, no baseline, no src).

## Read-set
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/filesdiagram/*.java`,
`tests/fixtures/lengthadjust/files-*.puml`, `test-results/dot-cache/files/*/in.puml`
(the 8 corpus sources — do not duplicate their constructs),
`tests/oracle/svg-conformance/render-fixture-files.ts` (T0b, for the root layout).

## Acceptance
- Given the directory, then ≥ 10 `.puml` each with a `.svg` whose root carries `data-diagram-type="FILES"` (or the jar's error page, which is stop 13 after one fixture fix).
- Given the note-after-folder fixture, then the jar's svg shows the note at `x` of the root column (the branch `FilesListing.java:88-89` is exercised).
- Given `npx vitest run tests/oracle/svg-conformance/files.authored.ratchet.test.ts`, then it FAILS naming exactly the new slugs (T0b's invariant: no row yet) — expected; the orchestrator baselines them at the close right after the merge. Every other test you touch is green.

Observability: N/A. Rollback: Reversible.

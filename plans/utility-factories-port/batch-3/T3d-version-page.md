# T3d (F4): the `version` page with the port's own values (D14)

Prepend [../task-preamble.md](../task-preamble.md). Agent: typescript-pro (opus).

## Ruling (D14)
`createShowVersion` (PSystemVersion.java:172-202) prints host state after its first four lines:
`GraphvizUtils.addDotStatus` (GraphvizUtils.java:122-145), `OptionPrint.interestingProperties`
(OptionPrint.java:61-81), `interestingValues` (:83-103). Render the page with this port's own
TRUTHFUL equivalents — never the oracle host's values, never invented ones. Line by line: keep
upstream's structure and wording where a truthful equivalent exists (e.g. the layout engine the
port actually uses instead of a Graphviz binary: read how the port exposes its dot-engine
identity/version without Node APIs — `src/core/version.ts`, the package's own exports); omit a
line that has no equivalent (JVM/OS/env). The label convention is `plantuml-ts version <v>`
(row 24a). Every changed or omitted line gets a code comment with its Java line.

## Task (TDD)
1. `PSystemVersionFactory` accepts `version` (java:55); `PSystemVersion.createShowVersion`.
2. Probe the jar for `version` via `scripts/oracle-render.sh`; test that every line the port keeps
   matches the jar's geometry rules (x, font, spacing) and list each differing line with its D14
   reason.
3. Add one `DIVERGENCES.md` entry ("`version` page prints the port's own environment", forced by
   the platform: a browser library has no Graphviz binary, JVM or environment; maintainer ruling
   D14, 2026-10-13) in the file's existing format.

## Write-set
`src/diagrams/version/{PSystemVersion,PSystemVersionFactory}.ts`, their tests, `DIVERGENCES.md`
(one entry), `docs/catalog.md`, `.agent-notes/ufp-T3d.md`. NOT `License*.ts` (T3b).

**Observability:** N/A. **Rollback:** Reversible.

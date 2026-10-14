# T1f: `version/` (license, version, about/authors, stdlib)

Prepend [../task-preamble.md](../task-preamble.md). Agent: typescript-pro (opus).

## Task (TDD)
Port `version/PSystemLicenseFactory.java` (`(?i)^li[sc][ea]n[sc]e\s*$`, java:51), `PSystemLicense`
(read it), `License.java` (391), `LicenseInfo.java` (272), `PSystemVersionFactory.java` (`authors?|about`
java:52, `version` java:55, `stdlib` java:59 — NOT testdot/key* java:62-77, D8) and `PSystemVersion.java`
(301; `extends PlainStringsDiagram`). Print this port's version string where the jar prints its own
(`src/core/version.ts`; ruling "keep own version string"). `stdlib` prints T0e's `STDLIB_CATALOG`.
Anything host-dependent (JVM properties, memory, OS) in the version page: read the Java, mirror what
`-DPLANTUML_DETERMINISTIC_TEXT=true` makes the oracle print, and report each such line (stop 14 if
it cannot be mirrored). Jar values: `unknown/govuca-53-mili511` (`stdlib`) + authored probes via
`scripts/oracle-render.sh` for `license`, `version`, `about`.

## Write-set
`src/diagrams/version/**` (except T0e's `stdlib-catalog.ts`), their unit tests under `tests/unit/` (mirror the source path), `docs/catalog.md`,
`.agent-notes/ufp-T1f.md`. Any OTHER file is a stop — in particular NOT `src/index.ts` (T2a
registers every plugin) and not `oracle/goldens/**`.

## Interface contract (→ T2a)
Export `licensePlugin`, `versionPlugin` (a `singleLinePlugin`, or the base-class plugin shape T0c landed) and the
factory's accept function; record the exact export names in the report.

## Acceptance
- Given `govuca-53`, then compareSvg has zero diffs (or residuals named).
- Given `license`/`version`/`about` probes, then each matches its jar probe except the version string (journal the exact lines).
- Given a line the factory does not accept (and a 4-line source), then it refuses.
- Given each corpus row rendered three times, then the outputs are identical.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.

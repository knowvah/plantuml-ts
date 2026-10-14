# T1h: eggs + dedication

Prepend [../task-preamble.md](../task-preamble.md). Agent: typescript-pro (opus).

## Task (TDD)
Port `eggs/PSystemEggFactory.java` (+ `PSystemEgg`, `SentenceDecoder`, `EggUtils`; accept loop
java:52-60), `PSystemAppleTwoFactory.java` (+ `PSystemAppleTwo`; literals java:52-53),
`PSystemRIPFactory.java` (+ `PSystemRIP` 437, `QuoteUtils` 352 if reached; literal java:52),
`PSystemCharlieFactory.java` (+ `PSystemCharlie`: `UImage` of the charlie PNG, java:45-72, over T0e's
asset) and `dedication/` (`PSystemDedicationFactory`, `PSystemDedication`, `Dedications.get`,
`DedicationSimple` sentence matching java:45-77 over T0e's vendored images; `DedicationEncrypted`
entries return null — D4, journal it). Read `GraphicsPath.java` if AppleTwo/RIP reach it. Jar values:
`unknown/kicizi-84-lexu138` (`charlie`), `unknown/kavama-92-noro949` (dedication) + authored probes for
AppleTwo/RIP (`tests/fixtures/utility/`). `PSystemEgg`: negative-path tests only (D10).

## Write-set
`src/diagrams/eggs/**` (except T1b's `PSystemColors*`), `src/diagrams/dedication/**`, `tests/fixtures/utility/{apple,rip}*`, their unit tests under `tests/unit/` (mirror the source path), `docs/catalog.md`,
`.agent-notes/ufp-T1h.md`. Any OTHER file is a stop — in particular NOT `src/index.ts` (T2a
registers every plugin) and not `oracle/goldens/**`.

## Interface contract (→ T2a)
Export `eggPlugin`, `appleTwoPlugin`, `ripPlugin`, `charliePlugin`, `dedicationPlugin` (a `singleLinePlugin`, or the base-class plugin shape T0c landed) and the
factory's accept function; record the exact export names in the report.

## Acceptance
- Given `kicizi-84` and `kavama-92`, then compareSvg has zero diffs (image href bytes exempt; or residuals named).
- Given the AppleTwo/RIP probes, then zero diffs (or residuals named).
- Given a line the factory does not accept (and a 4-line source), then it refuses.
- Given each corpus row rendered three times, then the outputs are identical.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.

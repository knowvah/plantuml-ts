# T5c: `skinparam mode dark` element colours through a klimt `ColorMapper` seam (maintainer-approved 2026-10-12, journal row 36; no corpus row)

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

Residual family from the batch-4 close (journal row 34): the T4a probe
`tests/fixtures/salt/skinparam-mode-dark.puml` only (7 drawn-colour diffs; the `#1B1B1B`
background already matches). No cached corpus row exercises dark mode in salt, so D8's exit bar
does not depend on this task; it is listed because the mechanism is a klimt seam (stop 10);
approved to run in wave 2 (after T5a + T5b merge), in parallel with T5-cov (journal row 36).

## Mechanism (verified against the Java at the b4 close)
- Upstream: `AbstractElement#getBlack` is `HColors.BLACK.withDark(HColors.WHITE)`
  (`salt/element/AbstractElement.java:47-49`); the dark partner is resolved by the
  `ColorMapper` the `UGraphic` carries (`UGraphic#getColorMapper`, `HColorSimple#withDark`).
- Port: the port's `UGraphic` carries no `ColorMapper`; `Fore`/`Back` take `Paint` strings, so the
  partner is lost at `asPaint()`. The salt plugin keeps the background right only by mapping its
  `HColor` itself (`ColorMapper.DARK_MODE.fromColorSimple`) and re-mapping a painted background is
  a double-map hazard (`.agent-notes/sep-T4a.md`, "whole-fragment hex mapper").

## Task (TDD; jar values from the probe's `in.svg`)
1. Thread a `ColorMapper` through the klimt `UGraphic` (`UGraphic.java`'s accessor and
   `apply(UChange)` plumbing) so `HColor#withDark` partners survive to `asPaint()` — read
   `klimt/color/HColorSimple.java` and `ColorMapper.java` first; state the minimal seam.
2. Make the salt plugin stop mapping colours itself once the seam carries them (one owner).
3. Audit `class`/`activity` for the same post-process double-map (`fragment-color-mapper.ts`):
   report, do not edit, anything outside the write-set.

## Write-set
`src/core/klimt/drawing/UGraphic*.ts`, `src/core/klimt/color/**` (as the Java names them),
`src/diagrams/salt/{index,PSystemSalt}.ts` (removal only), their tests, `docs/catalog.md`,
`.agent-notes/sep-T5c.md`. Any OTHER file is a stop.

## Acceptance
- Given the `skinparam-mode-dark` probe, then it matches its jar oracle.
- Given every golden ratchet, then nothing else changes.

**Observability:** N/A. **Rollback:** Reversible (revert).

# ufp-T2a: utility plugin registration

## Observation: src/index.ts cannot grow; registrations moved out
- **Context**: adding 14 plugin imports + registrations to `src/index.ts` (523 lines at HEAD).
- **Finding**: the complexity hook allows an over-cap file only if it does not get longer. The
  imports, the order comment and every `registry.register(...)` call moved to
  `src/registered-plugins.ts` (`registerPlugins(registry)`, two helpers split at java:152/153 for
  the 30-NLOC cap); `src/index.ts` is 464 lines. `scripts/parity-dashboard.ts` parses the
  `registry.register(<type>Plugin)` calls AS TEXT (`parity-dashboard-inputs.ts:50`), so its path
  constant now points at `registered-plugins.ts`; with the old path the D9 drift gate threw
  `bucket "activity" has no engine mapping`. Extra names the regex now picks up (colors, license,
  ...) are harmless: `engineCell` only asks `includes(bucket)`.
- **Impact**: whoever moves registrations again must move that path too; the doc comment in
  `parity-dashboard-inputs.ts:46-55` still says `src/index.ts`.
- **Confidence**: High (drift gate red then green).

## Observation: Colors at java:134 renames every all-refused single-line error page
- **Context**: whole-corpus hash diff after registration — 33 rows changed, 16 outside the 17.
- **Finding**: on a 3-line `@startuml` source every candidate refuses; the merge keeps the first
  of the equal top scores (`PSystemErrorUtils.java:140-147`, `parse-refusal.ts:95-104`). Scores
  before: sequence 0 (consumed 0), class/description/state 10, so class owned the page
  ("Assumed diagram type: class"). Now colorsPlugin (type sequence, score 10) is first and owns
  it -> "sequence", as the jar prints. Movers: 14 `unknown` (help x5, listfont(s) x4, stdlib
  <lib> x4, `foo`) + 2 `timing` (`robust "WB" as ＷＢ`), plus both sudoku rows and the
  `unwind2-S8` pins error-short / error-arecibo-short 7 -> 5.
- **Impact**: multi-line error pages are unaffected (single-line factories return
  `NOT_SINGLE_LINE`, score -Infinity); they still name class where the jar names sequence
  (`error-long`, `error-arecibo`) because our sequence engine refuses with consumed 0 — a
  separate, pre-existing mechanism.
- **Confidence**: High (per-plugin scores probed; oracle text checked).

## Observation: routing/refusal gates stay green when rows render
- **Context**: the brief expected both gates to go red once the 17 rows render.
- **Finding**: full vitest run: both green. `progressNote` reports [FIXED]/[CHANGED] and "a fall
  never fails this gate" (`refusal-coverage.test.ts:366-388`).
- **Impact**: the re-pin at the close is still owed, but no gate forces it.
- **Confidence**: High.

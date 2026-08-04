# T4 — re-measure the ink-offset `text+sprite` divergence (diagnosis only)

## Context

`plantuml-ts`. SI14 T2's journal (2026-08-03, `plans/
si14-usymbol-measurement-sharing/decision-journal.md` T2 row) recorded: a
SYNTHETIC monochrome sprite (declared 16×16 with an ink-offset rectangle)
shows a genuine ~0.9px divergence between the retired data-based fit and
the object-based `Footprint` fit, for the `text+sprite` ordering
specifically. Not one of the seven jar-verified shapes; real stdlib sprites
reproduce the jar exactly. T1 has since changed exactly the suspected
mechanism (`Footprint.drawImage` now uses native raster dims − 1). ADR-4
(`plans/si15-uimage-raster-dims/decisions.md#adr-4`) is locked: this task
is diagnosis-only under `~/.claude/rules/diagnosis.md`.

## Task

1. Reconstruct the synthetic case from the T2 journal row (a 16×16 declared
   monochrome sprite whose ink is an offset rectangle, label ordering
   `text then sprite`), author it as a probe `.puml` in the SESSION
   SCRATCHPAD (not `tests/`), and generate a fresh jar oracle for it
   (single-file invocation, `-DPLANTUML_DETERMINISTIC_TEXT=true`).
2. Measure the current (post-T1) fit against the jar for both orderings
   (`sprite+text`, `text+sprite`).
3. If the divergence is gone: record closure in
   `.agent-notes/si15-ink-offset.md` with the measured numbers.
4. If it persists: produce the full diagnosis artifact (Mechanism with
   `file:line` origin; causal chain arriving at both our number and the
   jar's; ruled-out list with evidence — an empty ruled-out means you
   guessed). Instrument before hypothesising. Then state (do not implement)
   the fix shape and classification (plantuml-ts defect vs irreducible).

## Write-set

- `.agent-notes/si15-ink-offset.md` (create)

**No source file may be modified**, including "obvious" one-line fixes.

## Read-set

- `plans/si14-usymbol-measurement-sharing/decision-journal.md` (T2 rows)
- `plans/si15-uimage-raster-dims/decisions.md#adr-4`
- `src/core/svek/image/Footprint.ts` (whole)
- `.agent-notes/si14-ry-delta.md` (method exemplar — match its rigor)
- `~/.claude/rules/diagnosis.md`

## Acceptance criteria

1. Given the note, when read, then it contains fresh post-T1 measurements
   for both orderings against a fresh jar oracle.
2. Given a persisting divergence, when the note is read, then it states a
   mechanism with `file:line` origin and an evidence-backed ruled-out list
   — not a suspect list.
3. Given `git diff --name-only`, when run, then only
   `.agent-notes/si15-ink-offset.md` (untracked-dir note: `.agent-notes/`
   is gitignored — equivalently, `git status` shows no tracked-file
   changes).

## Quality bar

Valid stop conditions per `diagnosis.md` only: root cause identified
(fix deferred by design), or closure demonstrated by measurement. "This is
hard" is not a stop condition.

## Boundaries

**Always:** fresh jar oracles, single-file invocation; probes in the
scratchpad. **Ask first:** authoring anything into the tracked corpus.
**Never:** source modifications; git mutations; scratch tests in `tests/`.

## Observability

N/A.

## Rollback

Reversible — the task adds one gitignored note.

## Follow-up

If a persisting divergence is a plantuml-ts defect: the ORCHESTRATOR files
the GH issue + mission-index row (per the hybrid tracking convention); the
note is the artifact. A finding that exists only in a journal is not filed.

## Commit

None (write-set is gitignored). The orchestrator journals the outcome.

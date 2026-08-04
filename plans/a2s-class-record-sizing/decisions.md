# Architecture Decisions — A2s

## ADR-1: Refine the existing class sizing pipeline; do NOT port the SI1 body layer

**Status:** Accepted (2026-08-04)

**Context:** Upstream class node sizing routes EntityImageClass →
BodyFactory → MethodsOrFieldsArea — classes ADR-10 of
plans/bodyenhanced-atom-seams moved to mission SI1 (~12,100-line cascade).

**Decision:** A2s closes deltas inside the existing dedicated pipeline
(`measureClassifier`/`computeClassifierGeoPipeline` and its helper
modules). Evidence: `BodyEnhanced1/2` are NOT on the plain-class dimension
path (enhanced-markup bodies only — `class-body-enhanced-layout.ts` already
covers those); the pipeline already mirrors the Java structure with cited
constants (BADGE_RADIUS=11, NAME_MARGIN_TOTAL=6, ROW_ICON_ZONE_WIDTH=14,
SECTION_MARGIN_TOP=4, EMPTY_SECTION_HEIGHT=8).

**Consequences:** SI1 stays intact and unblocked. If a diagnosis proves a
delta REQUIRES the body-layer port, that is STOP condition 3, not silent
scope growth.

## ADR-2: Diagnosis-first batches keyed to identical-delta clusters

**Status:** Accepted (2026-08-04)

**Context:** The cause-classifier's buckets (other 314, container-cluster
81, element-font 32, interface-shield 31, …) are declared hypotheses. The
measured facts are the identical-delta clusters (0.018191in=1.31px ×31;
0.055371=3.99px ×20; 0.064182=4.62px ×11 all-stereotyped; 0.040579=2.92px
×11; 0.499348=35.95px ×7; 0.085696=6.17px ×6 package-related; …).

**Decision:** Batch 1 diagnoses clusters to mechanisms (cause, our
file:line, Java file:line, causal chain, ruled-out list — per
~/.claude/rules/diagnosis.md) BEFORE any fix. Fix tasks are instantiated
from diagnosis outputs and grouped by file ownership, not by bucket label.

**Consequences:** No fix ships without a stated mechanism; every fix's
predicted closure set is checked against the full ratchet re-measure.

## ADR-3: Exit bar is 100% minus NAMED entries

**Status:** Accepted (2026-08-04) — applies the 2026-07-14 conformance
ruling (≥90% slack retired).

**Decision:** Mission exits when every remaining non-conformant fixture has
a named entry in `ledger.md` citing its mechanism and evidence (backlog pin
retained). ≥90% (637/708) is a checkpoint only.

**Consequences:** "Hard" is a trigger to verify, not to skip; a remainder
entry is a tracked debt with a mechanism, never a shrug.

## ADR-4: Author fixtures + jar oracles for mechanisms without corpus coverage

**Status:** Accepted (2026-08-04)

**Decision:** When a diagnosed mechanism has no isolating corpus fixture,
write a `.puml` fixture and generate its jar oracle (recipe in README) and
verify against it — never synthetically. Same policy as the corpus memory
and svg-class README five-step path.

## Operational readiness (Phase 4, confirmed)

- **SLIs:** the ratchet numbers — size-conformant count (monotonic up),
  widened 0 (script exits 2 otherwise), class DOT EQUAL 708, description
  ratchet held. No dashboards apply.
- **Rollback:** Reversible — plain `git revert` on the feature branch;
  backlog deletions re-derivable by re-running the measure script.
- **Runtime:** measure script renders 708 fixtures — run ratchets once per
  gate pass, not per fix. Parity-survey regen uses `--out` + merge with
  concurrency 2 (single-type runs truncate other types' rows).
- **Expected drift:** pinned class SVG tests (`class-usecase-actor.test.ts`
  9/6/3-diff pins) and `parity-class.json` will drift TOWARD the oracle.
  Upgrades proceed journaled with the full breakdown; any dotEqual flip or
  verdict downgrade is a STOP (SI13 ADR-2 mechanical rule).

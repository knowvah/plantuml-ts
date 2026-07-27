# T6 — Diagnose fariba-82's residual

## Context
`fariba-82-xolu802` has a `file policy <<policy>> [ JSON body ]` with tabs and
`<b>` bold. After T1–T3 it sits ~0.034in (≈2.5px) over its pin. It is **NOT**
bold-glyph width — the deterministic measurer is weight-agnostic (ADR-2 / ADR-5).
The residual is some other per-line detail (a specific tab/quote/line, or a
height rounding).

## Task
Diagnosis mode (root cause, not symptom): instrument our per-node sizes vs the
oracle for `fariba-82`, identify the exact line/mechanism (file:line + causal
chain), and either apply a cheap in-scope fix or leave it pinned + documented.

## Read-set
- `oracle/goldens/description/fariba-82-xolu802/input.puml` + `svek-*.dot`.
- `scripts/measure-description-size-deltas.ts` (per-fixture delta).
- `src/diagrams/description/leaf-sizing.ts` (measureBox / maxLineWidth /
  textBlockHeight).

## Write-set
- Per finding: `src/diagrams/description/leaf-sizing.ts` or `parser.ts` (if
  cheap + in-scope) — OR `plans/s1l-leaf-sizing/ledger.md` (document + keep the
  pin).

## Boundaries
- Do NOT expand into container/cluster (S1L-e) or sprite (S1L-f) work — fariba
  also carries an awslib sprite; if the residual is sprite sizing, that is
  out of scope → document + pin.
- Do NOT widen any other fixture's pin to "fix" fariba.

## Acceptance criteria
- Given `fariba-82`, when diagnosed, then the mechanism is stated with a
  `file:line` origin and the ruled-out alternatives (per `rules/diagnosis.md`).
- Given a cheap in-scope fix exists, when applied, then `fariba-82`
  `maxSizeDeltaIn ≤` its prior pin (no widen) and `measure` exit 0.
- Given no cheap in-scope fix, then `fariba-82` is pinned at its true delta with
  a one-line rationale in the ledger, and `measure` exit 0.

## Commit
`fix(description): <fariba residual>` or
`docs(s1l): ledger fariba-82 size residual (S1L-b T6)`.

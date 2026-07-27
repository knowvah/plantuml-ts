# Architecture decisions — creole-lexer-unification (locked)

Confirmed 2026-07-27. Treat as fixed; if a conflicting constraint appears, STOP
and log to `decision-journal.md`.

## ADR-1 — One shared "line → visible atoms" helper; sizer drops `parseCreole`

**Context:** the sizer (`creoleVisibleText`→`parseCreole`, `core/creole.ts`) and
renderer (`buildLine`→`buildStripeAtoms`, E2r `StripeSimple`) are two separate
creole lexers that disagree on unclosed / `:`-variant tags — the root cause.

**Decision:** extract `buildLine`'s classification branches (HORIZONTAL_LINE →
no glyphs; LITERAL → `buildLiteralAtoms`; HEADING/NORMAL → `buildStripeAtoms`)
into ONE exported helper in `src/core/klimt/creole/legacy/StripeSimple.ts` (223
lines, has room — NOT `EntityImageDescriptionSupport.ts` at 493/500). Both
`buildLine` (renderer) and `creoleVisibleText` (sizer) call it.

**Consequences:** the drift class is eliminated at the source (one stripping
path, not two kept in sync); `buildLine`'s own output is byte-unchanged (it just
delegates); `parseCreole`'s OTHER callers (`annotations/blocks.ts`,
`error-renderer.ts`) are untouched.

## ADR-2 — Width measured at base font (concatenate stripped text)

**Context:** the deterministic `WidthTableMeasurer` is weight- and
family-agnostic, so `<b>`/`<u:blue>`/`<color:green>`/`<font Name>` (the confirmed
drivers) don't change glyph width once stripped.

**Decision:** keep the existing `measureLineWithAtoms` (preserves `<img>`/
`<$sprite>` handling); feed it the shared helper's stripped visible text; do NOT
measure per-atom font size.

**Consequences:** minimal, width-focused change; per-atom font-SIZE width parity
(`<size:N>`, `==` headings) stays a pre-existing, documented gap the target
fixtures don't hit.

## ADR-3 — `FontSpec`→`FontConfiguration` shim is minimal

**Context:** `buildStripeAtoms` needs a `FontConfiguration`; the sizer holds only
a `FontSpec` (`{ family, size }`).

**Decision:** build a base `FontConfiguration` (family/size from the `FontSpec`,
empty style set, black) solely to drive tag-stripping in the shared helper.

**Consequences:** no font fidelity needed in the shim (width is font-agnostic in
the table); zero new coupling beyond the shared helper import.

## ADR-4 — The spike gates the production edit; widespread widening is a STOP

**Context:** switching the sizer's lexer re-measures every description leaf.
`buildStripeAtoms` (faithful E2r port of the jar engine) SHOULD be closer to the
oracle than `parseCreole`, but corpus impact is unproven.

**Decision:** Task 1 (spike, measurement-only) reports per-fixture change
(widen/shrink/neutral) across all 351 goldens; proceed to Task 2 only if
shrinks + neutral dominate. If widespread NET widening appears, STOP and
reconsider before any production change.

**Consequences:** the ratchet stays honest; re-baseline (shrink/delete pins) is
expected; silent regressions are prevented.

## Operational readiness (Phase 4 — pure sizing/rendering library)

- **Observability:** N/A — no runtime services/SLIs. The conformance ratchet
  (`measure-description-size-deltas.ts`) + `dot-sync-report` ARE the SLI analog;
  both run in the quality gate and CI.
- **Rollback:** **Reversible** — revert the commit; no data/format migration.
  The `size-backlog.json` re-baseline is likewise revertible.
- **Scalability:** N/A — deterministic render, no load dimension.
- **Failure mode / "on-call":** a golden regresses → caught by the `measure`
  gate (zero-widened) and `dot-sync` (structure) in CI, before merge.
- **Backwards compatibility:** no public API change. DOT node dims + rendered
  SVG width for affected leaves shift toward the oracle (the intended
  improvement); gated by the ratchet.

# Architecture Decisions — S1L Tail Diagnosis

All six approved by the maintainer 2026-08-06 before execution. Treat every
one as locked. If you discover a conflicting constraint, STOP and log it to
`decision-journal.md` — do not silently override.

## ADR-1 — Findings are one file per bucket, on a uniform schema

**Context.** The next mission consumes these findings as its task input; free-
form prose would have to be re-read and re-derived to batch anything.
**Decision.** Each task writes `findings/<bucket>.md`, one record per fixture,
on the schema in [findings/SCHEMA.md](findings/SCHEMA.md).
**Consequences.** The fix mission batches directly off these records; the cost
is some rigidity in phrasing.

## ADR-2 — No source changes, and no fixes, at all

**Context.** Fixing while diagnosing is historically how fitted constants got
shipped (`NEVER ship a fitted constant` — a scan produced 10.9; the real value
was `size/4.5` from `StringBounder#getDescent`).
**Decision.** `src/` is read-only for the entire mission. Temporary probes are
allowed under `scripts_scratch/` and MUST be deleted before commit. Backlog
pins in `oracle/goldens/description/size-backlog.json` are read, never written
— including for a fixture discovered to be already conformant.
**Consequences.** The exit bar is mechanically checkable (`git diff
--name-only` contains no `src/` path), and the mission cannot widen a ratchet.

## ADR-3 — Bucket labels are inputs, never partitions

**Context.** The classifier is first-match; `container-cluster` tags any
fixture with a container keyword plus `{`, and has previously collected note
`\n` resolution, link-endpoint `\n` resolution, a colour regex, the
USymbolSimpleAbstract family, and empty-body bugs under one name.
**Decision.** The mission's headline deliverable is a **re-partition of all 26
fixtures by true mechanism**, which may have more or fewer groups than the
seven buckets. Bucket names survive only as provenance (`bucketLabel`).
**Consequences.** The fix mission batches on real write-sets instead of on
labels that cut across them.

## ADR-4 — Recorded mechanisms must be re-verified, not inherited

**Context.** On 2026-08-06 two prior missions' recorded mechanisms for the
same symptom were each half-right (S4 jar-verified only divider-drawing state
boxes; S6's algebra sampled only a divider-less one), and S6's derived
one-character fix would have regressed the ratcheted golden
`jocela-05-niba392`.
**Decision.** S1L-i's and S1L-j's mechanisms as recorded in
`planning/mission-index.md`, and any cause recorded in
`plans/s1l-leaf-sizing/ledger.md`, must be re-confirmed against current code
and current measured numbers before being carried into a finding.
**Consequences.** Four fixtures get a cheap verify rather than a from-scratch
derivation; no claim enters the findings unverified.

## ADR-5 — Findings estimate the fix; they never prototype it

**Context.** `CLAUDE.md` requires sizing the real work rather than declaring
things hard — but prototyping is how a diagnosis mission silently becomes a
fix mission without a fix mission's gates.
**Decision.** Each record names `proposedWriteSet[]` and a `sizeEstimate`
(files, blast radius, verification cost). No code, no patch, no diff.
**Consequences.** The fix mission is plannable straight from the output;
estimates carry normal uncertainty and are labelled as estimates.

## ADR-6 — An inherent-tolerance divergence is PROPOSED, never declared

**Context.** The LaTeX pair is a permanent divergence and others may be; but
per `CLAUDE.md`, difficulty is never grounds for one — "a feature upstream
ships and you could reproduce, but found hard, is a gap to close, never a
divergence to declare."
**Decision.** Such a finding is written up as a proposed `DIVERGENCES.md`
entry, flagged for maintainer ruling, and the fixture stays in scope until
ruled on.
**Consequences.** The 100%-minus-KNOWN-divergences bar stays honest; a
maintainer decision is required to close any such fixture.

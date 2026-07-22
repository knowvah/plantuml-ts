# G7 Architecture Decisions (locked 2026-07-22, maintainer-approved)

## D1 — Diagnosis-first with an explicit isolation matrix

No implementation until the rank×context interaction is adjudicated.
Matrix: start from the proven control (bitaxo shape — cluster + rank
group + bare anchor in `ee`; byte-exact in G6 attempt 3) and add ONE
variable per cell: (a) +`${id}i` wrapper, (b) +nested child cluster
inside `ee`, (c) +parent cluster wrapping everything, (d) +non-border
content (pseudo-node) in `ee`. Each cell measured three ways: real
`dot` (ground truth), graphviz-ts DOT-text path, graphviz-ts builder
path. Rejected alternative: diagnosing on pesita/kotagu directly —
too many co-varying factors (that burned G6 attempts 1-2).

## D2 — Adjudication with external-fix pause (graphviz-ts is read-only)

Decisive test: text path vs builder path on identical structure (text
path is proven to match real dot on jar's full DOT). If a builder
call-sequence variant matches → usage defect → Round-3 addendum to
the G6 derivation doc; proceed to D3. If the builder path cannot
match under any correct sequence → library defect → file
`docs/graphviz-issues/09-*.md` (self-contained: finding, minimal
repro DOT, builder transcript, expected/actual table, census impact)
+ TRACKER line → **planned mission PAUSE**. This mission NEVER
modifies `../graphviz-ts`; the fix comes from the graphviz-ts
project. Resume per README's cold-start procedure (pin bump → repro
re-verify → full gates → batch 3). Both outcomes pre-authorized.

## D3 — Attempt 4 is paper-gated, and last

Implementation starts only after the adjudicated spec reproduces all
three target bboxes ON PAPER: pesita `AA` 126×104.72, kotagu
`CompositeState` 289×358, bitaxo `C` 42×101.72 (regression control).
Any measured miss after implementation → full revert (G5 protocol:
`git show HEAD:<path> > <path>`, verify clean, re-run gates) →
PERMANENT stop; a fifth attempt requires fresh human sign-off.
Rationale: three cycles proved the code is cheap and correct — the
spec is what fails; gate the spec, not the code.

## D4 — `<<O-O>>` stereoLines sentinel exclusion ships with attempt 4

Jar's `Stereotype.isWithOOSymbol()` sentinel (bracket-stripped
`"o-o"` in this port's AST) is EXCLUDED from the stereo line count
(T8-R1 §2a, documented, never implemented; silently corrupted
attempt 3's pesita prediction — titleTableHeight must be 28, not
42). Prerequisite to D3's paper gate.

## D5 — Carried hard bars (unchanged from G6)

Pins byte-exact only; size-backlog tighten-only/widen-none with
full-revert protocol; DOT gate frozen at every commit; census floors
never shrink (svg-state 57/271 at mission start); upstream names
preserved (`FrontierCalculator`, `manageEntryExitPoint`, ...); no
geometric approximation ever.

## Operational readiness (confirmed 2026-07-22)

Gates-as-SLIs (suite / DOT gate / parity / ratchet / backlog /
census). Rollback: everything Reversible (git revert; pin reverts
via package.json+lockfile; full-revert protocol proven 3×). No
irreversible changes. Failure modes + mitigations: (1) attempt-4
miss → auto revert+stop; (2) new-.tgz regression on resume → gate
run in T3 before any work, revert pin + reopen issue 09; (3) stale
resume context → README PAUSED block carries the cold-start
procedure. Backwards compat: seam fields additive-only; the ratchet
system is the contract.

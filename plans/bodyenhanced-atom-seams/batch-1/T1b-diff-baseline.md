# T1b — Diff-count baseline ratchet for the 22 blast-radius fixtures

## Context

T1 (`af9406b`) measured every fixture ADR-1's rewire will affect and found
**0 of 22** conformant, so ADR-5's byte-freeze gate cannot be built. The
maintainer amended ADR-5 (see `decisions.md`): the gate becomes a
**monotone-improvement ratchet** over the same 22 fixtures.

This is the last task in the gating batch. Batches 2-5 do not start until
it lands.

## Task

Pin each of the 22 candidates' CURRENT diff count under
`DeterministicMeasurer`, and assert in the suite that no count ever rises.

Semantics:

- **rise** → FAIL, naming the fixture, its baseline, and its new count
- **fall** → PASS, and the failure message on a *later* rise must reference
  the baseline, so a silent re-baseline is not possible by editing one number
- **reaches 0** → the fixture is now genuinely conformant. The test must say
  so explicitly and instruct promotion into `ratchet.json` as a byte-exact
  golden per the goldens README's Add rule (which also requires
  `dotEqual=true`). Do NOT auto-promote — promotion writes a golden, and
  that stays a deliberate act.
- **errors** (`bootstrap-0`, `ruziru-69-xixo434`, `fepuvo-06-rugi981`) →
  record as `status: "error"` with the reason, not as a numeric baseline.
  An error must not silently read as "0 diffs".

## The 22 fixtures

Group 1 — 11 known-affected: `component/bozana-38-xufi750`,
`bozoju-49-kufo528`, `gucefa-91-pume734`, `kanute-77-lacu414`,
`lotofa-28-rudo664`, `sevage-80-seva382`, `texacu-57-daci050`;
`usecase/cobuju-30-paxo591`, `bootstrap-0`, `ruziru-69-xixo434`,
`jecici-56-bimu826`.

Group 2 — titled separators: `component/codabo-50-mupa164`,
`xufexu-38-fola855`; `usecase/fepuvo-06-rugi981`, `nixura-77-bina738`.

Group 3 — bare separators: `component/babafi-51-dixi026`,
`butebe-90-dozo380`, `dexigu-24-deru622`, `kenece-24-juku624`,
`tajadu-40-juro990`, `zifaji-87-raki559`; `usecase/pivudu-29-pele178`.

**Recompute every count yourself.** T1's reported numbers are context, not
input — do not copy them into the baseline.

## Write-set

- `oracle/goldens/svg-description/diff-baseline.json` (new) — the manifest
- `tests/oracle/svg-conformance/description.diff-baseline.ratchet.test.ts` (new)
- `oracle/goldens/svg-description/README.md` — document the new ratchet and
  its promotion rule

## Read-set

- `tests/oracle/svg-conformance/description.golden.ratchet.test.ts` — the
  sibling ratchet whose shape and failure-message discipline to mirror
- `tests/oracle/svg-conformance/render-fixture.ts`, `compare.ts`
- `scripts/svg-conformance-census.ts` — the same measurement this must agree with
- `oracle/goldens/svg-description/README.md` — Add rule, Remove rule
- `.agent-notes/T1-svg-goldens.md` — T1's per-fixture mechanisms

## Acceptance criteria

- Given today's code, then every one of the 22 has a baseline entry
  (numeric count or an `error` status with a reason) and the suite passes
- Given a fixture whose diff count rises, then the suite FAILS naming the
  fixture, its baseline, and its new count — **verify by forcing one rise
  and observing the failure, then reverting.** Report the message you saw
- Given a fixture whose count falls, then the suite passes
- Given a fixture that reaches 0, then the suite reports it as ready for
  promotion and does not auto-promote it
- Given the existing 48-golden ratchet, then it is untouched and still green
- Given the three sizing/DOT ratchets, then all are exactly unmoved

## Observability / Rollback

This task IS the gate. Reversible: test-and-manifest-only addition, no `src/`.

## Quality bar

All four gates, plus the three sizing/DOT ratchets unmoved
(317/351 w0 · 262/90/708 EQUAL · 219/708 w0).

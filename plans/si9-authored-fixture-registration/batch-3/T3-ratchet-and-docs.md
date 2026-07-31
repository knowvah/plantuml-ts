# T3 — Ratchet in; correct the now-false docs

## Context

See [`../README.md`](../README.md). T1 made authored fixtures reachable; T2
gave them `parity.json` rows with `dotEqual: true`, satisfying the ratchet's
AC3 eligibility test. This task pins them and fixes the two documents that
their registration falsifies.

## Task

### 1. Measure, then ratchet
For each of
`oracle/goldens/svg-description/usecase/sprite-svg-{bootstrap,archimate,multiline}-0`:
render through `tests/oracle/svg-conformance/render-fixture.ts` with
`DeterministicMeasurer`, compare with
`compareSvg(ours, jar, 'deterministic')`, and add to `ratchet.json` **only**
those with zero diffs.

Entry shape (match the existing rows):

```json
{ "slug": "sprite-svg-bootstrap-0", "type": "usecase",
  "addedAt": "2026-07-31", "source": "authored" }
```

Measured 2026-07-31, all three were at zero diffs — but **re-measure**. The
port has moved, and citing that figure instead of reproducing it is exactly
what method rule 2 forbids.

### 2. Rewrite the README section
`oracle/goldens/svg-description/README.md` carries a section titled
"Authored sprite fixtures — INTENTIONALLY NOT RATCHETED". Rewrite it to
describe the registered state: what these fixtures cover, that they are now
ratcheted, and — briefly — that authored fixtures reach the parity corpus via
`dot-sync-report.ts`'s enumeration of `oracle/goldens/svg-description/`.
A future reader should be able to author a fixture and know it will register.

### 3. Amend, do not rewrite, the predecessor's ADR-5
`plans/svg-sprite-nanoparser/decisions.md` § ADR-5 states these fixtures are
deliberately absent from `ratchet.json`. Append a **dated amendment**
recording that SI9 closed the registration gap and they are now ratcheted.

Do **not** edit the original text. That mission recorded three of its own
amendments the same way; its history stays readable.

## Write-set — write NOTHING outside these

- `oracle/goldens/svg-description/ratchet.json` (add passing fixtures ONLY)
- `oracle/goldens/svg-description/README.md`
- `plans/svg-sprite-nanoparser/decisions.md` (append an amendment only)
- `plans/si9-authored-fixture-registration/decision-journal.md`

**Do NOT modify the three `golden.svg` files.** They are jar output.

## Read-set

- `tests/oracle/svg-conformance/description.golden.ratchet.test.ts` — the
  entry shape and the AC3 eligibility test
- `tests/oracle/svg-conformance/compare.ts` (`compareSvg`) and
  `normalize.ts` — **the ratchet's real comparator**
- `tests/oracle/svg-conformance/render-fixture.ts` — the render path the
  ratchet uses (NOT `renderSync`)
- `oracle/goldens/svg-description/README.md`,
  `plans/svg-sprite-nanoparser/decisions.md` § ADR-5

## Architecture decisions (locked)

- [ADR-5](../decisions.md#adr-5) — rewrite the README; **amend** the
  predecessor's ADR-5 rather than editing it

## Acceptance criteria

1. Given each fixture rendered through `renderFixture` with
   `DeterministicMeasurer` and compared with
   `compareSvg(…, 'deterministic')`, then its pass/diff count is recorded in
   the journal.
2. Given a fixture at zero diffs, then it is added to `ratchet.json` with
   `type: "usecase"` and `source: "authored"`.
3. Given a fixture with any diffs, then it stays **out** and the journal
   records what differs — element counts and the first differing path.
4. Given `npm test`, then the ratchet suite passes with every added fixture
   included, and AC3 no longer reports a missing `parity.json` entry.
5. Given the README and the predecessor's ADR-5, then neither still claims
   these fixtures are deliberately un-ratcheted.

## Quality bar

All four gates exit 0. 389 SVG goldens byte-identical.
`npx tsx scripts/measure-description-size-deltas.ts` at 320/351, widened 0.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — revert the commit.

One asymmetry: a ratcheted fixture is held forever by design. Reverting
removes the pin cleanly, but only add one you have actually measured, this
run, on this code.

## Boundaries

**Always:** measure before pinning. Use `compareSvg`, never `===` — the
ratchet strips `data-*` attributes and rounds numerics under a 0.01
tolerance, and raw string comparison invents blockers that do not exist.
This already cost the predecessor mission time.

**Never — this is a STOP:** edit a `golden.svg` to make a fixture pass. That
inverts the oracle. If our output looks *more* correct than the jar's, that
is a finding for the maintainer.

**Never:** add a fixture to `ratchet.json` you have not measured this run.
Never re-pin `oracle/goldens/description/size-backlog.json`.

**Acceptable outcome:** a fixture that does not pass stays out. Say so
plainly with the measurements. Do not engineer toward the pin.

## Method rules

1. **Trace dependency cascades TWO levels** — before editing `ratchet.json`,
   confirm what reads it (the ratchet suite) and what reads the README
   section you are rewriting.
2. **Verify any "already measured / already passing" claim against the
   CURRENT code.** The zero-diff figures in this file were taken on
   2026-07-31 and the port has moved since. Re-measure; do not cite them.

## Commit

One commit: `test(T3): ratchet in the authored sprite fixtures`

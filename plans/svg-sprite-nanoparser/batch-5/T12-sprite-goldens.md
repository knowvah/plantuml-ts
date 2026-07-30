# T12 — Measure the authored sprite goldens; ratchet in what passes

## Context

See [`../README.md`](../README.md) for the mission mechanism (jar-verified).

Three sprite fixtures were authored during planning (2026-07-30) and already
sit on disk with jar-generated goldens:

- `oracle/goldens/svg-description/usecase/sprite-svg-bootstrap-0`
- `oracle/goldens/svg-description/usecase/sprite-svg-archimate-0`
- `oracle/goldens/svg-description/usecase/sprite-svg-multiline-0`

They exist because **no other golden in any suite contains a sprite**, so this
mission's central output change would otherwise ship with zero golden
coverage. They are absent from `ratchet.json` on purpose — the ratchet test
iterates `ratchet.json` and never the directory listing, so an unlisted
fixture is inert.

Measured state at authoring:

| fixture | ours | jar |
|---|---|---|
| `sprite-svg-bootstrap-0` | 0 `<path>`, 4 data-URI `<image>` | 6 `<path>`, 0 `<image>` |
| `sprite-svg-archimate-0` | 0 `<path>`, 2 data-URI `<image>` | 2 `<path>`, 0 `<image>` |
| `sprite-svg-multiline-0` | 0 `<path>`, 3 data-URI `<image>` | 4 `<path>`, 0 `<image>` |

## Task

Re-measure all three after T9/T10. Report the diff for each. Ratchet in any
fixture that renders **byte-identical** to its golden.

## Write-set

- `oracle/goldens/svg-description/ratchet.json` — **only** to ADD a fixture
  that measures byte-identical
- `plans/svg-sprite-nanoparser/decision-journal.md` — the measurements

Do NOT modify the three `golden.svg` files. They are jar output.

## Read-set

- `oracle/goldens/svg-description/README.md` — the "Authored sprite fixtures"
  section explains the un-ratcheted status and why declarations are inlined
- `tests/oracle/svg-conformance/description.golden.ratchet.test.ts` — the
  ratchet's entry shape (`slug`, `type`, `addedAt`, `source`) and its
  `DeterministicMeasurer` discipline
- `tests/oracle/svg-conformance/render-fixture.ts` — the render path the
  ratchet uses (NOT `renderSync`; no include resolver, which is why the
  fixtures inline their sprite declarations)

## Architecture decisions (locked)

- [ADR-5](../decisions.md#adr-5) — DOT parity is the mission gate. **These
  goldens are diagnostic, not an acceptance criterion.**

## Acceptance criteria

1. Given each of the three fixtures, when rendered through `renderFixture`
   with `DeterministicMeasurer`, then the `<path>` / `<image>` counts are
   reported in the journal against the jar's.
2. Given a fixture that renders byte-identical, then it is added to
   `ratchet.json` with `type: "usecase"` and `source: "authored"`.
3. Given a fixture that does NOT render byte-identical, then it stays out of
   `ratchet.json` and the journal records **what still differs** — element
   counts, and the first differing element.
4. Given the full suite, then `npm test` exits 0 either way — an
   un-ratcheted fixture must not fail anything.

## Quality bar

All four gates exit 0. SVG goldens 310/22/57 byte-identical.

**Explicitly acceptable outcome: none of the three ratchets in.** Byte-exact
SVG equality is a stricter bar than the two-channel architecture fix
promises. If they still differ, say so plainly with the measurements — that
is a documented gap, not a failure to be worked around, and it must NOT block
mission close.

**Never** edit a `golden.svg` to make a fixture pass. That inverts the oracle.
If our output looks more correct than the jar's, that is a finding for the
maintainer, not an edit.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — `ratchet.json` additions revert cleanly; a ratcheted fixture
is held forever by design, so only add one you have actually measured.

## Method rules

1. **Trace two dependency levels** before ruling on scope.
2. **Verify any "already fixed" claim against the CURRENT call graph.**
   Applies to the counts in the table above too — they were measured on
   2026-07-30 and the port has moved since. Re-measure; do not cite them.

## Commit

One commit: `test(T12): measure authored sprite goldens against the jar`

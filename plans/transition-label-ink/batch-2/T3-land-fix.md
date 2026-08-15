# T3 — land both mechanisms, in one commit

## Context

Read, in order: `plans/transition-label-ink/evidence.md`,
`.agent-notes/transition-label-ink.md` (T1),
`.agent-notes/transition-label-ink-port.md` (T2). Between them they carry
the mechanism, the exact lines, and the blast radius. You should need no
further Java reading.

**Your write-set is whatever the human approved at the checkpoint** — see
`decision-journal.md`. If you find you need a file outside it, STOP and ask;
that is the same stop condition the checkpoint exists to enforce.

## Task

Land both mechanisms together:

**(A)** `src/diagrams/state/layout-ink-extent.ts:391` folds the label's
RESERVED box (`transition.label.width`, 113). Upstream folds the DRAWN text
(111.475) — `LimitFinder.java#drawText`, which
`src/core/klimt/drawing/LimitFinder.ts#drawText` already ports correctly.
Route the fold through that rule.

**(B)** Whatever T1 named. Cite its upstream `file:line` in the code.

Write the tests with the change, not after. At minimum a unit test that pins
the fold to the drawn-text rule, and one that pins whichever mechanism (B)
turned out to be.

## Boundaries on the numbers

- Every constant carries an upstream `file:line` (D4). **`margin = 21` is
  forbidden** — it fits to 0.002 and has no upstream source.
- If the fixture only lands by way of an uncited number, STOP and report.
  Per `CLAUDE.md`: "Never fit a value — keeping whatever shrank the error is
  forbidden *especially* when it shrinks."
- Do not touch the `labelInk: false` path (D5).

## Acceptance criteria

1. Given `bemena-23-zebu249`, `pajefo-95-neri955` and `xepafa-33-lazi826`,
   when `measure-composite-declared-size.ts` runs, then each reports
   composite width `deltaPx` **0.000**.
2. Given the full corpus, then `exact` is strictly greater than 2454 and no
   previously-exact declaration became mismatched.
3. Given `shape-match-report.ts`, then it does not fall from 776 / 25695.
4. Given the DOT gate, then state parity is **268/268**, unmoved — a moved
   DOT means the change reached the FIXEDSIZE table reservation rather than
   the ink fold, which is a stop (see T2's finding on `label.width`'s two
   consumers).
5. Given all 59 svg-state pins, then every one holds. **A broken pin is a
   stop, never a re-baseline.**

## Quality bar

All four gates exit 0. Coverage 90/90/90 on new code. The complexity hook
BLOCKS on file length 500 / function 30 NLOC / CCN 10 / 5 params.

Heads-up: a bare `<` in an object-literal VALUE makes lizard swallow the
rest of the file and report a wildly inflated NLOC on the enclosing
function. Extract a named predicate. See
`.agent-notes/lizard-lt-in-object-literal.md`.

## Boundaries

- **Always:** one commit for both mechanisms; cite `file:line` for every
  constant.
- **Ask first:** any file outside the approved write-set.
- **Never:** run a git command. Never re-baseline a pin. Never land one
  mechanism without the other.

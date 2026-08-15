# Mission: a transition label's ink is the text it DRAWS, not the box it reserved

## Objective

`state-composite-inner-canvas` halted at T2 with a precise diagnosis: a
state composite's declared size is already a faithful port of
`SvekResult#calculateDimension`, and the residual 0.527 is a transition
LABEL's contribution to the composite's inner ink. This mission is that
successor. **Read that mission's `decision-journal.md` STOP entry first.**

## What is already established — do NOT re-derive any of this

Measured on `bemena-23-zebu249`'s `Configuring` composite (probes since
reverted; every number below is from a real run or from jar's own files):

| | ours | jar | verdict |
|---|---|---|---|
| Reserved label box in the DOT | `WIDTH="113"` | `WIDTH="113"` | **identical** |
| Measured text width | 111.475 | `textLength="111.475"` | **identical** |
| Composite ink extent | 357.86168 | 357.33498 | Δ **+0.527** |
| Ink box | minX 0, maxX 357.86168 | — | maxX IS the label's reserved right edge |

So the label box is right, the text measurement is right, and the DOT is
right. Note (c) in `.agent-notes/class-ink-shared-offset-groups.md`
separately ruled out our DOT and the engine. What is left is the INK FOLD.

## The mechanism, and why a one-line fix is wrong

`state/layout-ink-extent.ts:391` folds the label's RESERVED box:

```ts
addPoint(box, transition.label.x + transition.label.width, transition.label.y);
```

`label.width` is `computeReservedLabelBox`'s `reservedWidth` (113).
Upstream's `LimitFinder#drawText` folds the DRAWN text instead —
`addPoint(x + dim.getWidth(), …)` where `dim` is the StringBounder's
measurement (111.475). Our own `LimitFinder.ts#drawText` is a verbatim port
of that and already does the right thing; this call site simply does not go
through it.

**But correcting only that overshoots, and the arithmetic says so:**

```
reserved - measured        = 113 - 111.475 = 1.525   (the fold is this much too wide)
observed delta             =                  0.527
=> a SECOND contributor of                    0.998  pulls the other way
```

Folding the drawn text alone lands the extent at 356.337 against jar's
357.335 — 0.998 SHORT. Two independent mechanisms, opposite signs. Fixing
one and shipping would trade a +0.527 error for a −0.998 error and look
like a regression on the harness, correctly.

The 0.998 is suspiciously close to 1 and is UNIDENTIFIED. Finding it is
Batch 1, and it is the whole mission — a candidate worth checking first is
jar's own `minX`, which this port assumes is 0 for this fixture and which
was never independently measured on jar's side.

## Scope

The three named fixtures (`bemena-23-zebu249`, `pajefo-95-neri955`,
`xepafa-33-lazi826` — one diagram in three spellings) plus whatever the
`labelInk` fold reaches. `computeSvekResultGeometry` passes `labelInk:
true`; the document-level functions pass `false` and are jar-verified and
pinned at the point-only fold, so **they must not move**.

## This mission moves fixtures — deliberately, and only these

Unlike the constants work, this one is a fidelity fix.

| Signal | Baseline | Direction |
|---|---|---|
| `measure-composite-declared-size.ts` exact | 2454 / 2642 | must RISE |
| The three named fixtures' composite width | Δ 0.527 | **0.000** |
| `shape-match-report.ts` | 776 / 25695 | must not FALL |
| state DOT-parity | 268/268 | unmoved |
| svg-state ratchet | 59 pins | all hold |

`measure-state-size-deltas.ts` already exits 2 on a pre-existing
`tumaba-64-tosu281` 1e-6 wobble — not this mission's, see
`.agent-notes/g7-followup-pin-eligibility.md`.

## Batches

| # | What | Depends on | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | Identify the 0.998. No code changes. | — | [ ] |
| [2](batch-2/overview.md) | Fix both mechanisms together; sweep | B1 | [ ] |

**Batch 1 may end the mission.** If the 0.998 turns out to be a jar-side
quirk we should not reproduce, or a mechanism whose fix is out of scope,
saying so with evidence beats a fix that nets to zero.

## Branch

`feat/transition-label-ink` off `main`. Merge with a merge commit, never
squash.

## Quality gates

```
- command: npm run typecheck
  pass: exit 0
- command: npm run lint
  pass: exit 0
- command: npm test
  pass: exit 0
- command: npm run build
  pass: exit 0
- command: npx tsx scripts/dot-sync-report.ts state
  pass: 268/268, unmoved
  on_fail: stop
- command: npx vitest run tests/oracle/svg-conformance/state.golden.ratchet.test.ts
  pass: all 59 pins hold
  on_fail: stop
```

## Stop conditions

- Fixing one mechanism without the other. The two have opposite signs; a
  partial fix is a regression, and the harness will say so.
- A svg-state pin breaks, or state DOT-parity leaves 268/268.
- The document-level (`labelInk: false`) fold moves. It is separately
  jar-verified and pinned.
- Any non-state diagram type moves.
- A constant is introduced without an upstream `file:line`.
- Two consecutive gate failures on the same check — diagnose to a
  mechanism, then STOP with the full `~/.claude/rules/diagnosis.md`
  artifact.

## Index

- `plans/state-composite-inner-canvas/decision-journal.md` — the STOP entry
  this mission continues from. **Read it first.**
- `scripts/measure-composite-declared-size.ts` — the exact, exhaustive
  oracle (jar's cached `svek-N.dot` declarations). Baseline 2454/2642.
- `src/core/klimt/drawing/LimitFinder.ts#drawText` — the rule the fold
  should be going through.

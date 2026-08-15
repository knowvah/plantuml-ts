# Mission: a state composite is 0.527px too wide, and we know almost why

## Read this first

You are starting cold. A previous session did four sessions' worth of
diagnosis on this and eliminated eight hypotheses. **[evidence.md](evidence.md)
carries every measurement with its `file:line`. Read it before anything
else** — re-deriving it is the single most expensive thing you could do, and
it is already done.

This mission has **two halves separated by a human checkpoint**. Batch 1
investigates and writes NO source code. You then stop, report, and ask for
the write-set to be expanded. Batch 2 fixes.

## The defect in one paragraph

Three state fixtures (`bemena-23-zebu249`, `pajefo-95-neri955`,
`xepafa-33-lazi826` — one diagram in three spellings) declare their
`Configuring` composite **0.527px wider** than jar does: 392.86168 against
jar's 392.335. Because graphviz centres the node, everything to its right
sits at half that, 0.261 — which is the offset
`.agent-notes/class-ink-shared-offset-groups.md` item (c) recorded and never
explained.

## Where the diagnosis got to

Two independent mechanisms, pulling opposite ways:

```
(A) our ink fold uses the label's RESERVED box (113) where upstream's
    LimitFinder#drawText folds the DRAWN text (111.475)        -1.525
(B) an unidentified contributor                                +0.998
    ------------------------------------------------------------------
    net                                                        +0.527  observed
```

**(A) is understood and its fix is known.** **(B) is not.** Fixing (A) alone
lands the extent 0.998 SHORT — trading a +0.527 error for a −0.998 one,
which the harness will correctly call a regression. That is why this is an
investigation mission and not a one-line patch.

The sharpest statement of (B): **jar's ink is exactly 1.000 wider than the
rightmost thing jar draws.** Its own SVG draws to 374.335; its composite
width implies 375.335.

## What is already eliminated — do NOT re-investigate

Full detail and method in [evidence.md](evidence.md). Summary:

| Hypothesis | Verdict |
|---|---|
| Text measurement differs | **Dead.** jar's `textLength="111.475"` = ours, and `DriverTextSvg.java:126-127` proves `textLength` IS the `StringBounder` width `LimitFinder` folds |
| Reserved label box differs | **Dead.** jar's DOT declares `WIDTH="113"`, same as ours |
| `labelShield` | **Dead.** `SvekEdge.java:353-356` — it is 0 or 7, never 1, and 0 here |
| `Display.create0`'s wrapper chain | **Dead.** `SheetBlock2` → `UGraphicStencil` overrides `drawHline` only; a one-line label has no rule |
| Arrowhead ink (disabled by a workaround) | **Dead.** Enabling it changes this fixture's extent not at all |
| Composite shield | **Dead.** `InnerStateAutonom.java:203-205` returns `Margins.NONE` |
| Our DOT / the engine | **Dead** (prior work, note (c)) |
| A formula-level `+1` in the margin layer | **REOPENED** — the earlier rejection was unsound, see evidence.md §5 |

## Batches

| # | What | Write-set | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | Java excavation + port-side trace. **No `src/` edits.** | `.agent-notes/` + this brief | [ ] |
| — | **CHECKPOINT — stop, report, request write-set expansion** | — | [ ] |
| [2](batch-2/overview.md) | Land both mechanisms in one commit; sweep | as approved at the checkpoint | [ ] |

## The checkpoint is a hard stop

Batch 1 may not touch `src/`. When it ends you must **STOP and report**:

1. The (B) mechanism with an upstream `file:line`, or a stated proof that
   the premise behind it is wrong.
2. The exact lines Batch 2 needs to change.
3. A proposed write-set, for a human to approve.

Editing `src/` before that approval is a stop condition, not initiative.
The write-set is deliberately unspecified because the remaining candidate
points at `SvekNode`/`GroupMakerState`, which is **outside**
`src/diagrams/state/` — guessing now would be wrong or uselessly broad.

**Batch 1 may end the mission.** "This is not reproducible in our
architecture because X, with evidence" is a success. A fix that nets to
zero is not.

## Measurements this mission is judged on

| Signal | Baseline | Bar |
|---|---|---|
| `measure-composite-declared-size.ts` exact | **2454 / 2642** | must RISE |
| The three fixtures' composite width delta | **+0.527** | **0.000** |
| `shape-match-report.ts` | **776 / 25695** | must not FALL |
| state DOT-parity | **268/268** | unmoved |
| svg-state ratchet | **59 pins** | all hold |

`measure-state-size-deltas.ts` already exits **2** on a pre-existing
`tumaba-64-tosu281` 1e-6 wobble. Not yours, not a regression — see
`.agent-notes/g7-followup-pin-eligibility.md`.

## Branch

`feat/transition-label-ink` off `main`. Merge with a **merge commit, never
squash**. Agents share this worktree: **no agent runs any git command**; the
orchestrator commits after each batch.

## Quality gates

Run all four between every batch. **Never pipe `npm test`** — `tail`'s exit
code masks vitest failures.

```
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm test
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: npx tsx scripts/dot-sync-report.ts state
  pass: 268/268, unmoved
  on_fail: stop
- command: npx vitest run tests/oracle/svg-conformance/state.golden.ratchet.test.ts
  pass: 59 pins hold
  on_fail: stop
```

First-run setup, if the tree is fresh: `npm install`, then
`npx jiti scripts/vendor-stdlib.ts` (the suite fails at global setup without
`assets/stdlib/`), then `python3 scripts/populate-corpus.py` if you need
`tests/corpus/`.

## Stop conditions

- **Any `src/` edit before the checkpoint.**
- Fixing (A) without (B), or vice versa. Opposite signs; a partial fix is a
  regression and the harness will say so.
- **Introducing a constant with no upstream `file:line`.** Specifically:
  `margin = 21` fits the arithmetic to 0.002 and is FORBIDDEN — see
  decision D4.
- A svg-state pin breaks, or state DOT-parity leaves 268/268.
- The document-level (`labelInk: false`) ink fold moves — separately
  jar-verified and pinned.
- Any non-state diagram type moves.
- Two consecutive gate failures on the same check. The cap bounds **edits,
  not investigation** — keep diagnosing until you can state the mechanism,
  then STOP and log the full `~/.claude/rules/diagnosis.md` artifact
  (mechanism, `file:line`, causal chain, what was ruled out).

## Push forward without asking when

- The choice is purely stylistic and does not change behaviour.
- A task is simpler than estimated (log why).
- A stale comment or cross-reference is found en route — fix it in place.

## Index

- **[evidence.md](evidence.md)** — every measurement, every dead hypothesis.
  **Read first.**
- [decisions.md](decisions.md) — the four locked decisions
- [diagrams/frame.md](diagrams/frame.md) — the coordinate frames, which is
  where this problem is easiest to get lost
- [decision-journal.md](decision-journal.md) — append during execution

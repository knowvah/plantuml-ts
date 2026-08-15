# Mission: a USymbol's ink is the symbol it DRAWS, not a box rule

## Objective

`class-ink-box.ts#addClassifierInk` dispatches a classifier's ink extent by
shape, and it has branches for exactly three: `folderTab`, `usecase`,
`lollipop`. Everything else falls through to `addRectInk`'s asymmetric
`(x - 1, y - 1)` corner (`class-ink-shapes.ts:82-84`).

That is wrong for every leaf drawn as a **USymbol** rather than a box. An
`actor` leaf draws a `UEllipse` head, a `UPath` body and a label `UText`;
jar's ink is the union of those DRAWN shapes. Measured on
`cacoma-43-poxu615`: the actor's geo box top is `y = 0` and its drawn head
ellipse top is `y = 0.5`, against our `y - 1` — a uniform **1.5** offset
that then moves the whole document.

The fix is not a fourth branch. Upstream has ONE ink mechanism — walk the
drawn output with `LimitFinder` — and this port already does exactly that
in one place, for edge decorations:

```ts
const finder = LimitFinder.create(INK_STRING_BOUNDER, false);
place(headName, last, headAngle, 'none').drawable.drawU(finder);
return { minX: finder.getMinX(), … };
```
`class/renderer-arrowhead.ts#edgeExtremityInk:345-366`

A `USymbol`'s `asSmall`/`asBig` return a drawable in the same way
(`core/decoration/symbol/USymbol.ts:62-73`), so the same shape applies.

## Branch

`feat/usymbol-ink-rule` off `main`. Merge with a **merge commit, never
squash**. Agents share this worktree: **no agent runs any git command**;
the orchestrator commits after each batch.

## Scope, and why it is small but not trivial

Five cached class fixtures carry an actor/usecase-style USymbol leaf:
`cacoma-43-poxu615`, `cezaka-60-jado323`, `class-allowmixing-usecase-mix`,
`class-usecase-inline-img`, `class-usecase-inline-sprite`. Note (b) says
"6"; the enumeration finds 5 in the class cache — **T1 reconciles that
discrepancy before anything else.** A count that does not reproduce is a
signal the family is defined differently than assumed, not a rounding error.

The blast radius is wider than the fixture count: `addClassifierInk` is on
the shared class/object ink path, so a careless change moves every class
diagram. The `usecase` and `lollipop` branches already dispatch away from
the box rule and are CORRECT — this mission generalises the mechanism
behind them, it does not replace their behaviour.

## The measurement that matters

| Signal | Baseline | Direction |
|---|---|---|
| `cacoma-43-poxu615` / `cezaka-60-jado323` uniform offset | 1.5 | **0** |
| Class doc-size-exact fixtures | T1 pins it (773 at last mission close) | must not FALL |
| Rigid-aligned matching shapes | T1 pins it (25695 at last close) | must RISE |
| Class DOT-parity ratchet | 712/712 | unmoved |
| svg-class / svg-object pins | all | all hold |

`scripts/shape-match-report.ts` is the harness (the one
`namespace-cluster-box` used); T1 re-pins its baseline rather than trusting
the numbers above, which are quoted from that mission's close-out and are
one merge old.

## Batches

| # | What | Depends on | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | Baseline + reconcile the family + a symbol ink walk | — | [x] |
| [2](batch-2/overview.md) | Dispatch USymbol leaves to it; sweep and close | B1 | [x] `bb820507` |

## Quality gates

Run all four between every batch. **Never pipe `npm test`.**

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
- command: npx tsx scripts/dot-sync-report.ts class
  pass: 712/712, unmoved
  on_fail: stop
- command: git diff --name-only HEAD~1
  pass: matches the declared write-set only
  on_fail: stop
```

## Stop conditions

- A task needs a file outside its write-set that is in no other task's
  write-set either.
- Two consecutive gate failures on the same check. The cap bounds **edits,
  not investigation** — diagnose until you can state the mechanism, then
  STOP and log the full `~/.claude/rules/diagnosis.md` artifact.
- The same location changed 3 times consecutively without resolving the
  same check.
- Either headline number falls, or any class/object pin breaks.
- A state, description, sequence or activity fixture moves at all. This
  change is confined to the class/object ink path.
- The `usecase` or `lollipop` branch's behaviour changes. Generalising the
  mechanism must leave their OUTPUT identical; if it cannot, the
  generalisation is wrong and that is a finding, not a re-baseline.
- T1 cannot reproduce the 1.5 offset, or cannot reconcile 5-vs-6.

## Push forward without asking when

- The choice is purely stylistic and does not change behaviour.
- A task is simpler than estimated (log why).
- A fixture improves in a way the brief did not predict (record it).

## Index

- [decisions.md](decisions.md) — the confirmed architecture decisions
- [diagrams/component-map.md](diagrams/component-map.md) — what is touched
- [decision-journal.md](decision-journal.md) — appended during execution
- `.agent-notes/class-ink-shared-offset-groups.md` item **(b)** — the
  measured evidence. **Read it before Batch 1.**


---

## Outcome (2026-08-15) — COMPLETE

| Signal | Baseline | Final |
|---|---|---|
| `cacoma` / `cezaka` uniform offset | 1.5 | **0** |
| Class doc-size-exact | 773 / 1073 | **776** |
| Rigid-aligned matching shapes | 25695 | 25695 (flat — see below) |
| Class DOT-parity | 100% EQUAL | **100% EQUAL** |
| svg-class / svg-object pins | all hold | **all hold** |

Newly exact: `cezaka-60-jado323`, `sofagu-98-fezi999`, `gapisu-00-celo011`.
`cacoma-43-poxu615` is exact on height and on every shape, 1px wide.

### Three things the brief got wrong

**"Matched shapes must RISE" was the wrong bar.** They stayed flat at
25695, and that is the CORRECT signature for this defect rather than a
miss: the harness aligns each document under one rigid offset, which
already absorbed a UNIFORM 1.5 shift. Document size was the only axis that
could move, and it did. A bar copied from the previous mission did not fit
this defect class.

**The family is 9, not 5 — and note (b)'s "6" was right.** An earlier pass
in this mission reported 5 class fixtures and concluded the note
overcounted. That was a case-sensitive grep missing `sofagu-98-fezi999`'s
`Actor "fg" as fr`. The real set is 6 class + 3 OBJECT (object shares the
class ink path, which the brief's scope section did not anticipate).

**T2 and T3 could not be separated.** The brief split "build the walk" from
"dispatch to it" so a measurement change and a behaviour change would not
share a commit. They landed together because the walk could not be
verified at all in isolation: `EntityImageDescription.drawU` calls
`startGroup`, and `LimitFinder` could not accept it until `UGraphicNo`
gained upstream's no-op `startGroup`/`closeGroup` — a real faithfulness gap
this mission surfaced and fixed.

### What is left

- `ruturo-47-kapi300` moved 424 → 422 against jar's 430 — 2px further out
  on a fixture already 6 off and never exact. Its height is dominated by
  another, unidentified mechanism; the actor correction merely shifted
  within it.
- `cacoma-43-poxu615`'s remaining 1px of WIDTH. Every shape matches and the
  height is exact, so this is a max-X contributor, not the ink rule fixed
  here.
- Routing `usecase` through the same walk was deliberately not attempted
  (decision D2 required its output byte-identical, and its `addEllipseInk`
  rule is jar-verified). Whether the general walk reproduces it exactly is
  a measurable open question, not a known win.

# Batch 2 — governed fix loop (O5 … On)

Governed by [`plans/dot-oracle-sync/loop-protocol.md`](../../dot-oracle-sync/loop-protocol.md),
amended below. Iterations continue from G3's numbering: **O5 onward**.

**No fixed task count, by design.** The batch exits when the queue holds only
filed engine-blocked and maintainer-scoping items — that condition, not a
fixture target, is what "closed down" means under `decisions.md` D1.

## One iteration

1. **Pick** the top *actionable* queue item from `ledger.md` — highest
   shared-mechanism reach. One mechanism per iteration; if an item turns out
   to hold several, split it.
2. **Diagnose** per `~/.claude/rules/diagnosis.md`. Open the Java method body
   and the constructor that built its inputs. Write mechanism, origin
   `file:line` (ours *and* the Java's), causal chain, and ruled-out into the
   journal **before** changing code.
3. **Fix at origin**, faithfully. TDD: a focused unit test pinning the
   mechanism comes first. Every constant carries its upstream `file:line`.
4. **Re-measure.** Object census must not drop. After any **size** fix,
   re-measure SVG before picking the next item — a size fix moves coordinates
   downstream (`decisions.md` D3), and the queue may reorder.
5. **Ratchet.** Add every newly-zero-diff slug to
   `oracle/goldens/svg-object/` + `ratchet.json`; confirm the suite passes.
   If a size-backlog entry reaches 0, **delete** it per that file's own
   convention — never raise a pin.
6. **Gate + commit.** All four gates, unpiped, plus the frozen-count table in
   the mission README. One commit per iteration.
7. **Ledger.** Update the row for every fixture the iteration touched. If the
   mechanism turns out not to be fixable here, record the label and move on —
   a `gvts-blocked` verdict must be **filed** to `docs/graphviz-issues/` +
   `docs/graphviz-issues/TRACKER.md` before the iteration closes (D6); living only in the ledger
   is not filed.

## Amendments to the base protocol

- **Bonus class fixtures are expected and welcome.** Object rides the class
  engine; G3 gained three class census fixtures this way. Verify each with a
  full pinned-vs-current diff — a *swap* (one gained, one lost) reads as a
  gain in the scalar count and is a regression. This is why the frozen-count
  rule is two-directional.
- **The class ratchet is a hard boundary.** If flipping an object fixture
  appears to require changing behavior the class goldens pin, STOP (stop
  condition 6).
- **Re-measure after size fixes**, not just at iteration end.
- **Never fit a value.** Keeping whatever shrank the error is forbidden
  *especially* when it shrinks. No `file:line` citation ⇒ unfinished.

## Parallelism

Iterations are sequential — each changes the measurement the next depends on.
*Within* an iteration, read-only research may fan out (Java source reading vs
fixture triage), but a single writer owns the write-set.

## Write-set

`src/diagrams/class/**` · `src/core/{svg*,skinparam*,theme*,preprocessor}.ts` ·
`src/diagrams/class/renderer-classifier-box.ts` · `tests/**` ·
`oracle/goldens/{svg-object,object}/**` · `docs/graphviz-issues/**` ·
`docs/graphviz-issues/TRACKER.md` · this plan directory.

## Batch exit

- The actionable queue is empty.
- Every remaining non-conformant fixture is either filed engine-blocked with a
  measured delta, or flagged for maintainer scoping.
- Object census strictly greater than 23/80; DOT gate still exactly 78/80; all
  sibling frozen counts unmoved.
- Object size backlog contains only entries whose mechanism is named in the
  ledger.

# Architecture decisions

## Grounding fact

`graph-layout-build.ts` **already** models the wrapper nesting
(`innerMarginLevels`) and already implements upstream's border-point
suppression (`:480` — a border-point cluster always has
`innerMarginLevels === undefined`). Only `svek-dot-emit.ts` lacks it.

That is the **inverse** of the four builder/emitter splits found while
diagnosing this area, and it is why ADR-2 is emitter-only.

## ADR-1: Three strictly separate batches

**Context.** The 267-fixture survey proved wrappers (56), declaration order
(46) and border-point pins are independent; wrappers and order overlap on 9,
and pins are disjoint from wrappers by construction.
**Decision.** One mission, three batches, sequenced wrappers → order → pins,
with a census between each.
**Consequences.** Each batch is independently revertable and measurable; a
regression cannot be misattributed across defect classes; the mission can stop
after any batch with value banked.

## ADR-2: Wrapper deficit fixed in the emitter only

**Context.** The builder already emits the nesting and the suppression rule.
**Decision.** Emit `a`/`p0`/`i`/`p1` from `svek-dot-emit.ts`, mirroring the
builder's existing `innerMarginLevels` conditions rather than re-deriving them,
plus a fitness test asserting both paths agree on wrapper count.
**Consequences.** Expected **census-neutral** — DOT text moves toward jar,
geometry does not. If the census moves, this premise is false: reopen this ADR
rather than patch the census back.

## ADR-3: Declaration order fixed on builder AND emitter together

**Context.** Unlike wrappers, order reaches geometry — graphviz's cycle-breaking
DFS roots at the first node encountered (`reorderNodes`, G7 T16).
**Decision.** Change both paths in one batch; gate on the SVG census, not DOT text.
**Consequences.** The only batch that can move conformance, and the only one that
can regress it; needs a full before/after census on all five diagram types
because `graph-layout-build.ts` is shared.

## ADR-4: `za` anchor folded into the ordering batch

**Context.** Node counts match on 264/267 — we already emit the anchor, as
`sh####` at line 10, where jar emits `za<uid>` inside the base cluster block
(`ClusterDotString.java:~150`, gated on `thereALinkFromOrToGroup2`).
**Decision.** Fix identity and position inside batch 2, not standalone.
**Consequences.** Renaming alone is cosmetic; the value is that it stops
consuming an `sh` id and puts the declaration where jar puts it — both ordering
concerns.

## ADR-5: Split the gates by what each can see

**Context.** The structural comparator sees cluster counts but is blind to label
pixel sizes and to most of what moves geometry.
**Decision.** Batch 1 succeeds when DOT parity improves **and** the census is
unchanged. Batches 2-3 succeed when the census improves with no fixture rising.
**Consequences.** Prevents the two failure modes this area has already produced:
a green structural gate hiding a real divergence, and a moved gate read as progress.

## Rollback classification

**Reversible** — every batch is one revertable commit; no persisted data, no
migration, no deploy. Caveat: committed oracle state (`oracle/goldens/state/
size-backlog.json`, ratchet pins) must revert **with** the batch, which is what
ADR-1's one-commit-per-batch rule protects.

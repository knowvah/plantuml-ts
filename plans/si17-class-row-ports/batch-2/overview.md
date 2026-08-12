# Batch 2 — governed remediation loop

**Conditional.** Runs only if [T3](../batch-1/T3-shrink-the-backlog.md)
leaves residual slugs. If the backlog emptied, skip to
[batch-3](../batch-3/overview.md) and mark this batch `n/a`.

## Protocol — one mechanism per iteration

Modelled on `plans/object-close/batch-2`, which worked:

1. Pick the residual item with the largest measured reach.
2. **Diagnose to a `file:line` before writing code.** A predicted fixture
   list is a hypothesis until the gate confirms it; every count is a floor.
3. Land the fix, delete the pins it earned, in one commit.
4. Re-measure: class DOT + the four sibling DOT gates + the three censuses.
5. Journal the iteration — including reach that did NOT materialize.

Filled in by T3 from the 706/711 re-run. Four `portOk` residuals, two
mechanisms. Full diagnosis — mechanism, origin, causal chain, ruled-out — is
in [decision-journal.md](../decision-journal.md) under "T3"; the rows below
are the index, not the argument.

| ID | Mechanism | Reach | Depends On | Done |
|---|---|---|---|---|
| B1 | `:h` suffixed to every `plaintext` endpoint that named no member row. Upstream gates `:h` on `SvekNode#isShielded()` (a qualified-association test), so a `RECTANGLE_HTML_FOR_PORTS` node's non-port edges take the bare uid. Origin `src/core/svek-dot-emit.ts:146`; upstream `svek/Bibliotekon.java:126-132` + `svek/SvekNode.java:383-396`. | 3 class slugs: `bicabi-42-coto932`, `pijiju-95-xexi872`, `refeku-65-gapu585`. **Floor, not a ceiling** — `edgeRef` is shared, so re-measure object/component/usecase/state too. | T3 | [x] |
| B2 | A subsumed link's port is copied onto the split `entity1→point` association edge to reproduce the shield. Upstream builds that edge from a fresh `LinkArg` with **no** port. Origin `src/diagrams/class/class-assoc-couple.ts:274`; upstream `objectdiagram/AbstractClassOrObjectDiagram.java:264-268`. | 1 class slug: `pajoka-72-reju527`. | T3 | [x] |

Take B1 first: larger measured reach, and it sits in shared emitter code that
B2's fixture also routes through.

## The one residue already predicted — resolved, and the prediction was wrong

The brief predicted `bicabi-42-coto932` would turn on whether `Gtk::Window` is
an entity name or a port. It is neither the question nor the cause. T3 read
the oracle SVG: upstream renders the literal edge label
`:Frame     ' remove this to fix the error`, so it parsed entity `Gtk` plus a
**label** — and our side emits the identical 178×15 label table on the same
edge. The parse agrees end-to-end. `bicabi` is plain B1: one `sh0009->sh0007`
endpoint gains a `:h` that names a port present in neither side's node table.
ADR-3 is unaffected and still holds.

## Batch exit

- Every remaining non-conformant class fixture carries a named mechanism
  with a `file:line`, or a `DIVERGENCES.md` entry.
- No slug was added to any backlog.
- All frozen counts unmoved except class `portOk` shrinking.

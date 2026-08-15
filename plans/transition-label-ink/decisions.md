# Architecture decisions (pre-made, locked)

If execution surfaces a conflicting constraint, STOP and log it in
`decision-journal.md` — do not silently override.

## D1 — Investigation and fix are separated by a human checkpoint

**Context.** Mechanism (B) is unidentified, and the leading remaining
candidate points at `SvekNode`/`GroupMakerState` — outside
`src/diagrams/state/`. The fix site is genuinely unknown.

**Decision.** Batch 1 writes only `.agent-notes/` and this brief. It ends
with a hard STOP: report the mechanism, name the lines to change, propose a
write-set, and wait for a human to approve the expansion.

**Rejected:** declaring a broad write-set up front "to be safe". A write-set
that covers everything constrains nothing, and the stop condition that
protects this port from silent cross-module edits would stop meaning
anything.

**Consequences.** The mission cannot be executed straight through. That is
intentional.

## D2 — The Java excavation is the deliverable, not preamble

**Context.** Eight hypotheses are already dead (`evidence.md` §5). What
remains cannot be settled by measuring our own output — every port-side
number already matches jar.

**Decision.** T1 is a first-class task: read the Java from
`InnerStateAutonom.calculateDimension` through to the emitted `width=` on
the DOT node, and account for the 1.000.

**Consequences.** A well-evidenced "the premise is wrong, jar's ink is not
357.335, here is why" is a SUCCESS and closes the mission. So is "the +1 is
X at `file:line`". A shrug is not.

## D3 — Both mechanisms land in ONE commit

**Context.** (A) is −1.525 and (B) is +0.998. Landing (A) alone moves the
fixture from +0.527 to −0.998.

**Decision.** One commit. The harness must never see an intermediate state
worse than baseline, and a bisect must never land on one.

**Rejected:** "land the safe half first". There is no safe half.

## D4 — No constant without an upstream `file:line`. `21` is forbidden.

**Context.** `corrected fold + 15 + 21 = 392.337` against jar's 392.335.
It fits to 0.002 and is the obvious thing to reach for.

**Decision.** Forbidden. `InnerStateAutonom#calculateDimensionSlow` is
`MARGIN*2 + 2*MARGIN_LINE + marginForFields` = 20; `marginForFields` is 5 or
0, never 1. Any new constant carries its upstream `file:line` or does not
land.

**Consequences.** If the only way to make the fixture exact is an uncited
number, the correct outcome is to STOP and report that — per `CLAUDE.md`,
"Never fit a value — keeping whatever shrank the error is forbidden
*especially* when it shrinks."

## D5 — The document-level ink fold must not move

**Context.** `computeSvekResultGeometry` passes `labelInk: true`; the
document-level `computeStateDocumentDims`/`computeStateInkShift` pass
`false`. The latter are jar-verified and hold 59 pins.

**Decision.** Only the `labelInk: true` path may change. If the fix cannot
be confined to it, that is a stop and a ruling, not a judgement call.

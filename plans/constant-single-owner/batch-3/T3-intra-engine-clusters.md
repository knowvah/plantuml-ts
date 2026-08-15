# T3 — one declaration per engine-local constant

## Context

Read `plans/constant-single-owner/README.md` and `decisions.md` first,
especially **D3** (why intra-engine is a separate, easier problem) and
**D2**'s narrow exception for constants that are provably ours rather than
ported.

`.agent-notes/constant-inventory.md` (T1) is the work-list; take its
`intra-engine` rows.

## Task

For each cluster:

1. Confirm the copies serve ONE purpose. Within a single engine, "same
   name, same value, same role" is strong evidence — but `NODE_MARGIN_Y`
   appearing in both `activity/` and `activity/tiles/` could still be two
   concepts (a layout gap vs a tile's own inset) that happen to agree. Check
   the call sites, not just the declarations.
2. Pick the owner INSIDE the engine. `activity/activity-layout-constants.ts`
   already exists and is the natural home for the activity cluster — prefer
   an existing constants module over a new one.
3. Replace duplicates with imports; move any explaining comment to the owner.
4. Where the constant IS ported, add the Java `file:line` while you are
   there. Several of these carry no citation today; establishing one is a
   real improvement and makes the next reader's job possible.

`PX_PER_INCH = 72` is the one clean cross-engine case allowed in this batch:
a unit conversion, not a ported value, so there is no upstream declaration
count to mirror (D2's exception). Its owner is `src/core/`, and the citation
is the definition of a point, not a Java line — say so rather than inventing
a `file:line`.

**If a cluster turns out to be two concepts, split the NAMES instead** and
record it. That is Batch 4's shape applied early, and it is a better outcome
than a merge that hides a distinction.

## Read-set

- `.agent-notes/constant-inventory.md` — the work-list.
- `src/diagrams/activity/activity-layout-constants.ts` — the likely owner.
- The call sites of each cluster member — the evidence for "one purpose".
- `~/git/plantuml/src/main/java/net/` — for any citation you add. Grep all
  of `net/`.

## Write-set

- `src/diagrams/activity/**`
- the `PX_PER_INCH` declaration sites and their `src/core/` owner

`src/diagrams/class/**`, `description/**` and `state/**` are **Batch 2's** —
do not touch them here beyond a `PX_PER_INCH` import.

## Acceptance criteria

1. Given each consolidated cluster, when grepped, then exactly one
   declaration of that name remains.
2. Given the activity engine, when its owner module is read, then each
   constant it now owns has a one-line statement of purpose, and a Java
   `file:line` wherever one could be established.
3. Given `shape-match-report.ts`, when run, then **776 / 25695 exactly**.
   Activity fixtures are not in that harness's corpus, so also confirm the
   activity suites pass unchanged — a green `npm test` is the gate for this
   engine, and it must not need an expectation moved.
4. Given the inventory harness, then the redundant count is strictly lower.
5. Given any cluster that turned out to be two concepts, then the note
   records the split and the reasoning.

## Quality bar

All four gates exit 0. Coverage 90/90/90. Complexity caps apply to the owner
module — `activity-layout-constants.ts` may be near the 500-line file cap;
check before adding, and split rather than suppress if it is.

## Boundaries

- **Always:** verify one purpose at the CALL SITES, not just the values.
- **Ask first:** creating a new constants module when an existing one would
  do; touching another engine.
- **Never:** run a git command. Never merge two concepts to lower the count
  — the count is a proxy, not the goal.

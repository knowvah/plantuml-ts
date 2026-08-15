# T4 — rename the collisions so they stop reading as duplication

## Context

Read `plans/constant-single-owner/README.md`'s collision table and
`decisions.md` **D4**.

Six names hold different values in different modules. They are not
duplication — merging them would be a bug — but they READ as duplication to
anyone running the inventory, which is exactly how the next person gets
misled into merging them. Renaming is the fix, and D4 makes it required
rather than optional.

Re-derive the list from the inventory harness rather than the README's
table: Batches 2 and 3 may have resolved one side of a collision already.

```
ACTOR_HEIGHT          70 leaf-sizing-consts.ts   /  90 sequence-layout-participants.ts
MARGIN                 5 / 12 / 10 / 20 / 5 / 5 / 5   across six modules
MIN_WIDTH            120 / 200 / 30
NOTE_FOLD              8 (activity ×3)          /  10 (renderer-note ×2)
RADIUS                 6 / 8 / 10 / 6
STEREO_MARGIN          1 class-stereotype.ts     /   2 leaf-sizing-consts.ts
```

## Task

Rename each colliding declaration so the name states which thing it is.
Qualify by owner or by purpose — `STATE_MARGIN`, `CANVAS_MARGIN`,
`SPOT_RADIUS`, `PORT_RADIUS`, and so on. Prefer the name that would let a
reader tell the two apart WITHOUT opening the other file.

Two cases need care:

- **`MARGIN` and `RADIUS` are both cases at once.** Some of their copies are
  a genuine share (the three state `MARGIN` 5s are very likely one
  `IEntityImage.MARGIN`; `RADIUS = 6` appears in both `abel/EntityPosition`
  and `state/renderer-border-point`, plausibly one upstream constant), while
  others are unrelated. Consolidate the share side under Batch 2's rule if it
  is still outstanding, and rename what remains. Do not rename a copy that
  should have been shared — check the inventory's classification first.
- **`NOTE_FOLD`'s two groups (8 and 10)** are both internally consistent.
  That is two constants, each duplicated. Rename to separate them, and
  consolidate each group if it qualifies.

Where upstream names the field, prefer upstream's name (`IEntityImage
.MARGIN` → `ENTITY_IMAGE_MARGIN`). This port preserves upstream names;
sixteen years of commits reference them.

A rename touches every reference, so let the type checker find them — do not
grep-and-replace blind. One commit per renamed name.

## Read-set

- `scripts/constant-inventory.ts` output — the current collision list.
- `.agent-notes/constant-inventory.md` — classifications, so a share is not
  renamed by mistake.
- Each colliding declaration's call sites — the evidence for the new name.
- `~/git/plantuml/src/main/java/net/` — for upstream's own name where one
  exists.

## Write-set

- The colliding modules and every module referencing the renamed constants.

## Acceptance criteria

1. Given the inventory harness, when re-run, then zero names hold two
   different numeric values (excluding `known-exception`).
2. Given each rename, when its diff is read, then only identifiers changed —
   no value, no expression, no call site semantics.
3. Given `shape-match-report.ts`, then **776 / 25695 exactly**.
4. Given the full suite, then no test expectation needed changing. A renamed
   constant that forces a test change means it was not just a rename.
5. Given a name upstream also declares, then this port uses upstream's name.

## Quality bar

All four gates exit 0. Coverage 90/90/90.

## Boundaries

- **Always:** one commit per renamed name; let `tsc` find the references.
- **Ask first:** renaming an EXPORTED constant that something outside `src/`
  consumes (check `src/index.ts`'s public surface first — a public rename is
  a breaking change and needs a ruling, not a judgement call).
- **Never:** run a git command. Never merge two collision values to make the
  inventory shorter.

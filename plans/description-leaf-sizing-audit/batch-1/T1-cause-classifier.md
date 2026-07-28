# T1 — Repair the cause classifier

## Context

`scripts/measure-description-size-deltas.ts` buckets every non-conformant
fixture by a first-match regex table (`CAUSE_PATTERNS`) so the ledger can
route work. It misled EVERY bucket opened last session:

- the sprite pattern was `<\$[\w-]+>` — no `/` — so every stdlib
  `<$bundle/name>` fell through to a `\binterface\b` catch and was
  labelled interface-shield (turasu-73-zoni468 is a *sprite* fixture with
  no `interface` keyword at all). **ALREADY FIXED by S1L-f — verified at
  execution time; this bullet was stale when written. No action taken.**;
- `container-cluster` (any container keyword opening `{`) swallowed
  note-newline, endpoint-newline, empty-`[ ]`-body and element-font bugs —
  six fixes in a row, none of them cluster geometry;
- `element-font` matched only the `skinparam <el>FontSize` spelling, so
  `<style> <el> { FontSize N }` landed in container-cluster and the bucket
  read **2 fixtures when it was really 9**.

## Task

Repair the patterns to reflect what was learned, and label the output
honestly.

## Write-set

- `scripts/measure-description-size-deltas.ts`
- its unit test (co-located per `naming-conventions.md`; `detectCause` is
  already exported and pure, so test it directly)

## Read-set

- `scripts/measure-description-size-deltas.ts:72-101` (`CONTAINER_KW`,
  `CAUSE_PATTERNS`, `detectCause`)
- `oracle/goldens/description/size-backlog.json` `_doc` — the running
  record of which fixture actually belongs to which family

## Acceptance criteria

- Given `<style> component { FontSize 19 }`, when `detectCause` runs, then
  it returns `element-font`, not `container-cluster`
- Given `<$archimate/interface>`, then it returns `sprite` (the `/` case)
- Given a source with BOTH a container `{` block and a font declaration,
  then the more specific cause wins, and the ordering rationale is
  commented
- Given the script's header doc, when read, then it states that bucket
  labels are **hypotheses to verify, never findings**
- Given the full suite, then `npm test` still passes and the summary
  bucket counts change ONLY by reclassification (total non-conformant is
  unchanged — this task fixes labels, not sizes)

## Observability

N/A — no new observable operations. This task *is* instrumentation: after
it, `causes` in the summary line is the signal a future agent triages on.

## Rollback

Reversible — labels only, no geometry. No pin changes.

## Quality bar

All four gates. `widened` must remain 0 and conformant must remain 311/351
— a change in either means you altered sizing, which is out of scope here.

## Outcome — DONE 2026-07-28

`causes` labels only: container-cluster 12→11, other 10→7, element-font
1→5; total 40, conformant 311/351, widened 0, all gates green.

The element-font miss was TWO bugs, and the brief named only one: the
regex required `skinparam` adjacent to the Font-word (missing block form
and `<style>` selectors), AND `container-cluster` was tested first, so a
selector for a container keyword — byte-identical to a cluster opener —
shadowed the font signal unconditionally. Ordering, not just pattern.

Seven `other` fixtures deliberately left as `other`: no ledger root cause,
no regex-detectable signal. Inventing a pattern to empty the bucket is the
failure mode this task exists to end.

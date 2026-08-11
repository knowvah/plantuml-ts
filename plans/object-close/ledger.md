# Divergence ledger — object-close

**Authoritative attribution for object diagrams** (`decisions.md` D5),
superseding the residue table in `plans/g3-object-svg/README.md`. G3's
*mechanism writeups* (`plans/g3-object-svg/ledger.md`) remain valid precedent
— it is the attribution, not the ported mechanisms, that failed.

> **Skeleton.** Built by [T6](batch-1/T6-merge-ledger.md) from the three
> cluster audits, then updated by every batch-2 iteration. Do not treat the
> empty sections below as findings.

## Exit bar (D1)

Every one of the 80 fixtures is either SVG zero-diff against the pinned jar,
or has a row below naming a mechanism and a `file:line`. `gvts-blocked` is
admissible **only** with a measured delta, and only once filed to
`docs/graphviz-issues/` + `TRACKER.md` (D6).

## Census

| Checkpoint | Object census | Note |
|---|---|---|
| G3 close (2026-07-19) | 22/80 | attribution since falsified |
| object-close baseline (2026-08-11) | 23/80 | measured vs fresh jar oracle |
| current | _pending_ | |

## Attribution table (80 rows)

| slug | verdict | mechanism | java file:line | queue item |
|---|---|---|---|---|
| _built by T6_ | | | | |

**Arithmetic gate:** conformant + non-conformant must equal 80, and every slug
must appear exactly once. G3's own table failed this — it accounted for 79,
omitting `fafozi-27-reja300`, and the error survived a full iteration.

## Mechanisms

### _built by T6, one section per mechanism_

- Cause / Java origin `file:line` / ours `file:line` / causal chain / ruled out
- Fixtures: _slugs_ ← this count is the mechanism's **reach**

## Queue — actionable, ordered by reach (D3)

| # | mechanism | reach | cluster |
|---|---|---|---|
| _built by T6; size-backlog mechanisms lead_ | | | |

## Filed engine-blocked (D6)

| slug(s) | measured delta | issue file | TRACKER line |
|---|---|---|---|

## Needs maintainer scoping

| slug(s) | question | why it cannot be decided in-mission |
|---|---|---|

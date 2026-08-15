# T8 — record the outcome

## Context

This mission exists because `.agent-notes/class-ink-shared-offset-groups.md`
collapsed five apparently-separate shared-offset groups into one mechanism —
the package box being a member-bbox approximation — and named the 11
fixtures carrying it. Now that the mechanism is fixed, the note has to say
so, or the next reader will chase a solved problem.

## Task

Update three documents. Nothing in `src/`.

**1. `.agent-notes/class-ink-shared-offset-groups.md`**

Mark finding (a) — and the five groups folded into it — as superseded by
this mission. Record the measured before/after from T1's harness (baseline
691 / 20685) and the per-fixture outcome for the 11. Keep findings (b)
(USymbol ink) and (c) (state composite inner canvas) intact: they are
untouched by this mission and remain open.

Preserve the note's structure — mechanism first, then evidence, then impact,
then confidence. It is written that way so a reader starts from the cause.

**2. `docs/graphviz-issues/TRACKER.md`**

Tick issue 14's box ONLY if the pinned engine actually moved AND the
affected fixtures re-measured clean. That is the folder's own stated rule at
the top of the file. If Batch 4 was skipped because no release shipped,
leave it unchecked and say why in the inline comment.

**3. `docs/architecture/overview.md`**

It states the dependency is `@knowvah/dot-engine@^1.2.7`. The actual
`package.json` value was `^1.4.0` before this mission and moves again in T7.
Correct it to whatever is true at the time. This is a one-line accuracy fix
in a file this mission's work invalidated, not scope creep.

**4. `DIVERGENCES.md` — only if needed.**

If any of the 11 fixtures still carries a residual after Batch 3, and that
residual is a deliberate product choice rather than an open bug, it belongs
here with its mechanism. If every residual is closed, touch nothing.

## Write-set

- `.agent-notes/class-ink-shared-offset-groups.md`
- `docs/graphviz-issues/TRACKER.md`
- `docs/architecture/overview.md`
- `DIVERGENCES.md` (conditional)

## Read-set

- `.agent-notes/class-ink-shared-offset-groups.md` — all of it
- `plans/namespace-cluster-box/decision-journal.md` — the measured results
- `docs/graphviz-issues/TRACKER.md` — the rule at the top of the file

## Acceptance criteria

- Given the note, when read after this task, then finding (a) is marked
  superseded with a commit reference and measured before/after numbers, and
  findings (b) and (c) are unchanged.
- Given the tracker, when read, then issue 14's box state matches the
  folder's own rule — ticked only if the engine moved and fixtures
  re-measured clean.
- Given `docs/architecture/overview.md`, when read, then its dependency
  version matches `package.json`.
- Given all four gates, when they run, then green.

## Observability requirements

N/A — documentation only.

## Rollback

Reversible.

## Quality bar

All four gates green, even though this is docs-only. Never pipe `npm test`.

## Boundaries

- **Always:** diff the writer agent's output (`git diff --numstat`) before
  accepting it — `technical-writer` has no Edit tool and rewrites whole
  files, so it can silently drop content it was not asked about.
- **Never:** delete findings (b) or (c) from the note. They are open work.
- **Never:** tick a tracker box on the strength of the fix existing. The
  rule is the pinned dependency moved AND fixtures re-measured.
- **Never:** run any git command.

# T2 — bisect `state/xetase-70-zaza808`

## Context

`plantuml-ts` is a TypeScript port of PlantUML validated against the real
jar. `dotEqual` compares the svek DOT this port emits against the jar's own
cached `svek-1.dot` in `test-results/dot-cache/state/xetase-70-zaza808/`. That cache is
fixed data, independent of `src/` — which is what makes this bisect sound.

`xetase-70-zaza808` reports `dotEqual=false` today; its pin claims `true`. T0 has
established the window and proven the good end empirically.

## Task

Run `git bisect` over T0's window in this task's own worktree, driving T0's
`predicateCmd`. At each step restore the predicate stack from HEAD per
[D1](../decisions.md#d1); `git bisect skip` any commit that will not build
(D2), recording which and why. When the culprit is named, read its diff and
write the diagnosis.

## Write-set

- `.agent-notes/bisect-doteq-xetase-70-zaza808.md`

## Read-set

- `.agent-notes/bisect-doteq-T0.md` — window, predicate command, worktree path
- `../decisions.md#d1`, `#d2`
- `../README.md#stop-conditions` — conditions 4 and 6 bind this task
- `~/.claude/rules/diagnosis.md` — the four-part artifact is the deliverable

## Interface contracts

Emit into the artifact, for this fixture's Batch 2 fix task:

```json
{ "culprit": "<sha or span>", "originFile": "<path>", "originLine": <n>,
  "mechanism": "<one or two sentences>", "proposedWriteSet": ["<path>"] }
```

## Acceptance criteria

- Given T0's window, when `git bisect run` drives the pinned predicate, then
  it names one culprit commit, or a span bounded by skips.
- Given the culprit, when its diff is read, then the artifact states
  **mechanism**, **`file:line` origin**, **causal chain**, and **what was
  ruled out** — an empty ruled-out section means the cause was guessed.
- Given the culprit's parent, when the predicate runs, then `dotEqual=true`;
  and at the culprit itself, `false`. The flip is demonstrated, not inferred.
- Given a bisect that terminates inside a skip span, then the artifact records
  the span and why each skipped commit would not build.
- Given no mechanism can be stated, then **STOP** (stop condition 4) — report
  what was ruled out and what to instrument next. Do not propose a fix.

## Observability

N/A — no new observable operations.

## Rollback

Reversible. Diagnosis only; this task changes no source.

## Quality bar

No source changes, so the four gates do not apply. The bar is the artifact:
it must be sufficient for someone who did not run the bisect to see why the
culprit broke this fixture.

## Commit

One commit: `docs(T2): bisect xetase-70-zaza808 to its culprit`

# Mission: `doteq-regression-bisect`

**Branch:** `fix/doteq-regression-bisect` (off `main`) · **Planned:** 2026-09-03

## Objective

Three fixtures report `dotEqual=false` today while their committed parity
pins claim `true`. The pins are dated **2026-08-12**, so the regressions have
been invisible for three weeks. Bisect each to a culprit commit, state the
mechanism, fix it, and re-pin **exactly those three rows**.

| Fixture | Live | Pinned |
|---|---|---|
| `state/lurage-50-kobo763` | `false` | `true` |
| `state/xetase-70-zaza808` | `false` | `true` |
| `class/tunelu-64-xica833` | `false` | `true` |

Measured 2026-09-03 via `--render-one`, not read from a report. None is
`oracleBlind`.

## Provenance

Surfaced by mission `linetype-ortho-routing` T8 while re-pinning, and
**proven not to be caused by it**: `dotSplinesAttrs` returns `[]` when
`linetype` is undefined, and of the 172 out-of-scope state movers, zero have
`linetype` in their source. See `.agent-notes/lor-parity-pins-are-stale.md`.

The other **758 drifted rows and four uncredited improvements are OUT OF
SCOPE** — filed separately as an adoption-policy question. This mission
touches three rows.

## The predicate

```
npx jiti scripts/svg-parity-survey.ts --render-one test-results/dot-cache/<type>/<slug>
```

Emits `{svg, dotEqual, oracleBlind}` on stdout in ~8s. The oracle inputs in
that cache (`in.svg`, `svek-1.dot` — the jar's own output) are fixed data,
independent of `src/`, which is what makes the bisect sound.

**Window:** 791 commits on `main` since 2026-08-12 → ~10 steps per fixture.

## Quality gates — all four, before any commit lands

```
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm test
  pass: exit 0 AND `Test Files` does not fall below 688
  on_fail: fix_and_rerun
- command: git diff --name-only HEAD~1
  pass: matches the task's declared write-set only
  on_fail: stop
```

`rm -rf coverage/.tmp` before any `npm test` following a killed, timed-out or
backgrounded run — an orphan makes vitest silently under-collect while
exiting 0.

## Batches

| Batch | Tasks | Sequenced | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | T0 verify the window and the predicate | gates all | [x] — **stop condition 1** |
| [1](batch-1/overview.md) | T1 lurage · T2 xetase · T3 tunelu | parallel, 3 worktrees | [ ] |
| [2](batch-2/overview.md) | fix tasks — **created after Batch 1**, not now | — | [ ] |
| [3](batch-3/overview.md) | T7 re-pin exactly three rows | after Batch 2 | [ ] |

**Batch 2 is deliberately unplanned.** Per [D5](decisions.md#d5), each fix
task is created once its diagnosis artifact exists, taking that artifact's
`file:line` origin as its declared write-set. Inventing a write-set for an
unfound cause is the thing this mission is structured to avoid.

## Stop conditions

1. **T0 finds any of the three already `false` at the good end** — the
   premise is wrong and the window is wrong. Do not widen and continue.
2. **A fix would reach beyond the file its artifact's origin names** — a
   spreading fix means the mechanism was not found.
3. **A parity-pin diff would touch any row other than the three.**
4. **A bisect ends in a span that cannot be reduced to a stated mechanism** —
   report what was ruled out and what to instrument next; do not guess.
5. **Two consecutive gate failures on the same check**, or the same location
   changed three times without resolving it.
6. **Any of D1–D5 contradicted** by what the bisect turns up.

## Push-forward conditions

1. `git bisect skip` on a commit the pinned predicate cannot build — record
   which and why.
2. Two artifacts naming the same origin → collapse their fixes into one task;
   record that the shared cause was **found**, not assumed.
3. Two equivalent fixes at one origin → take the narrower.
4. `npm install` in a worktree because `package.json` moved in the window.
5. Minor adaptation to run the predicate at an old commit — **provided the
   comparison logic is untouched**. Changing what `dotEqual` means mid-bisect
   invalidates every step before it.

## The failure mode to watch

**Symptom gone is not done.** If a fix makes `dotEqual` go true without the
artifact stating why the culprit broke it, that is stop condition 4.

## Index

- [decisions.md](decisions.md) — D1–D5
- [batch-0/overview.md](batch-0/overview.md) · [batch-1](batch-1/overview.md)
  · [batch-2](batch-2/overview.md) · [batch-3](batch-3/overview.md)
- [diagrams/component-map.md](diagrams/component-map.md) ·
  [diagrams/data-flow.md](diagrams/data-flow.md)
- [decision-journal.md](decision-journal.md)

## Session summary — 2026-09-03 (STOPPED at T0, stop condition 1)

- **Tasks:** 1 of 5 planned executed (T0). T1–T3, Batch 2 and T7 not started —
  there is no `src/` flip in the window to bisect.
- **Finding:** all three fixtures are `dotEqual=false` at the good end under
  the D1-pinned predicate, and `true` at the *bad* end under the good end's
  own predicate. The verdict tracks the comparator, not `src/`. Mechanism:
  `labelSizeOk` was added to `tests/oracle/svek-dot.ts` at `d3ff29be`
  (2026-08-15, edge-label-box T10), three days after the pins were generated.
  All three are already-named residuals in
  `oracle/goldens/{state,class}/label-size-backlog.json`.
  Full artifact: `.agent-notes/bisect-doteq-T0.md`.
- **Decisions:** 6 journal rows; none flagged for review beyond the stop.
- **Gates:** not applicable — no source changed. Predicate verified runnable
  in all three worktrees (`npm ci` exit 0).
- **Follow-ups (human decision):** (1) the re-pin/adoption policy for the
  three stale `parity-*.json` files; (2) whether to fix the three label
  boxes under their existing edge-label-box mechanisms; (3) remove the
  `dqb-*` worktrees when done.

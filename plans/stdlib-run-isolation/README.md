# Mission: stdlib-run-isolation

**Close — or formally, permanently accept — the residual hole
`stdlib-build-race` (SI34) left open by design.** That mission fixed the
common case and said so plainly. This one addresses what it could not, and
is allowed to conclude that the right answer is "accept and stop".

**Branch:** `fix/stdlib-run-isolation` (from `main` at or after `2202f55c`)
· **Merge:** merge commit · **Agents run no git** — the orchestrator commits
each task by pathspec.

## The residual, as SI34 recorded it

Two concurrent `npm test` runs over **identical** source are safe: the
content-derived skip (`isGeneratedDirUpToDate` / `isSpriteSplitUpToDate`)
means the second run recognises a complete tree and deletes nothing, and the
cross-process lock means it never observes a *partial* one.

Two runs that **straddle a genuine source change** are not. Run B must
rebuild, so it `rmSync`s `packages/<pkg>/generated/` while run A's workers
are still importing out of it. Symptom: the original
`Cannot find module .../generated/<file>.js`, or — worse because it is
silent — an import that resolves mid-rewrite and yields a mismatched module
body.

The lock cannot fix this. Per D3 it is released when the build finishes,
before that same process's workers run; holding it for the whole test run
was considered and rejected as too coarse.

## What this mission must NOT assume

**The fix is not pre-decided.** The obvious candidate — a per-run isolated
output directory — was **explicitly declined by the user on 2026-08-21**
(`plans/stdlib-build-race/decisions.md` D3) on packaging blast-radius
grounds. This mission exists to revisit that with the blast radius
**measured instead of asserted**, and the user, not an agent, decides.

Two corrections to the record that motivated re-opening it:

- SI34's close-out cited **two** import sites. The real count is at least
  **six** test files reading the canonical tree — see T0. The declined
  option was judged against an under-count.
- `generated/` is not merely a build output. It is `main`, `types`, and
  **every `exports` subpath** for all four `@knowvah/plantuml-stdlib*`
  packages. Relocating it is not a path change; it changes what the
  packages publish. That makes the original concern *more* serious than
  stated, not less.

Both facts must be verified independently in T0. Do not inherit them.

## Batches

| Batch | What | Tasks | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | Reproduce the residual · census the readers — **PIVOT GATE** | T0, T1 | [ ] |
| [1](batch-1/overview.md) | Options ADR with measured cost — **STOPS FOR THE USER** | T2 | [ ] |
| [2](batch-2/overview.md) | Implement the approved option | T3, T4 | [ ] |
| [3](batch-3/overview.md) | Verify and close out | T5 | [ ] |

Batch 0 is parallel (disjoint write-sets). Everything after is serial:
the ADR gates the implementation, and the user gates the ADR.

## Quality gates (after every batch)

```
- command: npm test
  pass: exit 0 (coverage >= 90/90/90)
  on_fail: fix_and_rerun
- command: npm run typecheck
  pass: exit 0 (both tsconfigs)
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0 (3 pre-existing [unplugin:dts] notes are NOT a failure)
  on_fail: fix_and_rerun
- command: git diff --name-only -- src/
  pass: EMPTY. Any output is stop 2.
  on_fail: stop
- command: npx jiti scripts/render-manifest.ts --out /tmp/sri-manifest.json && python3 plans/state-declared-size-fix/scripts/manifest-diff.py test-results/render-manifest-baseline.json /tmp/sri-manifest.json plans/stdlib-run-isolation/expected-moves.txt
  pass: "0 unexpected"
  on_fail: stop
```

**Wall-clock ceiling: 60.3 s, and the headroom is now thin.** SI34 measured
55.75–57.80 s across four batches on settled machines; the post-merge run on
`main` was 56.85 s. That leaves roughly 3 s. Any design that adds per-run
build work spends against this, so **measure the suite before and after** and
report the load with every number (`uptime` plus
`ps -Aceo pcpu,comm | grep -E 'suggestd|corespotlightd|mds_stores'` at ~0).
SI34 burned two readings on self-induced Spotlight reindexing.

## Stop conditions

1. **T0 cannot reproduce the changed-inputs residual.** Then it is a
   theoretical hole, not an observed defect. STOP and report; the correct
   outcome is to document it permanently, not to build isolation for a
   symptom nobody can produce. Do NOT weaken the repro until it fires.
2. **Any `src/` file is modified.** This is test/build infrastructure. Zero
   tolerance.
3. **After T2's ADR, STOP unconditionally and wait for the user.** The
   option this mission most obviously points at was declined by the user
   once already. No agent may re-adopt it on its own authority, however
   convincing the measurement. This stop is not a failure state — it is the
   mission's purpose.
4. Two consecutive gate failures on the same check.
5. A change to what any `@knowvah/plantuml-stdlib*` package **publishes**
   (`main`, `types`, `exports`, `files`) that is not explicitly authorised
   by the approved ADR. Silently altering the published surface of four
   packages is strictly worse than the race.
6. `npm test` exceeds 60.3 s on a settled machine.
7. A finding contradicts a locked decision (D1–D5).
8. Same location changed 3x consecutively without the check clearing.

## Push forward (journal the call)

Harness shape and filenames · probes under `scripts_scratch/T<N>/`, deleted
before commit · the seam's naming · which existing env-gating idiom to
mirror · a repro needing more than 5 attempts (record the rate and continue)
· minor/patch dep bumps.

## Index

- [decisions.md](decisions.md) — D1…D5 (locked) ·
  [decision-journal.md](decision-journal.md) ·
  [expected-moves.txt](expected-moves.txt)
- [diagrams/residual-window.md](diagrams/residual-window.md)
- **Source record:** `plans/stdlib-build-race/README.md#close-out-2026-08-21`
  · that mission's `decisions.md` D3 and its full `decision-journal.md` ·
  `.agent-notes/sre-T0.md` (the proven mechanism) and `sre-T2.md` (the
  skip's own residuals)

# T0b — one-JVM-per-fixture oracle re-capture tool

**Agent:** typescript-pro (sonnet, high). Prompt = `common-rules.md` + this file.
**Worktree:** `measurements/mkwt.sh T0b`.

## Why
D5/D6: batch 1 re-captures the entire oracle (~7,400 renders) in one step.
Batching several diagrams into one JVM is proven unsafe: `{{ }}` diagrams leak
JVM static state (`usecase/zidebi-71-nocu387`: 875 px batched vs 895 solo) and
`@startdot` output differs (5 `oracle/goldens/svg-dot/*` goldens report CHANGED
batched yet equal a solo render) — `.agent-notes/oracle-svg-seam.md`.
`scripts/rebaseline-svg-goldens.ts:242-300` (`BATCH_SIZE = 120`, `captureBatch`)
claims byte-identical output either way; that claim is false.

## Write-set
`scripts/recapture-oracles.ts` (new), `scripts/lib/recapture-*.ts` (new helpers,
500-line hook), `scripts/rebaseline-svg-goldens.ts`,
`tests/unit/scripts/recapture-oracles.test.ts`,
`tests/unit/scripts/rebaseline-svg-goldens*.test.ts`, `.agent-notes/isw-T0b.md`.

## Do
1. Read `scripts/oracle-render.sh` (flags, Batik, timeout), `scripts/capture-oracle-cache.ts`
   (its `@startuml <name>` → single-svg rename rule and exit-code rule),
   `oracle/capture.sh` (DOT dump), `scripts/rebaseline-svg-goldens.ts`.
2. Manifest: one row per target `{kind, dir, puml, outputs}` for
   (a) `test-results/dot-cache/<engine>/<slug>/` (`in.svg` + `svek-*.dot`),
   (b) `oracle/goldens/svg-*/**/` (`golden.svg`), (c) `oracle/goldens/{class,object,state,description}/<slug>/`
   (`svek-N.dot` from `input.puml`), (d) `tests/fixtures/**/<name>.svg` with a
   sibling `<name>.puml` that the CURRENT jar reproduces byte-equal (others are
   listed as `not-a-jar-render`, never written).
3. Render: one `oracle-render.sh`-equivalent JVM per target (REPO-correct Batik
   path), N workers (`--workers`, default 6), per-target timeout; write only via
   `--write`; `--verify` renders into scratch and reports SAME/CHANGED/FAILED per
   target; `--only <glob>`.
4. Fix `rebaseline-svg-goldens.ts` to one JVM per fixture (or delegate to the
   new tool) and correct its doc comment with the measured counter-examples.

## Acceptance
- Given the current jar, when `--verify` runs over the full manifest, then every
  target is SAME except a named list (the 4 crash fixtures; anything stale), each
  journaled with a reason.
- Given `oracle/goldens/svg-dot/cluster-basic` and `usecase/zidebi-71-nocu387`,
  when rendered by the tool and solo, then the bytes are equal.
- Given `--write` is absent, when the tool runs, then no tracked file changes.

**Interface output (T1b):** CLI `npx jiti scripts/recapture-oracles.ts
[--verify|--write] [--workers N] [--only glob] [--jar path]` and a JSON report
`{ target, kind, status, outputs[] }[]`.
**Observability:** report counts by status. **Rollback:** reversible.

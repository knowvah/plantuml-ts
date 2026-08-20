# T0 — Capture the sequence oracle corpus

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/sequence-oracle-harness`. A faithful TypeScript port of PlantUML; the
Java at `~/git/plantuml` is the spec. **You write no `src/` and no tests.**
You run the jar and commit what it produces.

## Task
1. Populate the sequence corpus: `python3 scripts/populate-corpus.py` uses the
   classifier at `populate-corpus.py:20`. ~473 fixtures under `~/git/pdiff`
   declare `participant`/`actor`. Establish how many the classifier actually
   selects — report the number, do not assume 473.
2. Render each through **`scripts/oracle-render.sh <out-dir> <file.puml>`**.
   Never a hand-typed `java -jar`: the wrapper sets
   `-DPLANTUML_DETERMINISTIC_TEXT=true`, and without it every text-derived
   number measures the flag rather than the port.
3. Write each success to `test-results/dot-cache/sequence/<slug>/` as
   `in.puml`, `in.svg`, `.done` — mirroring `dot-cache/component/<slug>/`
   exactly. **Confirm no `svek-*.dot` is produced for any sequence slug**;
   sequence emits no DOT, and a stray `.dot` would mean something is wrong.
4. A fixture the jar cannot render is a **push-forward, not a halt**: record
   the slug and the reason in your note and write NO partial cache entry.
5. **Re-pin `test-results/render-manifest-baseline.json`** in this same task.
   `manifest-diff.py:38` computes moves over `set(base) | set(now)`, so every
   added key reads as `unexpected` against the old baseline. Record the
   fixture count before and after.

Read-only git only; no commits.

## Write-set
- `test-results/dot-cache/sequence/**`
- `test-results/render-manifest-baseline.json`
- `.agent-notes/g1h-T0.md`

Nothing else. Nothing under `src/` — stop 3.

## Read-set
- `plans/sequence-oracle-harness/decisions.md` D3, D6
- `scripts/populate-corpus.py` (the classifier, `:20`)
- `scripts/oracle-render.sh` — read its doc comment before running it
- `test-results/dot-cache/component/<any-slug>/` — the exact layout to mirror
- `plans/state-declared-size-fix/scripts/manifest-diff.py` — argv contract

## Interface contracts
Report `{ classified: number, captured: number, failed: Array<{slug, reason}>,
manifestBefore: number, manifestAfter: number }`. T2 consumes `captured` and
`failed`; T5 consumes the slug list.

## Acceptance
- Given the classified corpus, when the jar renders it, then every success has
  `<slug>/{in.puml,in.svg,.done}` and **no** sequence slug has a `svek-*.dot`.
- Given a fixture the jar cannot render, then it appears in the note with a
  reason and leaves no partial directory behind.
- Given `render-manifest.ts` after capture, then the count grows by exactly
  `captured`, and the re-pinned baseline is on disk.
- Given `git check-ignore` on any new cache file, then it reports nothing
  (the files are tracked — `.gitignore:25` re-includes `dot-cache/`).
- Given the four project gates, then all are green.

## Observability
N/A — no new observable operations.

## Rollback
Reversible. The cache is regenerable by re-running the jar; the manifest
baseline is regenerable by `render-manifest.ts --out`.

## Quality bar
Four gates green. `npm test` under 60.3 s (the ceiling is renegotiated in T2,
not here). Report the wall-clock.

## Report (<=400 tokens)
The interface contract above, plus: the classifier's selection count vs the
473 estimate, any fixture family that failed systematically, and confirmation
that no `.dot` was emitted.

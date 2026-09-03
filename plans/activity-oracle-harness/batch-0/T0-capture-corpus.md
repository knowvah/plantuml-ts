# T0 — Capture the activity oracle corpus

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/activity-oracle-harness`. A faithful TypeScript port of PlantUML; the
Java at `~/git/plantuml` is the spec. **You write no `src/` and no tests.**
You run the jar and commit what it produces.

## Task
1. Populate the corpus if absent: `python3 scripts/populate-corpus.py`.
   It writes `tests/corpus/activity/` (gitignored, regenerable).
2. **Type every fixture through OUR dispatcher**, not the filename bucket.
   Use the `scripts/oracle-corpus.ts:58` idiom verbatim:
   `buildBlockUmls(puml)` → first block → `registry.resolve(first.source).plugin.type`.
   A pre-mission measurement found 452 files of which only **373 type as
   `activity`** (73 class, 2 sequence, 4 unparseable). Report the number you
   actually get — do not assume 373 ([D3]).
3. Capture **only** `plugin.type === 'activity'`. Render each through
   **`scripts/oracle-render.sh <out-dir> <file.puml>`** — never a hand-typed
   `java -jar`. The wrapper sets `-DPLANTUML_DETERMINISTIC_TEXT=true`; without
   it every text-derived number measures the flag, not the port.
4. Write each success to `test-results/dot-cache/activity/<slug>/` as
   `in.puml`, `in.svg`, `.done` — mirroring `dot-cache/sequence/<slug>/`
   exactly.
5. **Confirm no `svek-*.dot` is produced for any activity slug.** A stray
   `.dot` is a stop condition ([D9]) — activity never routes through dot.
6. A fixture the jar cannot render is a **push-forward, not a halt**: record
   slug and reason in your note, write NO partial cache entry.
7. Note that one fixture in the pre-mission sample emitted an extra
   `test.svg` (a second `@startuml` block). Handle multi-block sources
   without crashing; record how you handled them.
8. **Re-pin `test-results/render-manifest-baseline.json`** in this task.
   `manifest-diff.py:38` computes moves over `set(base) | set(now)`, so every
   added key reads as `unexpected` against the old baseline. Record the count
   before and after.

Read-only git; no commits beyond your one task commit.

## Write-set
- `test-results/dot-cache/activity/**`
- `test-results/render-manifest-baseline.json`
- `.agent-notes/aoh-T0.md`

Nothing else. Nothing under `src/` — stop condition 1.

## Read-set
- `plans/activity-oracle-harness/decisions.md` — D3, D4, D8, D9
- `scripts/oracle-render.sh` — read its doc comment before running it
- `scripts/oracle-corpus.ts:55-62` — the dispatcher-typing idiom
- `scripts/populate-corpus.py:20-35` — the (unreliable) classifier
- `test-results/dot-cache/sequence/<any-slug>/` — the exact layout to mirror
- `plans/sequence-oracle-harness/batch-0/T0-capture-corpus.md` — the precedent
- `plans/state-declared-size-fix/scripts/manifest-diff.py` — argv contract

## Architecture decisions
[D3] cache is the population · [D4] commit it, never `skipIf` ·
[D8] parser gaps are captured, not fixed · [D9] no DOT, ever.

## Interface contracts
Report exactly:
```json
{ "typed": 0, "captured": 0,
  "jarFailed": [{"slug": "", "reason": ""}],
  "ourParserGaps": [{"slug": ""}],
  "manifestBefore": 0, "manifestAfter": 0 }
```
T2 consumes `captured` and `ourParserGaps`; T3 consumes one slug; T6
consumes `captured`.

## Acceptance criteria
- Given the corpus typed by our dispatcher, when captured, then **only**
  `plugin.type === 'activity'` fixtures are written, and the class/sequence/
  unparseable counts are reported.
- Given each capture, then `<slug>/{in.puml,in.svg,.done}` exists and **no**
  activity slug has a `svek-*.dot`.
- Given a fixture the jar cannot render, then it appears in the note with a
  reason and leaves no partial directory behind.
- Given `git check-ignore` on any new cache file, then it reports nothing
  (tracked — `.gitignore:25` re-includes `dot-cache/`).
- Given `npm run manifest` after capture, then the count grows by exactly
  `captured`, and the re-pinned baseline is on disk.

## Observability
N/A — no new observable operations. The capture's own report IS the artifact.

## Rollback
**Reversible.** The cache is purely additive and regenerable by re-running
the jar; the manifest baseline is regenerable by `render-manifest.ts --out`.

## Quality bar
All four gates green (`npm test`, `npm run typecheck`, `npm run lint`,
`npm run build`). Report the suite wall-clock — the ceiling is advisory
context in this repo, not a gate.

## Commit
One commit: `test(aoh-T0): capture the activity oracle corpus`. Body explains
why the typed population differs from the filename bucket.

## Report (<=400 tokens)
The interface contract above, plus: the typed-vs-bucket delta, any fixture
family that failed systematically, and explicit confirmation that no `.dot`
was emitted.

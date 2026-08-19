# T0 — Authored fixtures + oracles + baselines

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `feat/creole-exposant-port`.
The corpus has ONE cached `<sup>`/`<sub>` fixture reachable by a creole engine:
`test-results/dot-cache/state/juvagu-33-dupa212/` (also
`oracle/goldens/state/juvagu-33-dupa212/`). CLAUDE.md: when a feature has no
fixture, author `.puml` fixtures and generate oracles. Read `decisions.md`
D5/D7, CLAUDE.md ("Render oracles with `scripts/oracle-render.sh`, never a
hand-typed `java -jar`"), `scripts/oracle-render.sh` (whole),
`scripts/capture-corpus.ts` and `oracle/capture-corpus.sh` (how a dot-cache
entry is laid out: `in.puml`, `in.svg`, `svek-N.dot`), the header of
`tests/oracle/state-dot-parity.test.ts:1-70` and its class/description
siblings (golden layout `input.puml` + `svek-N.dot`; how the backlog files
pin a non-zero size delta), and SI29's `plans/state-declared-size-fix/README.md`
"The oracle and the exit" + `expected-moves.txt` format.

## Task
1. Author three fixtures (slugs in corpus shape, e.g. `exposant-01-class`,
   `exposant-02-usecase`, `exposant-03-state` — push-forward, journal):
   - class: a class with a member `x<sup>2</sup>` and `H<sub>2</sub>O`, plus a
     `note` containing `<sub>` and `<sup>` inside `**bold**`;
   - usecase/description: an actor + usecase and a `note` with `<sup>` and a
     `<size:20>` line;
   - state: a leaf state whose description has `<sub>` and a nested
     `<size:20><sup>x</sup></size>` line, and a `note` with `<sup>`.
   Keep each ≤ 12 lines; no skinparam beyond what the symptom needs.
2. Render each with `scripts/oracle-render.sh <out> <puml>`; place `in.puml`,
   `in.svg`, `svek-N.dot` under `test-results/dot-cache/<type>/<slug>/` and
   `input.puml` + `svek-N.dot` under `oracle/goldens/<type>/<slug>/`.
3. Run the DOT-parity suites (`tests/oracle/{state,class,object}-dot-parity.test.ts`; description parity lives in `tests/oracle/description-parity.ratchet.test.ts` — read its header to see how a description fixture is registered, and register the usecase fixture the same way); where a new golden fails only on node size
   (literal `<sup>` text today), pin its delta in the type's backlog file
   tighten-only with a dated note naming this mission; if it fails
   structurally, STOP and report (the fixture must be re-authored, not the
   gate loosened).
4. Pin baselines: `npx jiti scripts/measure-composite-declared-size.ts
   --mismatched-only > test-results/state-declared-size-baseline.jsonl` (two
   runs, `cmp` silent) and `npx jiti scripts/render-manifest.ts --out
   test-results/render-manifest-baseline.json`. Report the summary line and
   sha256s. Write `plans/creole-exposant-port/expected-moves.txt` with a
   header comment and, per batch, the slugs allowed to move (Batch 1+: the
   three authored slugs + juvagu-33-dupa212 + any other corpus fixture whose
   `in.puml` contains `<sup>`/`<sub>` under a klimt engine — grep and list;
   expected: none besides juvagu).
5. Record BEFORE numbers: juvagu-33 rows; each authored fixture's declared
   sizes (ours vs jar) from the harness (state) / from `svek-dot.ts`
   comparison (class, description).

## Write-set
As in the batch overview. Nothing under `src/`.

## Read-set
Files named in Context; `tests/oracle/svek-dot.ts:1-120`;
`oracle/goldens/state/juvagu-33-dupa212/input.puml`.

## Acceptance
- Given the three `.puml`, when rendered via `oracle-render.sh`, then `in.svg` and ≥1 `svek-N.dot` exist per slug and are committed under both trees.
- Given the current tree, when the DOT-parity suites run, then all pass (new goldens via tighten-only backlog pins, dated).
- Given two consecutive harness/manifest runs, then byte-identical; both pinned; summary + sha256s reported.
- Given `expected-moves.txt`, then it lists exactly the allowed movers with the grep evidence.

## Observability / Rollback
Fixtures + baselines ARE the SLIs. Reversible.

## Report (≤500 tokens)
Slugs; before-numbers per fixture (ours vs jar per node); backlog pins added;
baseline summary + sha256s; grep result for other `<sup>`/`<sub>` fixtures.

# T2 — widen the oracle cache to the full json-family corpus

## Context

plantuml-ts measures conformance against goldens captured from a **pinned
oracle jar** (`oracle/dist/plantuml-oracle.jar`), never against a live
plantuml.com or an unpinned build. `test-results/dot-cache/` holds those
captures — and, despite the directory name, it is **committed oracle data, not
a local cache.** Do not describe it as a cache in commits or docs; a previous
mission made that mistake and it misled the next reader.

Today `dot-cache/json/` holds **5** fixtures, captured 2026-07-04. The corpus is
**92**. Batch 2 takes the mission's baseline from this data, so a baseline over
5/92 would misdirect everything downstream.

## Task

Capture jar goldens for the full json-family corpus into
`test-results/dot-cache/{json,yaml,hcl}/`, one directory per fixture holding
`in.puml` and `in.svg`.

Fixture sources (both corpora, per CLAUDE.md's "Reference Corpora"):

```sh
grep -rl "@startjson" ~/git/pdiff/dbhum ~/git/pdiff/input   # 50
grep -rl "@startyaml" ~/git/pdiff/dbhum ~/git/pdiff/input   # 39
grep -rl "@starthcl"  ~/git/pdiff/dbhum ~/git/pdiff/input   # 3
```

## Read-set

- `scripts/oracle-corpus.ts#runOracle` — the capture entry point. It already
  carries `-DPLANTUML_DETERMINISTIC_TEXT=true`; confirm that before capturing,
  because goldens captured without it carry AWT metrics and are silently
  wrong. That exact omission caused a 489-fixture false backlog once already.
- `scripts/capture-corpus.ts`, `oracle/capture-corpus.sh` — existing batch
  capture wiring. Reuse it rather than hand-rolling a loop.
- `test-results/dot-cache/json/babico-87-soxo095/` — the expected per-fixture
  shape.

## Write-set

- `test-results/dot-cache/json/**`
- `test-results/dot-cache/yaml/**`
- `test-results/dot-cache/hcl/**`

Nothing else. No `src/`, no `tests/`.

## Architecture decisions (locked — see `decisions.md`)

- **ADR-3:** these captures will contain **no `.dot` file**, for any fixture in
  this family. That is correct, not a broken capture — the jar lays json out
  in-process via `SmetanaForJson` and never writes `svek-N.dot`. Do not add a
  retry, a fallback, or a warning for the missing DOT; do not "fix" the capture
  script to produce one.

## Interface contracts

Per fixture, on disk:

```
test-results/dot-cache/<type>/<slug>/
  in.puml    # the fixture source, verbatim
  in.svg     # jar output, captured under -DPLANTUML_DETERMINISTIC_TEXT=true
  .done      # sentinel, as the existing entries carry
```

## Acceptance criteria

1. **Given** the pdiff corpus, **when** capture completes, **then**
   `test-results/dot-cache/json/` holds 50 fixture directories, `yaml/` holds
   39, and `hcl/` holds 3 — each with `in.puml` and a non-empty `in.svg`.
2. **Given** any newly captured `in.svg`, **when** compared against a
   re-capture of the same fixture, **then** the two are byte-identical
   (determinism actually held; if not, the flag did not reach the JVM).
3. **Given** the five pre-existing json captures, **when** re-captured,
   **then** they are byte-identical to what is committed — or, if they are
   not, **stop** and report it rather than overwriting. A drift here means the
   pinned jar or its flags changed, which invalidates far more than this task.
4. **Given** the capture run, **when** it finishes, **then** no `.dot` file
   exists under any of the three directories.

## Observability requirements

N/A — offline oracle capture.

## Rollback

**Reversible.** Committed data files; revert the commit. Note the volume:
92 fixture directories, so review the diff stat rather than the diff.

## Quality bar

- Four gates green afterwards (the new data should not move any existing test;
  if it does, that is a finding — report it).
- Report the actual captured counts, not the expected ones. If a fixture fails
  to render under the jar, list it by slug with the jar's own error rather than
  dropping it silently.

## Boundaries

- **Always:** use the pinned `oracle/dist/plantuml-oracle.jar`.
- **Ask first:** if any fixture requires network access or an `!include` the
  store cannot serve.
- **Never:** run `git commit` or any state-mutating git command — the
  orchestrator commits after the batch.
- **Never:** re-capture goldens for other diagram types. This task's write-set
  is three directories; a wider re-capture would move ratchets across the repo.

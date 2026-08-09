# T5 — go/no-go: does the mirrored graph actually move json geometry?

## Context

ADR-1 says this port lays json out on a structurally different graph than
upstream, and that re-mirroring upstream's is the route to conformance:

| | upstream (`SmetanaForJson`) | this port (`json/layout.ts`) |
|---|---|---|
| rankdir | none set → graphviz default **TB** | `rankDir: 'LR'` (line 303) |
| node dims | **swapped**: `height`←width, `width`←height (`:236-244`) | passed straight through |
| ports | real `shape=record` `<P0>|<P1>|…`, edge `tailport="P<n>"` | fractional `tailportY` attribute (`:283-296`) |
| coordinates | transposed back via `Mirror#invAndXYSwitch` | none |

ADR-1 is a **reading of the Java**. This repo has a documented history of
load-bearing readings turning out wrong — three subagent claims had to be
corrected against the code in one prior mission alone, and one mission lost
hours to a "full-tree grep" that was silently scoped to the wrong subtree.

This task buys certainty cheaply before three tasks of rewrite depend on it.

## Task

Determine experimentally whether building upstream's graph moves json geometry
toward the jar. Do it in a **scratch harness or behind a temporary flag** — not
by rewriting `layout.ts`.

Minimum experiment:

1. Pick 3–5 fixtures spanning the shapes T3's baseline shows (flat object,
   nested object, array, deep nesting).
2. For each, build the DOT graph two ways — current LR, and upstream's
   TB+swapped-dims+record-ports — and run both through `layoutGraph`.
3. Compare the resulting node positions and edge splines against the jar's
   golden SVG. Report the delta both ways.

## Read-set

- `plans/a5-json-family-conformance/baseline.md` — T3's mechanism table,
  especially every row marked `ADR-1-sensitive? = yes`.
- `src/diagrams/json/layout.ts:200-360` — current graph construction,
  `rankDir`, and the `tailportY` computation.
- `src/core/graph-layout.ts` — the seam. **Read-only.** Any edit to it is
  blocked by the complexity hook (three pre-existing violations) and is a stop
  condition.
- `~/.../jsondiagram/SmetanaForJson.java:215-299` — the whole graph builder.
- `~/.../jsondiagram/Mirror.java`
- `docs/graphviz-issues/TRACKER.md` — check whether a known dot-engine issue
  already explains a delta you observe, before filing anything new.

## Write-set

- `plans/a5-json-family-conformance/adr1-gonogo.md` (create)

Scratch code is fine anywhere under a temp directory; **delete it before the
task ends.** No production file is modified by this task.

## Architecture decisions (locked — see `decisions.md`)

- **ADR-1** is what you are testing. You may return "falsified."
- **ADR-2:** Smetana is the target for json. A delta traceable to a genuine
  Smetana-vs-dot-engine algorithm difference is a finding to record — and if it
  is a dot-engine defect, it is filed per `docs/graphviz-issues/` (one `.md`
  plus a TRACKER line) before this task closes.

## Interface contracts

`adr1-gonogo.md` must state, unambiguously, one of:

- **GO** — mirrored graph is measurably closer. Include the per-fixture
  before/after deltas that justify it.
- **NO-GO** — it is not closer. Include the same measurements, plus what you
  ruled out. This triggers the README stop condition.
- **PARTIAL** — closer on some shapes and not others. Name which, and why.

Plus a table:

```
| fixture | shape | delta LR | delta mirrored | verdict |
```

## Acceptance criteria

1. **Given** 3+ fixtures of differing shape, **when** both graphs are laid out,
   **then** `adr1-gonogo.md` reports a numeric delta for each, both ways.
2. **Given** the measurements, **when** the doc concludes, **then** it states
   GO, NO-GO, or PARTIAL explicitly — never "looks promising."
3. **Given** a NO-GO or PARTIAL, **when** reported, **then** it names what was
   ruled out and what would be instrumented next.
4. **Given** the task ends, **when** the tree is inspected, **then** no scratch
   file and no production edit remain (`git status --short` is clean but for
   the new doc).
5. **Given** any dot-engine defect observed, **when** the task ends, **then** it
   is filed in `docs/graphviz-issues/` with a minimal repro — a finding that
   exists only in this doc is not filed.

## Observability requirements

N/A — offline experiment.

## Rollback

**Reversible.** One document; no production code touched.

## Quality bar

- Four gates green (unchanged — you edited no production code).
- Measure; do not reason. The deliverable is numbers, not an argument from the
  Java. The Java is already read — that is what produced ADR-1.

## Boundaries

- **Always:** report a falsification as cleanly as a confirmation. NO-GO is a
  successful outcome for this task.
- **Never:** modify `src/diagrams/json/layout.ts` or `src/core/graph-layout.ts`.
- **Never:** run `git commit` or any state-mutating git command.
- **Never:** proceed into T6 yourself, whatever the verdict.

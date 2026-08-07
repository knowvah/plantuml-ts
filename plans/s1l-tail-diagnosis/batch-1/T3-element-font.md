# T3 — Diagnose the `element-font` bucket (5 fixtures)

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (Java) rendering
diagram source to SVG synchronously. `~/git/plantuml` is the canonical spec;
the pinned jar under `oracle/` is the numeric oracle. Description
size-conformance is measured by `scripts/measure-description-size-deltas.ts`
against a 0.01in bar and sits at **321/351 (91.5%)**.

**The bucket label is a hypothesis** (ADR-3). Sub-mission S1L-h ("description
per-element font skinparam sizing") is already closed — these five are its
*remainder*, which means the obvious per-element font path is already wired and
whatever is left is something S1L-h did not cover. Do not re-derive S1L-h's
work; find what it missed.

**The single most valuable prior lesson for this bucket:** the recurring gap in
this codebase is *a feature reaches the RENDERER and the SIZER never calls it*.
In all four historical instances the renderer already had a resolver AND was
already calling it — so **grep whether the renderer already resolves the value
before concluding anything is unimplemented.** A closely related second variant
exists: a value reaches `BoxSizingOpts` and is never READ.
`measureTextBlock` has exactly ONE caller (inside `measureBox`), so
`wrapWidth`/`guillemet` never reach `measureNote` / `measureSimpleSymbol` /
`measureActor` / `measureUsecase` / `measureFolderLeaf`. A reachability guard
cannot see that class of bug.

## Task

Diagnose each fixture to a `file:line` mechanism and record it on the schema.
**No source changes, no fixes** (ADR-2, ADR-5).

| Fixture | delta (in) |
|---|---|
| `gogamo-72-pibo470` | 0.2148 |
| *`loroto-06-fano471`* | *0.0833* |
| `revusu-28-pexi248` | 0.0972 |
| `tijexo-10-zipo222` | 0.2870 |
| *`toxine-81-xofo986`* | *0.0833* |

**Start with `loroto-06` / `toxine-81`** — both carry exactly 0.0833, and
`CLAUDE.md`'s rule ("an IDENTICAL delta across fixtures = ONE shared cause")
has held every time it has been tested. Resolving the pair resolves two
fixtures. If you conclude they do not share a cause, that needs evidence.

Note `0.0833in ≈ 6px` at 72dpi and three of the five deltas are under 0.1in —
small, uniform deltas of this shape have historically traced to a single
constant or a single missing resolver call, not to five independent bugs.

## Write-set

- `plans/s1l-tail-diagnosis/findings/element-font.md` — **this file only**

Probes go in `scripts_scratch/` and MUST be deleted before you finish.

## Read-set

Required first (mandatory for any sizing bug, any engine, per `CLAUDE.md`):
`planning/usymbol-composition.md`, `planning/sizer-renderer-parity.md` — the
second is especially load-bearing here: it tabulates every resolver/setting
against what actually reaches the sizer, with jar-proven verdicts.

Mission: `../decisions.md`, `../findings/SCHEMA.md`,
`~/.claude/rules/diagnosis.md` (**read it**).

Also read `tests/architecture/sizer-renderer-parity.test.ts` — its header
names four blind spots, and **green is not proof of parity**; only 1 of the 4
historical instances was resolver-shaped.

Candidate code (starting points, not conclusions):
- `src/diagrams/description/leaf-sizing.ts`, `leaf-sizing-consts.ts`
- `src/core/skinparam.ts` — `resolveSkinparam`, `parseStyleBlock`
- `src/diagrams/description/leaf-sizing-text.ts` — `measureTextBlock`

Oracle: `test-results/dot-cache/{component,usecase}/<slug>/`.

## Architecture decisions

ADR-2, ADR-3, ADR-4, ADR-5, ADR-6 — [decisions.md](../decisions.md). Locked.

## Interface contract

One record per fixture on [findings/SCHEMA.md](../findings/SCHEMA.md), field
names and order unchanged.

## Acceptance criteria

- **Given** each of the five, **when** diagnosed, **then** `originFileLine` is
  a real file and line.
- **Given** `loroto-06` and `toxine-81`, **when** both are diagnosed, **then**
  each names the other in `sharedCauseWith` or refutes the shared cause with
  evidence.
- **Given** a claim that a resolver is missing, **when** recorded, **then** the
  record states whether the RENDERER already resolves that value (the
  historical answer has been "yes" in all four instances).
- **Given** an unresolvable fixture, **when** recorded, **then**
  `status: unresolved` with `ruledOut` and `nextStep`.
- **Given** completion, **when** `git diff --name-only` runs, **then** no
  `src/` path appears and `scripts_scratch/` is empty.

## Quality bar

```sh
npm test
npx tsx scripts/measure-description-size-deltas.ts   # 321/351, widened 0
git diff --name-only                                 # no src/ path
```

Capture `$?` directly; never pipe a gate.

## Observability

N/A — no new observable operations.

## Rollback

Reversible. Revert = delete the findings file.

## Boundaries

**Always:** reach `file:line`; read the two required tables first; Serena MCP
tools. **Ask first:** oracle regeneration or jar patch. **Never:** modify
`src/`; state-mutating git; touch a backlog pin; ship a fitted constant
(a scan once produced 10.9 where the real value was `size/4.5` from
`StringBounder#getDescent`); declare a divergence.

## Commit

`docs(T3): element-font mechanism table` — or defer to the orchestrator.

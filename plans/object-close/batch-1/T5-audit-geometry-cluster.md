# T5 — audit the purely-geometric cluster (~30 fixtures)

> **Expected to be oversized.** Splitting this task once T1's real numbers
> land is an explicit push-forward condition. Split by delta band (1px /
> 2–10px / ≥10px) into `audit-geometry-a.md`, `-b.md`, `-c.md` and record the
> split in the journal — do not pad a single agent through 30 fixtures.

## Prior observations

- **Zero** object fixtures are under 0.5px. G3's claim that 46 of them were
  sub-pixel graphviz noise does not survive measurement. The
  `DIVERGENCES.md` entry it leaned on generalizes from a single class fixture
  (`bipudo-23-xavu432`, ~0.0097pt) and is being narrowed in T7 (`decisions.md`
  D2).
- Planning-time bands: **4 at exactly 1.0px** (`fafozi-27-reja300` — owned by
  T3, `jabote-02-rajo672`, `jotaga-99-fatu830`, `sajege-04-zuce784`); 8 at
  2–10px; the remainder ≥10px, reaching 147px, 557px, 1001px.
- An exact-1.0px delta is an **off-by-one**, not engine noise — a rounding
  mode, an inset, or a `LimitFinder` `-1` convention. G3/O2 already ported one
  such: `LimitFinder#drawRectangle`'s native `-1`/`-1` inset, which cost 1px
  on the width axis only.
- `jotaga-99-fatu830` was named at G3 close as a "pre-existing DOT
  canvas-rounding residual". That is a hypothesis, not a finding — verify it.
- `meloxo-38-jeti489` (147px) and `tusiri-92-catu943` (114px) were filed
  `awaiting-maintainer` for DOT-topology namespace/package nesting; both lead
  with `svg/@height`. `maxosa-84-juci042` (1001px) was filed as the unbuilt
  `<style> json/map { MaximumWidth/MinimumWidth/Margin/Padding }` cascade.
- The object **DOT gate is 78/80 EQUAL**. Where DOT is structurally equal and
  geometry differs by hundreds of pixels, the cause is upstream of layout —
  node sizes or emitted attributes — not the engine's placement of identical
  input. Establishing which side of that line each fixture falls on is the
  core of this task.

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; `~/git/plantuml` is
the canonical spec. Object diagrams route through the class engine and lay out
via `@knowvah/dot-engine`.

Object is **not** a Smetana path: it emits svek DOT and has a DOT-parity gate,
so per `decisions.md` D2 the jar's geometry IS a target here. The
accept-the-delta ruling covers `@startjson`/`@startyaml`/`@starthcl`,
`@startgit` and `!pragma layout smetana` — none of which is object.

This is a **read-only investigation task**. It changes no production code.

## Task

For each fixture, determine whether its geometric delta originates:

- **(a) upstream of layout** — node size, emitted DOT attribute, or document
  dimension: a port defect, fixable;
- **(b) in the engine** — identical DOT in, different coordinates out: a
  `gvts-blocked` candidate, which must then be **filed** per D6, with the
  measured delta; or
- **(c) in a named unbuilt subsystem** — e.g. the `<style> json/map`
  dimension cascade.

Distinguishing (a) from (b) is the point. `scripts/dot-sync-drilldown.ts`
shows oracle-vs-ours DOT side by side; where the DOT matches and the SVG does
not, compare the node `width`/`height` attributes fed in before concluding
anything about the engine.

## Write-set

`plans/object-close/audit-geometry.md` (or the `-a`/`-b`/`-c` split). **No
production code.**

## Read-set

- T1's per-fixture table in `plans/object-close/decision-journal.md`.
- Each fixture's `in.puml`, re-captured `in.svg`, and cached DOT.
- `scripts/dot-sync-drilldown.ts` — the per-slug comparison tool.
- `src/diagrams/class/class-object-map-sizing.ts` and the layout seam.
- Upstream: `net/sourceforge/plantuml/svek/` (the DOT emission +
  `LimitFinder`), `net/atmp/CucaDiagram.java`. For engine questions read the C
  at `~/git/graphviz/lib/dotgen/` (`rank.c`, `mincross.c`, `position.c`,
  `dotsplines.c`) — not the Java transpile in `smetana/`.
- `plans/g3-object-svg/ledger.md` — O2's `LimitFinder` inset writeup is direct
  precedent for the 1.0px band.

## Architecture decisions in force

D1, D2 (≥1px is ours until proven otherwise — the proof is a measurement, not
a citation), D6 (confirmed engine findings are filed before the iteration
closes).

## Interface contracts

Identical row format to [T3](T3-audit-size-cluster.md#interface-contracts),
plus a required `Origin side:` field valued `upstream-of-layout` | `engine` |
`unbuilt-subsystem`.

## Acceptance criteria

- Given the cluster, when the audit completes, then each fixture has exactly
  one row matching the contract, including `Origin side:`.
- Given the 1.0px band, when audited, then each is traced to a specific
  rounding, inset or convention with a Java `file:line` — "canvas rounding"
  without a citation is not a verdict.
- Given any `Origin side: engine` row, when read, then it reports the DOT
  comparison that established identical input, and the measured coordinate
  delta.
- Given `jotaga-99-fatu830`, when audited, then G3's "pre-existing canvas
  rounding" claim is either confirmed with evidence or replaced.
- Given the audit, when complete, then `git status` shows no production file
  modified.

## Observability requirements

N/A — no new observable operations.

## Rollback

**Reversible** — a documentation-only commit.

## Quality bar

Diagnosis mode governs every row. The specific failure this task exists to
avoid: concluding "engine" from a large delta without first checking the node
sizes fed into it. A large delta is *evidence of nothing* about its own
origin.

Return only the audit file(s). No preamble, no trailing summary.

## Boundaries

- **Always:** compare the DOT before attributing anything to the engine; open
  the Java method body, not a remembered summary.
- **Ask first:** splitting the task (record the split; then proceed).
- **Never:** edit production code; chase a coordinate to make a number
  shrink; `git checkout/reset/stash/clean`; commit.

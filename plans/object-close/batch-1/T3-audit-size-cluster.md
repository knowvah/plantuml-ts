# T3 — audit the size-backlog cluster (8 fixtures)

## Prior observations

- All 8 slugs in `oracle/goldens/object/size-backlog.json` are **also** SVG
  non-conformant, and they drive 4 of the 6 worst SVG offenders. A wrong node
  size propagates through structurally-identical DOT into every downstream
  coordinate — which is why this cluster is audited and fixed first
  (`decisions.md` D3).
- Three slugs carry an **identical** `0.055556` in pin — `fonulu-92-libi014`,
  `lisepi-64-mudo307`, `tenalu-53-meri239`. Identical deltas are the signature
  of one shared mechanism, not three bugs. The backlog file's own `_doc` says
  so explicitly.
- A3's close journaled candidate mechanisms for several of these — treat as
  **hypotheses to verify against the Java, not findings**: bracket-attribute
  endpoint declarations (`fonulu-92`), descriptive-USymbol icon sizing under
  `allow_mixing` (`gapisu-00` family), endpoint-only entities defaulting to
  class sizing (`tobuka-93`), stacked-stereotype label splitting
  (`fafozi-27`), unapplied `<style>` blocks (`lisepi-64`).
- The backlog was re-baselined 2026-08-10: 14 fixtures had already reached
  exactly 0 and were deleted. So the surviving 8 are the *hard* residue, not
  a stale list.

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; `~/git/plantuml` is
the canonical spec. Object diagrams route through the class engine
(`src/diagrams/class/**`) — upstream has no separate object engine.

This is a **read-only investigation task**. It changes no production code.

## Task

For each of the 8 slugs, produce an attribution row: the mechanism causing
the node-size delta, its origin in the Java with `file:line`, the causal
chain from that cause to the observed SVG diffs, and what you ruled out.

Where several slugs share a mechanism, say so and give the shared cause once
— that grouping is the deliverable that seeds `decisions.md` D3's fix order.

Slugs: `tobuka-93-jale775` (4.9516in, 148 diffs, 1196px) ·
`fonulu-92-libi014` (0.0556, 364, 90px) · `lisepi-64-mudo307` (0.0556, 192,
colour) · `togixe-65-bepo490` (0.0467, 171, colour) · `lunike-70-xipi897`
(0.0734, 102, colour) · `pikuba-31-faxo766` (0.5535, 7, 80px) ·
`tenalu-53-meri239` (0.0556, 24, 2.2px) · `fafozi-27-reja300` (~1e-6, 2,
1.0px).

## Write-set

`plans/object-close/audit-size.md` — this file only. **No production code.**

## Read-set

- `oracle/goldens/object/size-backlog.json` — the pins and the `_doc` note.
- T1's per-fixture table in `plans/object-close/decision-journal.md`.
- Each slug's `test-results/dot-cache/object/<slug>/in.puml` and re-captured
  `in.svg`.
- `src/diagrams/class/class-object-map-sizing.ts`, `class-map-sizing.ts`,
  `class-json-sizing.ts` — the sizing seam.
- Upstream, per slug's syntax:
  `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageObject.java`,
  `EntityImageMap.java`, `.../cucadiagram/TextBlockMap.java`, and
  `net/atmp/CucaDiagram.java`. **Grep `src/main/java/net/`, not just
  `net/sourceforge/plantuml/`** — that narrower scope silently misses
  `net/atmp/`, `gen/`, `smetana/`.
- `scripts/dot-sync-drilldown.ts` — per-slug oracle-vs-ours comparison.

## Architecture decisions in force

D1 (every row names a mechanism + `file:line`), D3 (this cluster is first),
D6 (a genuine engine divergence is filed, not chased).

## Interface contracts

One row per slug in `audit-size.md`, consumed by T6:

```
### <slug>
- Mechanism: <one sentence>
- Java origin: <path>:<line>
- Ours: <path>:<line>
- Causal chain: <size delta → which SVG attributes move>
- Ruled out: <what, and the evidence>
- Verdict: fixable | gvts-blocked (measured: <delta>) | needs-maintainer-scoping
- Shared with: <other slugs, or —>
```

## Acceptance criteria

- Given the 8 slugs, when the audit completes, then each has exactly one row
  matching the contract above.
- Given any row, when read, then its `Java origin` cites a real `file:line`
  that a reader can open — a filename alone is not a citation.
- Given the three identical-`0.055556` slugs, when audited, then the report
  states explicitly whether they share one mechanism, with the evidence.
- Given a `gvts-blocked` verdict, when read, then it carries the measured
  delta that justifies it; an unmeasured `gvts-blocked` is not acceptable
  (D1).
- Given the audit, when complete, then `git status` shows no production file
  modified.

## Observability requirements

N/A — no new observable operations.

## Rollback

**Reversible** — a documentation-only commit.

## Quality bar

Diagnosis mode (`~/.claude/rules/diagnosis.md`) governs every row: mechanism,
origin, causal chain, ruled-out. An empty "ruled out" on a non-trivial
fixture means the cause was guessed, not isolated. "This is hard" is not a
verdict.

Return only the audit file. No preamble, no trailing summary.

## Boundaries

- **Always:** open the Java method body and the constructor that built its
  inputs before stating why something differs.
- **Ask first:** nothing — this task blocks on nothing.
- **Never:** edit production code; edit another audit file; `git
  checkout/reset/stash/clean`; commit (the orchestrator commits).

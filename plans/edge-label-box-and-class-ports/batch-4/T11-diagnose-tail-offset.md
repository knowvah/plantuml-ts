# T11 — diagnose the tail-end ≈15.2 port-label offset

**This is a diagnosis task. Its deliverable is a mechanism, not a code change.**
`rules/diagnosis.md` governs: the task is done when you can state the cause,
not when a number gets smaller.

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the spec. Read the method body — not a filename, not a
remembered summary — and cite `file:line` in the same sentence as any claim
about upstream.

An edge carrying UML multiplicity (`A "1" -- "*" B`) draws two port labels. Our
`portLabelAnchor` (`src/diagrams/class/class-edge-geo.ts:202-223`) uses one
formula for both ends; upstream uses a per-end rule. Measured on
`object/tobuka-93-jale775`, jar baseline minus engine anchor:

| end | offset | samples |
|---|---|---|
| tail | **+18.244** | 18.246, 18.239, 18.247 |
| head | **+3.022** | 3.019, 3.025 |

**The head end is already derived** and you should not re-derive it:
`SvekEdge#getXY` is `getMinXY(...extractList(POINTS_EQUALS))`
(`SvekEdge.java:808-815`) — the marker polygon's minimum x/y, i.e. the reserved
box's top-left. `PositionableImpl.create(pt, dim)` stores it verbatim
(`PositionableImpl.java:44-52`), and the draw applies
`UTranslate(labelX, labelY)` (`SvekEdge.java:956-980`), so the baseline lands
at `boxTop + ascent`. With `HEIGHT="13"`, `boxTop = centre − 6.5` and a 13pt
ascent ≈9.5 predicts centre + 3.0, matching +3.022 to 0.02.

**The tail end does not follow that rule.** +18.244 is `boxTop + 24.74` —
roughly a full box height further down. That extra **≈15.2** is what this task
must explain.

## Task

Find the mechanism that displaces the TAIL port label relative to the head,
and state it as a rule whose every term traces to a Java line.

Upstream's draw path for the two ends is textually identical
(`SvekEdge.java:956-967` vs `:969-980`), so the asymmetry enters earlier. Two
candidates, neither confirmed:

1. The two markers are emitted at different anchors — read where the
   `POINTS_EQUALS` marker polygons are produced for each end, and whether the
   tail's is placed relative to a different reference point.
2. `moveAwayFrom` / the cluster-avoidance pass (`SvekEdge.java:1208-1214`)
   displaces one end after placement.

Instrument before hypothesising: capture the actual reserved-box corners for
both ends on the fixture, and compare against what each candidate predicts.

## Deliverable

Append to `plans/edge-label-box-and-class-ports/decision-journal.md`:

- **Mechanism** — the cause, one or two sentences.
- **Origin** — `file:line`.
- **Causal chain** — why +18.244 follows from it, arithmetically, hitting the
  measured value within the sample spread (18.239–18.247).
- **Ruled out** — what you eliminated and the evidence. An empty "ruled out" on
  a defect this specific means you guessed.

## Read-set

- `docs/graphviz-issues/12-port-label-placement-near-head-node.md` — in full,
  including the "Dead ends" section; it records what has already been
  eliminated
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java` —
  `getXY`, the two draw branches, `moveAwayFrom`, and the marker emission
- `src/diagrams/class/class-edge-geo.ts:202-223` — the current single formula
- `test-results/dot-cache/object/tobuka-93-jale775/` — `svek-1.dot` and
  `in.svg` are the two sides of every measurement

## Architecture decisions (locked)

- **Never fit a value.** `+18.244` and `+3.022` are evidence, not a formula.
  Hard-coding them turns 14 diffs green and buries the rule — explicitly
  forbidden, and the reason this is a separate task from T12.
- If the mechanism proves to be below the code (a platform or engine constraint
  you cannot reproduce), that is a valid stop — but it must be documented with
  a controlled experiment isolating the variable, not asserted.

## Quality bar

No source change, so the four gates are unaffected — but if you add temporary
instrumentation, remove it and confirm `git status` is clean before finishing.

The mechanism must predict the measured constant. "It is roughly a box height"
is an observation; "it is `X` because `file:line` does `Y`, giving
`boxTop + 24.74`" is a diagnosis.

## Boundaries

- **Always**: quote the Java you rely on, with `file:line`.
- **Ask first**: expanding into `dot-engine`'s xlabel placer — the engine was
  measured to match the oracle exactly, so that would be a new claim needing
  its own evidence.
- **Never**: propose a fix before the mechanism is stated. Never edit
  `hooks/complexity-ignore`.

## Commit

Diagnosis only — journal entry, no code. If nothing else changes, one commit:
`docs(T11): diagnose the tail-end port-label offset` ≤72 chars, lowercase, no
period.

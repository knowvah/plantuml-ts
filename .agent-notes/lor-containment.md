# lor — what can and cannot see the splines change

Written 2026-09-03, orchestrator, between Batch 1 and Batch 2 of
`linetype-ortho-routing`. Measured, not inferred.

## Observation: exactly 8 goldens carry `splines=`, corpus-wide

- **Context**: the mission scopes itself to 8 fixtures, verified on one and
  inferred on seven. Stop condition 1 fires if anything outside the 8 moves,
  so the set needed independent confirmation.
- **Finding**: `grep -rl "splines=" oracle/goldens/` returns exactly the 8
  named fixtures and nothing else, across **1,865 golden directories**
  (class 720, class-SVG 316, state 269, state-SVG 60, description 357,
  object 79+34, plus the json/yaml/hcl/dot/skin families). The component
  fixture's golden lives under `oracle/goldens/description/`, not a
  `component/` dir.
- **Impact**: the containment claim is a measured fact about the golden
  corpus, not an inference. Nothing outside the 8 has a pinned jar DOT that
  even mentions splines, so `splinesOk` (T7) structurally cannot flip a
  ninth fixture.
- **Confidence**: High.

## Observation: NO gate can see the geometry change until T7 lands

This is the mission's premise re-confirmed from the gate side, and it makes
"leave the pins alone" and "keep all four gates green" compatible in
Batch 2 — which reads like a contradiction in the task files until you
check what the pins actually assert.

- **`oracle/goldens/svg-*/`** — none of the 8 has a full-SVG golden. No
  exact-match SVG comparison exists to break.
- **`oracle/goldens/*/diff-baseline.json`** (sequence, description,
  activity) — none names any of the 8.
- **`size-backlog.json`** — gates `maxSizeDelta`, the sorted **node
  width/height** multiset (`state-dot-parity.test.ts`, `compareStructural`).
  Ortho routing moves node *positions* and spline shape; it does not change
  the node dimensions fed to the engine. Expect this file NOT to move.
- **`routing-baseline.json` / `refusal-baseline.json`** — these name all 8,
  which looks alarming and is not: they pin **diagram-type routing**
  (`jarType` vs `ourType`) and refusal behavior respectively, both
  orthogonal to spline geometry. They name the whole corpus, not a splines
  subset.
- **`parity-*.json`** — the ratchet tests assert `dotEqual === true`;
  `maxDelta`/`verdict`/`firstDiff` ride along as data. `dotEqual` cannot
  change before T7 because `compareStructural` has no splines term yet.

**Consequence for Batch 2**: expect all four gates to stay green while the
geometry genuinely moves. Green is NOT evidence the task worked — the only
real instruments are `measure-composite-declared-size.ts` and T0's pin.
This is exactly the blindness `.agent-notes/gvi17-splines-never-emitted.md`
describes, seen from the other end, and it is why T7 exists.

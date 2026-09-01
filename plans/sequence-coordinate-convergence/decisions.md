# Decisions — sequence-coordinate-convergence

## D1 — `weightedScore` cannot score this mission, and that is not a reason to skip measuring

`weightedScore` counts diff RECORDS. An `@x` that is wrong by 40 and becomes
wrong by 35 costs exactly 1 either way. Measured on four fixtures the
comparator descends into, essentially every numeric diff is already outside
tolerance:

| fixture | numeric diffs | off by >3 |
|---|---|---|
| `bexoce-95-vibe195` | 227 | 225 |
| `baxopu-48-fezi101` | 151 | 150 |
| `cakelu-69-muza643` | 207 | 207 |
| `celego-19-laji937` | 70 | 70 |

So the ratchet is a REGRESSION BACKSTOP for this mission and nothing more. The
primary evidence is the distance instrument Batch 1 builds: the sum of
`|delta|` over numeric diffs, which falls monotonically as coordinates
approach the jar's. **No batch may be judged on `weightedScore` alone**, and a
batch that lowers total distance while raising `weightedScore` is progress,
not a regression — see D5.

This is also why three correct, jar-verified geometry fixes
(`bbcc90ae`, `5dfa0982`, `ebbd1f41`) each measured `unchanged=1124`.

## D2 — The blocker is one uncited constant, and its class is the real target

`theme.ts`'s `sequence.participantMinWidth: 80` has no upstream counterpart.
Upstream is `ComponentRoseParticipant#getPreferredWidth = getTextWidth +
margin.left + margin.right + deltaShadow + getDeltaCollection()` (`:135-137`),
with the floor applied to the PURE TEXT width — `getPureTextWidth =
max(super.getPureTextWidth(), minWidth)` (`:140-142`) — and `minWidth` coming
from `Rose#getMinClassWidth` = `style.value(PName.MinimumWidth).asDouble()`
(`Rose.java:276-278`). `MinimumWidth` appears NOWHERE in `plantuml.skin`, and
`ValueNull#asDouble()` returns `0` (`ValueNull.java:57-59`). Upstream's floor
is zero.

Measured: **1033 of 1124 fixtures (92%)** carry at least one box pinned at
that 80px floor; **2358 of 2850 participants (83%)**. `jobadi-87-jegi648`'s
`Bob` is `width="80"` here and `width="38.938"` in the jar.

Every constant this mission touches must arrive with its Java `file:line`.
The 80 is the archetype of what is being removed; do not replace one fitted
number with another.

## D3 — Measurer parity is established, so a residual error is arithmetic

Every participant box in a golden is `textWidth + 2 * Padding`, so the goldens
hand us the jar's own `textWidth`. Checked against `DeterministicMeasurer` at
`sans-serif 14`:

| label | jar | ours | delta |
|---|---|---|---|
| `Bob` | 24.938 | 24.938 | -0.001 |
| `a` | 7.788 | 7.788 | 0.000 |
| `c` | 7.000 | 7.000 | 0.000 |
| `A`/`B`/`P`/`S` | 9.362 | 9.362 | +0.001 |
| `U` | 10.150 | 10.150 | 0.000 |
| `Particpant_A` | 80.150 | 80.150 | 0.000 |

Sub-thousandth on every one. If a box width still disagrees after Batch 2,
the fault is in the FORMULA, not the measurement — do not go looking for a
metrics gap.

## D4 — Batch order is dependency, not preference

Spacing reads widths; widths do not read spacing. Every batch below is
blocked on the one before it, and running them out of order produces
measurements that cannot be attributed. The one genuinely independent batch
is Batch 1, which is why it is first.

## D5 — Expect a broad RISE at intermediate batches, and re-pin ONCE

Correcting a coordinate that feeds thousands of derived coordinates moves the
whole corpus. Some fixtures will cross from "child counts matched by
coincidence" to "mismatched", and `weightedScore` will rise on them. That is
the same class the three `DIVERGENCES.md` rollout entries already record.

**Do not re-pin per batch.** Re-pin once, at close-out, after a full
adjudication — and check every raised pin against an adjudicated `artefact`
verdict, because `repin-sequence-baselines.ts` compares each fixture to its
PIN rather than to the base ref and will happily green-light a row that was
already red (`.agent-notes/sequence-newpage-repin-hazard.md`).

## D6 — OPEN: the label-widening pre-scan versus upstream's constraint system

Upstream positions participants on a `Real` constraint graph: each tile adds
its own constraints (`Tile#addConstraints`), `LivingSpaces#addConstraints`
adds `nextA >= prevE + 10` (`:61-71`), and `xorigin.compileNow()` solves them
(`SequenceDiagramFileMakerTeoz.java:89-110`). This port instead pre-scans the
event list for the widest label between each adjacent pair
(`scanMessageLabels`) and widens the gap directly.

The two are not obviously equivalent: a constraint solver resolves
interacting constraints globally, a pre-scan resolves them pairwise. **Batch 7
must decide this explicitly and record which it chose and why** — the port's
architecture rule says a structural divergence IS the bug, but replacing the
pre-scan with a `Real` solver is a much larger mission than this one. If the
pre-scan is kept, the entry belongs in `DIVERGENCES.md` with the cases it is
known to get wrong.

Do not let this drift into being decided by whichever code an agent happened
to touch.

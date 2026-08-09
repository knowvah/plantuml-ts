# Mission — class edge-spline conformance (`bipudo-23-xavu432`)

> ## ✅ CLOSED 2026-08-08 — no fix, by maintainer decision
>
> **The divergence is Smetana's, not ours, and this port does not chase
> compatibility with it.**
>
> T1 established that fed the jar's own `svek-1.dot`, this port's engine
> returns exactly what **real graphviz 15.1.1** returns; the jar's control
> points are that value quantized to 2 decimals. The jar lays out with
> Smetana, a transpile of **graphviz 2.38**, which is years behind
> upstream graphviz. The maintainer's ruling is that matching it is not a
> goal — so **why** Smetana quantizes is moot, and our value is the better
> one.
>
> This reclassifies the fixture from *a gap to close* to *a deliberate
> divergence*:
>
> - Filed in `oracle/accepted-divergences.json` (its first entry).
> - Recorded in `DIVERGENCES.md` under "Edge geometry follows modern
>   graphviz…".
> - `oracle/goldens/svg-class/README.md`'s removed-fixtures row is closed;
>   **do not re-pin** — it can never be zero-diff against this oracle.
>
> **The original exit condition below (re-pin the fixture) is void.**
>
> ### The part worth carrying forward
>
> The conformance harness's **0.01pt tolerance**
> (`tests/oracle/svg-conformance/compare.ts`) is what absorbs this version
> gap for essentially every other fixture — that is now a load-bearing
> fact about the oracle, not an arbitrary constant. Expect other fixtures
> to cross it as either side evolves. **A fixture failing on edge geometry
> alone, by a hair, is more likely this than a regression** — check the
> raw layout against real graphviz before treating it as a defect.
>
> Everything below is the original brief, kept for the measurement and the
> reasoning trail.

Close a sub-pixel edge-spline divergence between this port and the jar.
The fixture that exposes it was **un-pinned** from the class ratchet by
maintainer decision on 2026-08-08 so the suite could go green; this mission
exists to earn it back.

**This is a deferral, not an accepted divergence.** There is deliberately
no entry in `oracle/accepted-divergences.json`. The exit condition is
re-pinning `bipudo-23-xavu432` in `oracle/goldens/svg-class/ratchet.json`.

## The measurement

Fixture `oracle/goldens/svg-class/bipudo-23-xavu432` — four classes, four
inheritance edges (`A0 <|-- B0`, `A1 <|-- B1`, `A0 <|-- B1`, `A1 <|-- B0`).

One `<path>`'s spline, ours against the jar's golden:

```
jar    M61.1843,69.3715            C75.1843,87.0515          …
ours   M61.18862596129014,69.3695756178185  C75.1940275463084,87.04305857034154  …
```

| coordinate | ours | jar | delta |
|---|---|---|---|
| `M` x | 61.18862596129014 | 61.1843 | 0.0043 |
| `M` y | 69.3695756178185 | 69.3715 | 0.0019 |
| **first control x** | **75.1940275463084** | **75.1843** | **0.0097** |

Every coordinate is slightly off; only the control point exceeds the
harness tolerance.

## Why it surfaced now, and why that is not the cause

`tests/oracle/svg-conformance/compare.ts` uses a **0.01** tolerance for the
`deterministic` class. At full precision the 0.0097 gap sat just inside it
and the fixture passed. The `svg-output-size-reduction` mission moved
emission to 3 decimals, which rounded ours **up** (`75.194`) and the jar's
**down** (`75.184`), widening the reported gap to `0.0100000000000051` —
a hair over.

**The underlying divergence is pre-existing.** Proven by rendering the
fixture in an isolated worktree at pre-mission `1d913189`: the same
`75.1940275463084` is already there. Rounding changed only what the
comparator could see.

## What is already ruled out

- **Not DOT emission.** `tests/oracle/svg-conformance/parity-class.json`
  records `dotEqual: true` for this slug — our DOT input is byte-identical
  to the jar's. The divergence therefore arises **after** DOT.
- **Not the size-reduction port.** Pre-mission code produces the same raw
  value (worktree check above).
- **Not the golden.** Old and new goldens agree (`75.1843` → `75.184` at
  3dp), and the golden re-captures clean:
  `scripts/rebaseline-svg-goldens.ts` reports `CHANGED=0`.
- **Not caller-side pre-rounding.** Pre-mission code still had `javaRound4`
  and produced the same unrounded value.

## Where to look, in order

1. **The layout engine's spline output.** Identical DOT in, different
   control points out, means `@knowvah/dot-engine` computes the spline
   differently from graphviz-C/Smetana. Compare its raw spline against the
   jar's `svek-1.dot` → jar spline for this fixture. If confirmed, this is
   a library finding: file it under `docs/graphviz-issues/` with a minimal
   repro **and a `TRACKER.md` line**, per this repo's CLAUDE.md, before the
   mission closes.
2. **Post-layout spline handling.** `src/core/klimt/geom/spline-clip.ts`'s
   `simulateCompound` finds a boundary crossing with **8 fixed midpoint
   subdivisions** (1/256 granularity). CLAUDE.md flags that granularity as
   load-bearing: the jar computes *that* 1/256-granular point, so a *more*
   precise crossing fails the ±0.01 bar. A divergence of ~0.0097 is
   suspiciously close to that granularity — check whether our subdivision
   count, start interval, or midpoint rule differs from
   `DotPath#simulateCompound`.
3. **Edge geometry assembly** — `src/diagrams/class/class-edge-geo.ts`,
   and `splinePathD` in `src/core/svg-path-builder.ts` (formatting only;
   it cannot move a value by 0.0097, so it is a read-only check).

## Do NOT

- Loosen `compare.ts`'s tolerance. The tolerance is the conformance bar;
  widening it to absorb a real gap is exactly the failure this mission
  exists to avoid.
- Edit the golden. It is the jar's output and re-captures clean.
- Add an `oracle/accepted-divergences.json` entry. That file is for
  maintainer-signed, won't-fix differences; this one is a gap to close.

## The fixture is not left unguarded

Un-pinning removes only the **SVG byte-conformance** assertion. Two
guards survive and must stay green:

- `tests/unit/class/layout-ink-extent.test.ts` still pins this fixture's
  jar-verified dimensions by name ("vertically stacked pair with a
  straight edge, `bipudo-23-xavu432`, single edge slice").
- `scripts/rebaseline-svg-goldens.ts` still captures its golden and
  reports it — the golden stays committed and re-captures clean, so a
  change on the JAR's side would still surface as `CHANGED`.

So the fixture continues to catch a layout regression; what it no longer
catches is the sub-pixel spline gap this mission owns.

## Quality gates

```sh
npm run typecheck
npm run lint
npm run build
rm -rf packages/*/assets && npm test     # cold tree
npx tsx scripts/rebaseline-svg-goldens.ts   # must stay CHANGED=0 (~10s)
```

Never pipe a gate — redirect to a file and check `$?`.

## Exit condition

`bipudo-23-xavu432` is re-pinned in `oracle/goldens/svg-class/ratchet.json`
and the class ratchet passes with it, **without** touching the tolerance,
the golden, or the accepted-divergences file. Remove its row from
`oracle/goldens/svg-class/README.md`'s "Removed fixtures" table when that
lands.

## Stop conditions

- The divergence turns out to be in `@knowvah/dot-engine` and cannot be
  fixed within this repo — then the deliverable is the filed
  `docs/graphviz-issues/` entry plus a pinned upstream issue, not a
  workaround in the port.
- Closing it for this fixture regresses any other pinned golden. The class
  ratchet is at 312 pinned fixtures; all must stay green.
- Two consecutive gate failures on the same check.

## Scope note

This is one fixture and one sub-pixel coordinate. It is worth a mission
because the mechanism is shared: whatever computes this spline computes
every class-diagram edge, so a fix is likely to move more than one fixture
— and a *regression* would too.

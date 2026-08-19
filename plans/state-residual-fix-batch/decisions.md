# Architecture decisions — state-residual-fix-batch (SI31)

Locked at planning. A task that finds a conflicting constraint **stops and
journals it** (stop 8) rather than silently overriding.

## D1 — G5's opacity signal is derived from the override, never from
comparing the resolved fill to a default

`RoundedSouth.drawU` branches on exactly one thing
(`RoundedSouth.java:62-64`):

```java
if (backColor.isTransparent())
    return;
```

and `Cluster.java:459-471` resolves that colour:

```java
HColor northBackcolor = group.getColors().getColor(ColorType.BACK);
HColor southBackcolor = northBackcolor;
if (northBackcolor == null) {
    northBackcolor  = ...SName.name...       .value(PName.BackGroundColor)
    centerBackColor = ...SName.description...value(PName.BackGroundColor)
    southBackcolor  = ...SName.body...       .value(PName.BackGroundColor)
}
```

with `plantuml.skin:269-271` defaulting the `body` bucket to `transparent`.

**Decision.** Add an optional boolean to `StateNodeGeo` carrying "this
composite's south background is non-transparent", computed from the rule
above — an explicit `ColorType.BACK` override on the group, or a `body`
bucket resolved to something other than transparent.

**Explicitly forbidden:** deriving it as `fill !== STATE_DEFAULT_BACKGROUND`.
That is a proxy that happens to correlate, resolves the wrong style zone
(`name`, not `body`), and misses a diagram-level `<style>` cascade. It would
be a fitted gate wearing a mechanism's clothes.

**Consequences.** Precise, at the cost of D2's plumbing.

## D2 — Thread the signal as a bare scalar, mirroring `shadowing`

`layout.ts` already plucks a single scalar off the theme and passes it down
(`layout.ts:495`: `materializeSpecs(specs, posMap, clusterPosMapOf(result),
theme.shadowing ?? 0)`), and `StateNodeGeo` already carries the result as
`shadowing?: number` with a doc comment saying it is "the resolved
theme.shadowing value… populated ONLY for the node kinds jar actually draws a
shadow for."

**Decision.** Same shape. Compute the boolean where `theme` is in scope
(`state-composite-pass.ts`, building `GeoSpec`), carry it on `GeoSpec` →
`StateNodeGeo`, consume it in `addNodeInk`. **Do not pass `Theme` into the ink
walk.**

**Consequences.** `layout-ink-extent.ts` stays theme-free in substance; four
files instead of one.

## D3 — G17 replaces the fallback with the jar's formula; it does not retune
12 to 15

The degenerate-ink branch falls through to `p.result.width/height` —
dot-engine's raw graph canvas, which bakes in a flat +12 graph margin. The jar
computes ink-bbox + 15 (`SvekResult.java:130-135`,
`minMax.getDimension().delta(15, 15)`).

**Decision.** Seed from the region's own raw node boxes and add ONE named
constant whose value is **15**, citing `SvekResult.java:135`. The number `3`
(the 15−12 difference that closes the arithmetic) must not appear in source.

**Consequences.** Mirrors upstream structure and survives a dot-engine margin
change. A bare `+3` would close every row today and be wrong the moment the
engine's default margin moved.

## D4 — G17 and G21 are separate tasks in sequential batches

Both write `src/diagrams/state/state-composite-concurrent.ts`, but in
different functions ~95 lines apart (`regionInkGeometry` ~:114-143 vs
`buildConcurrentBranchAcc` ~:228-248) with no shared local state.

**Decision.** G17 in Batch 1, G21 in Batch 2. Separate commits, separate
gates. They are never parallel, so `parallelism.md`'s collapse-into-one-agent
rule does not apply.

**Consequences.** Each blast radius is isolated — G17 is size-only, G21 also
moves label draw positions. Costs one extra gate cycle.

## D5 — G20a reverts on net growth; it does not ask for a per-fixture ruling

Up to **83 of 273** state fixtures carry a composite plus a `[*]` transition,
and graphviz's label force-search is non-monotonic in declaration order, so
they can move either way. The row it closes is worth +0.750 px.

**Decision.** Batch 6, last, after every other fix has landed and re-pinned.
Full-corpus gate. If the net is not shrink-only: **revert the whole batch** and
file G20a as its own tracked mission. Do not halt for a fixture-by-fixture
human ruling.

**Consequences.** Protects the earlier batches' gains. The mission may close
with `kejabo-83`'s row still open, which the close-out states plainly.
Human ruling, 2026-08-19.

## D6 — `jetuse-93` is verified, not assumed

SI29 named it a plausible-but-unverified G21 sibling ("Not asserted as shared;
needs its own re-measurement").

**Decision.** If G21's fix closes it, take it. If it is a different mechanism,
journal that mechanism with a `file:line` and leave the row open. No fix
outside a diagnosed mechanism.

**Consequences.** Exit is 15 or 16 rows depending on the answer; both pass.

## D7 — If the complexity hook blocks `addNodeInk`, extract a helper

`addNodeInk` (`layout-ink-extent.ts:310-369`) already carries a
`#lizard forgives` exemption before this mission adds anything.

**Decision.** Extract a named south-cap helper. **Never** widen the existing
exemption or add a new one.

**Consequences.** One more small function. The alternative normalises
suppressing a hook-enforced limit, which is how the limit stops meaning
anything.

## D9 — G15's clip moves to `src/core/`; it is never copied

The faithful `DotPath#simulateCompound` port already exists at
`src/diagrams/description/spline-clip.ts` (161 lines, exporting `subdivide` /
`clipSplineStart` / `clipSplineEnd`, its only import a `Bbox` **type**).
`layering.test.ts` Rule 2 forbids `src/diagrams/state/` importing from
`src/diagrams/description/`, and `KNOWN_DEBT` is `[]`.

**Decision.** Move the file to `src/core/spline-clip.ts` and repoint
description's importers — the SI27 shared-seam pattern — then have state
consume it from core. The move must be provably inert before the state
consumer is added.

**Explicitly forbidden:** copying the file into the state engine, and adding
an ALLOWLIST or `KNOWN_DEBT` entry to let state reach into description. Either
would give this repo two ports of one upstream method, which is the exact
condition SI27 existed to remove. An ALLOWLIST entry here is stop 6.

**Consequences.** Batch 5 is an extraction plus a consumer, not a one-line
patch — larger, but it leaves one port and a reusable core seam.

## D8 — Routing

Autonomous execution on `claude-fable-5`. T4 (the 4-file thread), T5 (the core
extraction) and T6 (the risky reorder) get Opus; T0, T1, T2, T3, T7 get Sonnet. Every agent prompt carries
the Opus behavioural compensation from `~/.claude/rules/parallelism.md` when
routed to Opus — with its stated carve-out: **a record enumerating required
behaviour is not ambiguous scope**, so nothing on the row list may be trimmed
as "over-engineering".

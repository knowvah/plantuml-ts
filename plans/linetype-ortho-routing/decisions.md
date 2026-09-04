# Architecture decisions — `linetype-ortho-routing`

Confirmed 2026-09-03 before decomposition. Treat every one as **locked**.
If a task discovers a conflicting constraint, amend the decision here and
halt for review — do not silently override it.

## D1 — Model it as `linetype?: 'ortho' | 'polyline'`, not a raw `splines` string

**Context:** `DotInputGraph` needs a field to carry the skinparam. Two
shapes were available: a semantic enum mirroring `theme.linetype`, or a raw
`splines?: string` passthrough.

**Decision:** the semantic enum. This is the faithful port shape — upstream's
`skinParam.getDotSplines()` returns a `DotSplines` enum and
`DotStringFactory` translates that enum into attribute strings
(`DotStringFactory.java:161-169`), so enum-in / translate-at-emitter **is**
upstream's own structure. It matches existing `theme.linetype` /
`ast.linetype` naming, and only an enum can express the ortho-only
`forcelabels` coupling ([D4]).

**Consequences:** one new optional field on `DotInputGraph`; two emitters
each translate it. A raw string would have invented capability upstream never
uses — YAGNI applies here because this is plumbing, not diagram behavior.

## D2 — The ortho→`forcelabels` coupling lives in ONE shared helper

**Context:** two emitters must agree byte-for-byte or DOT-parity breaks —
`applyGraphAttrs` (`graph-layout-build.ts:34-43`, structured `setAttr`
calls) and `graphAttrLines` (`svek-dot-emit.ts:66-77`, a string line).

**Decision:** a shared pure function returning attribute **pairs**; each
emitter renders them in its own form. The layout builder loops `setAttr`;
the DOT emitter joins them into **one line** — reproducing upstream's single
`println` after two `append`s, which is why the jar's cached DOT reads
`splines=ortho;forcelabels=true;` on one line.

**Consequences:** the rule lives in one place, so the two emitters cannot
drift. **The helper's output must be emitted OUTSIDE the `omitSepAttrs`
guard** — `pavuzo-79-zodu430`'s cached `svek-1.dot` carries
`splines=ortho;forcelabels=true;` with **no** `nodesep`/`ranksep`, proving
upstream emits splines independently of the sep attrs. Placing it inside
that `if` is the obvious wrong turn and would silently no-op every composite
pass.

## D3 — Each engine's routing half reads linetype from the SAME expression its label half already reads

**Context:** the precedences differ today, and deliberately:

| engine | expression | label-half call site |
|---|---|---|
| state | `theme.linetype` | `state-dot-graph.ts:238`, `state-composite-edge-label.ts:98` |
| class | `theme.linetype` | `class-dot-graph.ts:401` |
| description | `theme.linetype ?? ast.linetype` | `description/layout.ts:469` |

**Decision:** mirror each engine's existing expression. Do **not** unify.

**Consequences:** these two halves are one feature. If the routing half read
a different expression than the label half, a diagram could get xlabels
without ortho routing (or the reverse) — reintroducing exactly the
half-ported split this mission exists to close. Uniformity is the lesser
value; agreement between halves is load-bearing. Any future change to a
precedence must move both halves together.

## D4 — `polyline` gets NO `forcelabels`

**Context:** `DotStringFactory.java:162-168` — the POLYLINE arm appends only
`splines=polyline;`; the ORTHO arm appends both.

**Decision:** preserve the asymmetry exactly. Do not "tidy" it into a
uniform two-attribute emission.

**Consequences:** the helper is a 3-way branch (`undefined` / `polyline` /
`ortho`), not a boolean. This is upstream behavior mirrored, not a bug fixed
inline — never fix an apparent upstream bug inline (CLAUDE.md).

## D5 — `splinesOk` joins `structurallyEqual`, gating `dotEqual`

**Context:** `compareStructural` (`tests/oracle/svek-dot.ts:453`) is
explicit field-by-field, not deep-equal — so a new `StructuralGraph` field is
**not** compared unless wired in. Leaving it unwired reproduces the exact
blindness that hid this bug for six weeks: the harness has zero
`splines`/`linetype` tokens today, which is how the state suite reads
"DOT EQUAL 266/268" with materially different routing.

**Decision:** add `splinesOk` to the returned `StructuralDiff` **and** to
the `structurallyEqual` conjunction.

**Consequences:** `StructuralDiff`'s shape changes — consumed by
`scripts/dot-sync-report.ts`, `scripts/svg-parity-survey.ts`, and the
`parity-*.json` files. Only the 8 splines-bearing fixtures can be affected,
but that must be **measured, not assumed**: a flip outside the 8 is stop
condition 1.

## D6 — Emitter lands BEFORE the harness assertion, and the assertion is PROVEN to discriminate

**Context:** `parity-*.json` records `dotEqual: true` for all 8 today, but
only because splines is not compared. Adding the assertion first would flip
8 fixtures red for a reason that is not a regression.

**Decision:** strict ordering — T3 (emitter) before T7 (assertion). And T7
must **prove** the assertion fails when the emitter is reverted, recording
the experiment; never assume it.

**Consequences:** a task-ordering constraint across batches. The proof step
is non-optional: this repo has shipped an oracle fixture that did not guard
what it claimed, caught only by reverting the fix and watching it still pass
(`planning/mission-index.md`, SI21). An assertion that cannot fail is
decoration.

## Not applicable — backwards compatibility

plantuml-ts has **no consumers**. This mission changes the emitted SVG for
`linetype ortho|polyline` diagrams; that is movement toward jar parity, not a
breaking change to manage. No versioning, no deprecation window, no
dual-write. `DotInputGraph` gains an OPTIONAL field — additive for every
existing caller. Classified only by reversibility: **Reversible** — `git
revert` restores the prior shape, **provided the revert takes the whole
mission**; reverting source while keeping tightened pins would leave the
shrink-only ratchets unsatisfiable.

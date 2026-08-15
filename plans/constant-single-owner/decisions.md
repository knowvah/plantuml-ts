# Architecture decisions (pre-made, locked)

If execution surfaces a conflicting constraint, STOP and log it in
`decision-journal.md` — do not silently override.

## D1 — A shared owner mirrors the UPSTREAM package that owns the constant

**Context.** `INK_DELTA`/`JAR_INK_MARGIN` came from
`svek/SvekResult.java`, so their owner is `src/core/svek/SvekResult.ts` —
same package path, same filename as the Java. That made the origin
self-documenting and put the module where a reader looking for
`SvekResult` behaviour would already be.

**Decision.** Every owner module created here follows that rule: mirror the
upstream package and file that declares the field. Do NOT create a
`src/core/constants.ts` grab-bag.

**Rejected:** one shared constants module. It would collect unrelated
numbers behind a single import, destroy the origin signal that makes the
share defensible, and become exactly the kind of file nobody can safely
delete from.

**Consequences.** Several small owner modules rather than one big one. That
is the intended shape.

## D2 — A constant with no upstream origin is NOT consolidated on value

**Context.** 43 of the 61 same-value names carry no upstream citation at
all. Several are clearly ours (`PX_PER_INCH`, `LAYOUT_MARGIN`), several are
probably upstream but undocumented.

**Decision.** No citation, no consolidation — unless the task establishes
the upstream origin itself and adds the citation. "Both are 20 and both are
margins" is not evidence they are one constant.

**Exception, narrow and explicit:** a constant that is provably OURS, not a
port, and duplicated WITHIN one engine (see D3) may be consolidated on
identity of purpose, because there is no upstream declaration count to
mirror. `PX_PER_INCH = 72` is the clean case — a unit conversion, not a
ported value.

**Consequences.** A large share of the 61 will legitimately stay put. The
mission's success is not "100 declarations removed"; it is "every remaining
duplicate is one somebody deliberately kept."

## D3 — Intra-engine duplication is a different, easier problem

**Context.** `NODE_MARGIN_Y = 20` is declared **8 times**, all inside the
activity engine (`activity/` and `activity/tiles/`). `NODE_MARGIN_X` 4
times, `ACTION_H_PAD` 4 times, same place.

**Decision.** Treat these separately (Batch 3). They need no cross-engine
judgement and no `src/core/` owner — the owner is a module inside that
engine. The share-vs-coincidence test still applies, but "same engine, same
name, same value, same purpose" is far stronger evidence of one constant
than the cross-engine case.

**Consequences.** Batch 3 is the highest declaration-count reduction for
the lowest risk, and is independent of Batch 2.

## D4 — Collisions get renamed, not merged, and renaming is required

**Context.** Six names hold different values in different modules. They are
not duplication, but they READ as duplication — which is how the next
person running the inventory gets misled into merging them.

**Decision.** Rename so the collision disappears: qualify by owner or by
purpose (`STATE_MARGIN`, `CANVAS_MARGIN`, `SPOT_RADIUS`, …). Renaming is
part of the mission, not optional cleanup, because leaving them is leaving
the trap armed.

**Rejected:** leaving them with a comment saying "not the same as the other
`MARGIN`". A comment on one of seven declarations is not discoverable from
the other six.

**Consequences.** A rename touches every reference, so each is its own
commit and each must be behaviour-neutral by inspection AND by gate.

## D5 — `HACK_X_FOR_POLYGON` stays duplicated

**Context.** One upstream constant, 4 copies — so by D1 it should be
shared. It is not, for a specific and verified reason:
`core/klimt/drawing/LimitFinder.ts` keeps it `const` (unexported), and the
ink modules observe a stated klimt-free-module convention.
`class-ink-shapes.ts` imports nothing from klimt at all, so the convention
is real and observed, not aspirational.

**Decision.** Out of scope. Each copy is cited to upstream; the drift risk
on a verbatim quirk constant is low; and retiring it means changing an
architectural convention, which is a bigger call than a consolidation
mission should make unilaterally.

**Consequences.** The inventory will keep reporting it. T1's report marks it
`known-exception` so it does not read as unfinished work.

## D6 — No engine may import a constant from another ENGINE

**Context.** The cheapest way to dedupe `class` and `state` both declaring
`NOTE_FONT_SIZE` is for one to import from the other.

**Decision.** Forbidden. A shared constant moves to `src/core/` under D1's
naming, or it stays duplicated. A `diagrams/state/*` importing from
`diagrams/class/*` is a worse coupling than the duplication being removed,
and it would make the two engines' independence — which upstream has — a
lie in this port.

**Consequences.** Some consolidations cost a new `src/core/` module for two
constants. That is the correct price.

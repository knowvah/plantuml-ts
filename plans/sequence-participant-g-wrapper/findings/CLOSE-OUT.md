# sequence-participant-g-wrapper — close-out

**Status: HALTED before merge, code complete and measured.** Stop condition 4
(a task that turns out to need splitting) plus an unresolved 10-fixture rise.
Branch `feat/sequence-participant-g-wrapper`, 5 commits, not merged.

## What the mission set out to do, and whether it did it

**Yes.** The comparator could not measure sequence arrow fidelity; it now can.

| | main | branch |
|---|---|---|
| fixtures reporting any `polygon/@points` diff | **42** | **487** |
| `polygon/@points` diff records | **721** | **7 922** |

Same 1124 measured fixtures, same 17 skips, `DeterministicMeasurer` +
`fixtureIncludeStore()` on both sides. `celego-19-laji937` — the fixture T15
diagnosed — now matches the golden's root-group child sequence **tag for
tag**, and reports both messages' `polygon/@points[0..7]`, the exact records
T15 measured as absent. It also surfaced a real dressing defect that was
previously invisible to the gate: `line[2]/@stroke-dasharray`, ours `5,5`
against the jar's `2,2`.

**Correction to the filing.** T15's "not one `polygon/@points` record exists"
was true of `celego`, and `planning/next-missions.md` generalised it to the
corpus. It was never corpus-wide: 42 fixtures already reported arrow geometry
on main. The mission's effect is 11.6x more arrow evidence, not zero-to-some.

## What shipped

Three divergences from `teoz/PlayingSpaceWithParticipants#drawU:218-227`,
all in the renderer:

- **T1** — lifelines emit the jar's `<g><title>` group with its 8-wide
  transparent hover rect (`ComponentRoseLine.java:74-108`). Both offsets come
  from the component's own 1px preferred width, not from goldens.
- **T2** — activations emit `<g><title></title>` and move into the lifeline
  pass, interleaved **per participant** (`LivingSpace#drawLineAndLiveboxes`).
- **T3** — the footbox row moves before the foreground tiles. **This is where
  essentially all the value is**: without it the win is 45 fixtures, with it
  487.

Plus a `substructure` verdict for the adjudicator, and one documented
divergence.

## Why it is halted

**A fourth pass divergence, unscoped and larger than a task.** The jar's
background pass walks the whole tile tree (`PlayingSpace.java:109-117`), so
every grouping tile emits, before the lifelines:

1. a **Blotter** colour band per group (`GroupingTile#drawCompBackground`), and
2. its **outline rect** — emitted AGAIN in the foreground, because
   `GroupingTile#drawU:267` calls `comp.drawU` outside the `isBackground()`
   guard. Verified byte-for-byte: `pixopo-04-zitu732`'s golden carries the
   identical `<rect ... fill="none" stroke:#000;1.5/>` at top-level index 0
   and index 15; `kejoke-76-curu931` shows band+outline pairs for all twelve
   of its groups.

The port emits the whole frame last. **10 fixtures rise because of it**, and
they are not benign: measured directly by index-wise tag alignment against the
golden — an instrument independent of the charge — **5 got worse and 5 held;
none improved.** T3's footbox move shifts indices, and on a fixture whose
frame is already in the wrong pass that can break a coincidental alignment.

An attempt to fix it inside this mission (emit the outline in the background
pass) was made and **reverted**: it aligned `pixopo` through child 13 and
raised `improved` from 557 to 600, but traded 0 regressions for 5, and the
golden shows further layers behind it — `luzapi-49-rati107` emits a bare
`stroke-dasharray:1,4` delay line *between* lifeline groups, unwrapped, so
`Rose.java:210`'s `PARTICIPANT_LINE`-only branch matters too.

`FrameGeo` carries no background colour at all, so the Blotter needs a
parser -> AST -> layout change. That is a mission, not a task.

## Numbers

- Σ weightedScore over 1124 numeric fixtures: **1 291 577 -> 1 241 546**
- Adjudicated against `main`: **artefact=0 substructure=557 regression=0
  improved=557 inconclusive=27** (17 are the known `!include` error fixtures;
  10 are the frame risers above)
- Ratchet: **567 failing** = 557 re-pinnable + the 10

**The re-pin was NOT run.** `scripts/repin-sequence-baselines.ts` requires zero
regressions *and zero unadjudicated rises*; the second half does not hold.
Re-pinning the 557 while the 10 stand would bake 5 measured regressions into
the baseline — precisely what D5 exists to prevent.

## What to do next

1. **`sequence-frame-background-pass`** — port the background pass for
   grouping tiles: the Blotter band (needs a colour on `FrameGeo`), the
   duplicated outline, and frame emission in tile order rather than flat.
   This unblocks the 10 and likely improves far more.
2. Re-adjudicate, re-pin, merge this branch. The two are one landing.
3. **`sequence-zero-height-activation`** — 32 fixtures lay out an activation
   at height 0 where the jar gives it height. Fixing it lets the withdrawn
   `ComponentRoseActiveLine` guard land (see `DIVERGENCES.md`).

## Two process notes worth keeping

- **The brief's own stop condition would have halted the mission on its
  intended effect.** "Σ weightedScore rises -> halt" was written before the
  adjudicator was read; the repo already had the protocol.
- **Two of my own census scripts were vacuous and I nearly acted on them** —
  both called `layoutSequence(ast, measurer)` against a `(ast, theme,
  measurer)` signature and swallowed every throw into a bare `catch {}`,
  reporting a clean `[]` for a population of 32. A throwaway census must
  report its own skip count.

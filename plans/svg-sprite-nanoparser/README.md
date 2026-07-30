# Mission: svg-sprite-nanoparser

**Status:** ready to execute · **Branch:** `feat/svg-sprite-nanoparser`
**Created:** 2026-07-30 · **Predecessor:** `sizer-footprint-parity` (closed)

## Objective

Mirror upstream's `SvgNanoParser` draw-time decomposition so SVG sprites stop
sharing one dimension channel between layout and ink. Upstream has TWO
structurally independent channels — `AtomSprite.calculateDimensionSlow`
returns the DECLARED box for layout, while `SvgNanoParser.drawU` draws each
`<path>` as its own primitive and `Footprint.drawPath` observes real per-path
corners. Nothing computes an "ink box"; the narrowing is emergent. This port
emits ONE opaque `UImage` from `drawAtoms`, so the jar-verified `svgInkBox`
precomputation has nowhere to go but the same channel `SheetBlock1` reads to
advance its line-stacking cursor. One line is correct; two lines stack on ink
height. That is the **0.029321in** widening on `bootstrap-0` /
`ruziru-69-xixo434`.

The defect is architectural, not arithmetic. The fix restores upstream's two
channels rather than matching the numbers through a second side channel.

## Diagnosis is DONE — do not re-derive it

The mechanism is jar-verified and recorded in
[`plans/s1l-leaf-sizing/ledger.md`](../s1l-leaf-sizing/ledger.md), section
"The SVG-sprite ink gap — CORRECTED THREE TIMES; this version is
jar-verified". **Two earlier versions of that entry were wrong and the second
inverted the first.** Read only the third version. Do not act on either
earlier one, and do not re-open the diagnosis.

## Quality gates

All four must pass before any commit lands (CLAUDE.md):

| Command | Pass | On fail |
|---|---|---|
| `npm test` | exit 0 | fix_and_rerun |
| `npm run typecheck` | exit 0 | fix_and_rerun |
| `npm run lint` | exit 0 | fix_and_rerun |
| `npm run build` | exit 0 | fix_and_rerun |
| `npx tsx scripts/measure-description-size-deltas.ts` | exit 0 (zero widened) | stop |
| `git diff --name-only` vs declared write-set | matches only | stop |

**Every batch additionally re-runs the SVG golden guard: 310 svg-class / 22
svg-object / 57 svg-state must stay byte-identical.** `drawAtoms` is the
shared renderer across description, class, object and state — none of those
389 goldens contains a sprite, so any diff is collateral damage, never
expected churn.

## Batches

| Batch | Tasks | Theme | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | T1–T4 | Foundations: SvgPath, ColorResolver, UGraphicWithScale, resolver union | [x] |
| [2](batch-2/overview.md) | T5–T7 | Parser core + renderer seam | [x] |
| [2.5](batch-2/T13-affine-transform-threading.md) | T13 | Port `UPath.affine`/`rotate`; thread the transform (inserted 2026-07-30) | [x] |
| [3](batch-3/overview.md) | T8 | NanoParser shapes + text | [x] |
| [4](batch-4/overview.md) | T9 | Sprite resolution returns primitives | [ ] |
| [5](batch-5/overview.md) | T10–T12 | Retire `fitToInk`; pin the two channels; measure sprite goldens | [ ] |

## Documents

- [`decisions.md`](decisions.md) — the five approved ADRs. **Read before any
  task.** ADR-2 carries an explicit non-goal that agents reliably re-open.
- [`decision-journal.md`](decision-journal.md) — appended during execution
- [`diagrams/component-map.md`](diagrams/component-map.md) — what is touched
- [`diagrams/data-flow.md`](diagrams/data-flow.md) — the two channels, before
  and after

## Stop conditions

1. A task needs to write a file outside its write-set (and outside every
   other task's write-set).
2. Two consecutive gate failures on the same check, or the same location
   changed 3× without resolving it.
3. **Any SVG golden diffs** (310/22/57). Highest-signal tripwire in the
   mission. Deliberately strict — see `decisions.md#adr-5`.
4. A task proposes putting measurement ink back on `AtomImageResolver` —
   contradicts [ADR-2](decisions.md#adr-2)'s stated non-goal.
5. A task wants to re-pin `oracle/goldens/description/size-backlog.json`.
   **No re-pinning** (maintainer ruling). "The pin looks wrong" is a STOP.
6. A task needs to touch `measureUsecase` /
   `src/diagrams/class/class-layout-leaf-shapes.ts` — separate mission.
7. T5 wants to modify a `pathBBox` test rather than keep it green. That
   suite IS [ADR-1](decisions.md#adr-1)'s equivalence proof.
8. A task wants to modify `src/core/openiconic-glyphs.ts` — ADR-1 option C,
   considered and rejected.
9. The jar disagrees with a figure stated here (`rx=34.729` /
   `rx=37.4784`). Measure, report, STOP. Never tune code toward a number the
   jar does not produce.

## Push-forward conditions

- Internal structure inside a new file — helpers, naming, private types — so
  long as the two channels stay structurally separate.
- Complexity-hook friction: apply `#lizard forgives` (place near the function
  END for large functions) or split at ~500 lines. Do NOT edit
  `complexity-ignore`.
- Extra test cases beyond the stated acceptance criteria.
- JSDoc `@see` pointers to Java origins — CLAUDE.md requires them on ported
  symbols. Add without asking.
- **A Java line-number citation here is off.** These came from a jar-verified
  read, but line numbers drift. Follow the code, note the correction in the
  journal, continue. A wrong line number is not a wrong mechanism.
- A task is simpler than scoped — log why in the journal before proceeding.

## Two method rules — these are spec, not preamble

Both were earned by this mission line, at cost. They appear in every task
file and apply to your own plan, not just to what you read.

1. **Trace dependency cascades TWO levels** before ruling on scope or asking
   for a ruling. Three estimates in this line moved materially on the second
   level (1,100→2,300; 3,900→12,100; and a missed class-engine caller). This
   brief's own sizing changed at level two — the handoff's "1,148 lines
   across six classes" became 982 across four once `emoji/UGraphicWithScale`
   and `emoji/ColorResolver` surfaced.
2. **Verify an "already fixed / already wired" claim against the CURRENT call
   graph**, not the commit that introduced the fix. `imgFallbackFont` was
   correct when it landed and dead by the next task.

## Corrections to prior context, already verified

Do not re-derive these; do not trust older statements that contradict them.

- Guard counts are **310 / 22 / 57** — count `ratchet.json` entries, NOT
  directories. Every suite now satisfies `dirs == ratcheted` (svg-class
  310/310, svg-object 22/22, svg-state 57/57, svg-description 48/48), but
  that only became true on 2026-07-30: three empty, untracked directories
  with space-joined names (an unquoted shell variable, e.g.
  `nufoju-44-dabi767 soxufi-98-nita528 …`) were sitting in the golden trees
  and inflated a `find`-based count to 23. They were local litter — git does
  not track empty directories, so a fresh clone always counted 22. **A
  planning pass mistook one for a fixture and "corrected" the true figure
  from 22 to 23**; the litter has since been deleted. If a directory count
  ever disagrees with `ratchet.json` again, the ratchet is right.
- **Zero** of the 389 svg-class/object/state goldens use a sprite (every
  `in.puml` checked for `<$`). Regression guard, not churn set — that is why
  a diff there is a STOP. The ONLY sprite goldens anywhere are the three
  authored for this mission under `svg-description/usecase/`, and those are
  deliberately un-ratcheted (see [ADR-5](decisions.md#adr-5) and T12).
- `UPath.ts` is at `src/core/klimt/shape/UPath.ts` — note the `shape/`.
- `SvgNanoParser.java` is under `svg/parser/`, and `UGraphicWithScale` /
  `ColorResolver` under `emoji/` — **not** `klimt/sprite/`. Reading
  `klimt/sprite/SpriteSvg.java` and generalising from it is exactly what
  produced the second wrong correction. It serves inline `sprite $name {...}`
  blocks these fixtures never touch.
- `AtomImageResolver` is NOT public API (`src/index.ts` exports 9 symbols,
  none of them it, `SpriteSvg`, or `UPath`). No semver break.

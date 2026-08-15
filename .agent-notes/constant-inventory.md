## Observation: the remaining duplicate constants, classified

- **Context**: close-out of `plans/constant-single-owner/`. Baseline was 67
  duplicated names / 114 redundant declarations / 6 name collisions. Final:
  **34 names / 37 redundant declarations / 0 collisions.**
- **Finding**: what remains, and why each is still there. Regenerate with
  `npx tsx scripts/constant-inventory.ts`.

  **Cross-engine (14 names) — need a Java read before any of them moves.**
  Each is a real candidate; none was verified this mission, so none was
  touched. `FONT_SIZE` (files/packetdiag), `LAYOUT_MARGIN`
  (activity/description), `ROOT_LINE_THICKNESS` (core/description, cited),
  `CARDINALITY_FONT_SIZE`, `ENTITY_STROKE_WIDTH`, `NOTE_STROKE_WIDTH`,
  `PORT_LABEL_WIDE_THRESHOLD`, `PORT_TABLE_PAD_FLOOR`, `SCAN_LINE_LIMIT`,
  `SIZE_X`, `STEREO_FONT_SIZE`, `TEXT_INK_BASELINE_DROP`,
  `WEIGHT_BEFORE_MATCH_STEP`, plus `HACK_X_FOR_POLYGON` (known-exception).

  **Intra-engine (20 names) — lower risk, no core owner needed.** json's
  `CELL_MARGIN_X`/`CELL_MARGIN_Y`/`SPOT_RADIUS`; state's `BODY_MARGIN_X`,
  `LINK_NOTE_FOLD`/`HPAD`/`VPAD`, `STATE_BOX_RX`; files' `NOTE_FONT`/
  `NOTE_LINE_H`/`NOTE_PAD`/`PADDING`; packetdiag's `MARGIN_LEFT`/
  `NUMBER_HEIGHT`; board's `CELL_H`; class's `ROW_ICON_ZONE_WIDTH`; core's
  `EPSILON`/`KAPPA`/`REF_U`/`REF_V`.

- **Impact**: the bar was never a removal count — it is "every remaining
  duplicate is one somebody deliberately kept". These 34 are classified but
  NOT individually verified, so the honest status is *triaged, not cleared*.
  A follow-on should take the intra-engine 20 first: same engine, same name,
  same value is far stronger evidence than the cross-engine case, and needs
  no upstream read to be safe.
- **Confidence**: High on the counts and the classification (both
  mechanical). None on the individual verdicts — that is the work left.

## Observation: `HACK_X_FOR_POLYGON` is upstream, and upstream duplicates it too

- **Context**: it was scoped out as a known exception on the assumption that
  our 4 copies were purely our own divergence.
- **Finding**: the name reads like an invented fudge and is not.
  `private final static double HACK_X_FOR_POLYGON = 10;` appears verbatim in
  `klimt/drawing/LimitFinder.java:169` AND `klimt/drawing/AbstractUGraphic
  .java:213` — upstream declares it **twice itself**, privately, in two
  classes, with identical use.
- **Impact**: under this mission's own rule (mirror upstream's declaration
  count) some of our duplication mirrors upstream rather than diverging from
  it. It is still 4 vs 2, so not fully justified, but "delete three of them"
  is the wrong instinct. Retiring it also means changing the ink modules'
  klimt-free convention, since `LimitFinder.ts` keeps it unexported —
  verified real: `class-ink-shapes.ts` imports nothing from klimt.
- **Confidence**: High — read in both Java files.

## Observation: run the inventory AFTER a rename, not only before

- **Context**: batch 4 renamed activity's `RADIUS = 8` to `SPOT_RADIUS`.
- **Finding**: json already had `SPOT_RADIUS = 3`. The rename disarmed one
  collision and armed a new one. The harness caught it on the next run;
  nothing shipped. Renamed again to `CONNECTOR_SPOT_RADIUS`.
- **Impact**: a rename is a new-name introduction and can collide like any
  other. Check the inventory for the name you are about to introduce.
  Separately, `OPALE_MARGIN_X2` was skipped early on the stated grounds that
  "nothing declares it twice" — wrong, two modules did, found the same way.
- **Confidence**: High — both caught by the harness, both fixed.

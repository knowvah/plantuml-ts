# asd-T0 — pre-change activity style census

Mission `activity-style-defaults`, batch 0. Pinned at `2afd01ea`
(branch `feat/activity-style-defaults`), measured 2026-09-08.

Artefacts: `oracle/goldens/svg-activity/style-baseline.json` (the pin),
`tests/oracle/svg-conformance/activity.style-baseline.test.ts` (the gate,
383 assertions).

## Partition — 373 fixtures

| status | count | numbers pinned? |
|---|---|---|
| `baseline` | 268 | yes, both sides |
| `error` (our parser refuses) | 82 | no |
| `jar-error` (golden is the jar's error page) | 23 | no |

Identical to `diff-baseline.json`'s partition, and derived independently:
`jar-error` from the golden's own content via the `PSystemError.java:148-155`
needle, `error` from our render actually throwing. No slug list anywhere.

## Observation: our font-size histogram is one value wide

- **Context**: censusing `font-size` over every `<text>` in the 268
  measurable fixtures, ours vs the committed jar goldens.
- **Finding**: OURS `{14: 1577, 10: 4, 19: 4, 8: 3}` against the JAR's
  `{12: 996, 11: 614, 18: 135, 13: 102, 14: 16, 30: 7, 24: 5, 19: 5, 10: 5,
  4: 11, 8: 7, 16: 3, 20: 2, 40: 2, 6: 2, 7: 2, 5: 1}`. 98.9% of our text
  carries the diagram-wide root default (`plantuml.skin:10`, `FontSize 14`);
  the jar's own 14 accounts for 0.8% of its text. The four non-14 values we
  do emit are not activity elements — they come from the annotation-chrome
  path (title/caption/footer), which resolves its own sizes.
- **Impact**: confirms the mission's premise at corpus scale, not just over
  the 200-fixture window the brief measured. The jar's three dominant values
  — 12 (activity), 11 (diamond + arrow), 18 (swimlane), 13 (note) — are
  exactly the four `plantuml.skin:358-385` / `:308-321` blocks D1/D2 wire.
- **Confidence**: High — pure function of the committed corpus, gated.

## Observation: stroke-width is inverted, not merely different

- **Context**: same census, `stroke-width` over every `<line>`.
- **Finding**: OURS `{1.5: 2503, 1: 199}`; JAR `{1: 2976, 1.5: 224, 2.5: 90,
  0.1: 21, 0.5: 15, 4: 3, 5: 3, 10: 1, (absent): 3}`. We emit `1.5` where
  the jar emits `1` in the overwhelming majority. `activityDiagram { arrow {
  LineThickness 1 } }` (`plantuml.skin:364`) is the direct cause of the
  dominant term; `composite`/`circle end` are where the jar's own `1.5`
  legitimately survives.
- **Impact**: this is the `svg/g[]/line[]/@stroke-width` family the brief
  weighs at 2319 (3.76%). It is a near-total inversion, so the fix direction
  is unambiguous — but the 224 legitimate `1.5`s mean a blanket swap is
  wrong, which is why the per-element cascade and not a constant change is
  the mission's shape.
- **Confidence**: High.

## Observation: `rx` — 929 jar corners against 915 of ours, at the wrong radius

- **Context**: same census, `rx` over every `<rect>`.
- **Finding**: OURS `{8: 915, (absent): 139, 7.5: 2}`; JAR `{12.5: 929,
  (absent): 61, 2.5: 35, 7.5: 2}`. The COUNTS nearly agree (915 vs 929) —
  we round almost the same rects the jar rounds — but the RADIUS never does.
  `12.5` is `RoundCorner 25 / 2` (`plantuml.skin:361`), which is [D4].
- **Impact**: [D4]'s "delete the unsourced `rx="8"`" is a value change, not a
  structural one; the `(absent)` gap (139 vs 61) is the separate residue,
  and the 35 jar `2.5`s are a rounding class we emit nothing for at all.
- **Confidence**: High.

## Observation: `textCount` already differs — 1588 ours vs 1915 jar

- **Context**: pinned so that [D6]'s line-height change (which moves text
  POSITIONS and box heights, not element counts) stays separable from the
  font-size change (which moves the histogram, not the count).
- **Finding**: the two sides are already 327 elements apart before any
  change lands. So `textCount` is NOT a "should converge to zero" quantity
  in this mission — it is a *stability* control: [D6] and the font wiring
  should both leave it approximately where it is, and a large move in it
  means something structural changed that neither task intended.
- **Impact**: read it as a tripwire, not a target. The 327-element gap is
  owned by `activity-embedded-diagram-labels` and the creole families, not
  by this mission.
- **Confidence**: High for the numbers; Medium for the ownership attribution
  (inferred from the filed follow-ons, not re-measured here).

## Observation: zero of 268 fixtures match the jar's canvas today

- **Context**: root `<svg>` `@width`/`@height`, ours vs jar.
- **Finding**: **0 of 268** agree on both. `bakopu-96-pudu086` is 482×382
  against 327×280, matching the brief's spot measurement exactly.
- **Impact**: the canvas is the downstream integrator of every text metric,
  so it is the single most sensitive number in the pin — and with no fixture
  currently at parity, any fixture that *reaches* parity after T3–T6 is
  unambiguous evidence rather than noise.
- **Confidence**: High.

## Note for the tasks that follow

This gate is an **equality** pin, not a ratchet. T3–T6 will each break it by
design. Do not re-pin per task: T7 re-pins once, and the diff of this file is
what the close-out reports. Re-pinning early destroys the attribution the
whole batch-0 exists to buy.

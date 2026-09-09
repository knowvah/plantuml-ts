# asr-T0 — pre-change swimlane census

Mission `activity-swimlane-rendering`, batch 0. Pinned at `d0a7e1bd`
(branch `feat/activity-swimlane-rendering`; source identical to the brief's
baseline `ac03ad31`), measured 2026-09-09.

Artefacts: `oracle/goldens/svg-activity/swimlane-baseline.json` (the pin),
`tests/oracle/svg-conformance/swimlane-census.ts` (the pure instrument,
shared by the gate and the re-pin generator),
`tests/oracle/svg-conformance/activity.swimlane-baseline.test.ts` (the gate,
106 assertions). The generator is a scratch `npx jiti` script that calls
`hasSwimlaneLine` / `layoutFixtureActivity` / `censusOf` / `statusOf` and
writes the manifest; T7 rebuilds it the same way (~50 lines).

## Population — 92 fixtures with a swimlane line

| status | count | numbers pinned? |
|---|---|---|
| `baseline` | 60 | yes, both sides |
| `error` (our parser refuses) | 24 | no |
| `jar-error` (golden is the jar's error page) | 8 | no |

Derived on every run from the sources via a transcription of
`CommandSwimlane.java:59-67`, never a slug list. The needle admits ONE
non-swimlane fixture, `letuke-04-poza319`: its `|= title |` is a two-pipe
creole table row inside a multi-line action. Our AST has 0 lanes, the jar
draws no chrome, and the pin records an empty census for it — harmless and
honest. Lane-count histogram over the 60: `{0: 1, 1: 2, 2: 42, 3: 12, 6: 3}`.

## Totals at the pin

| quantity | OURS | JAR |
|---|---|---|
| dividers | 140 | 195 |
| titles | 140 | 139 |
| band rects | 59 | 57 |
| canvases exactly matching | 0 of 60 | — |

## Observation: the jar draws NO swimlane chrome for a single lane

- **Context**: `bulasi-17-vafa634` and `katopo-68-xajo866` declare one lane.
- **Finding**: the jar emits zero dividers, zero titles and no band for both;
  we emit one divider (at `x=12`, because `lane.x > 0`), one title and a
  band. `Swimlanes#drawU` enters `drawWhenSwimlanes` only when
  `swimlanes().size() > 1` (`Swimlanes.java:253,275`).
- **Impact**: T6 must carry the `> 1` guard; the divider/title/band counts
  for these two fixtures should fall to zero, and that fall is expected, not
  a regression.
- **Confidence**: High — read from the Java, confirmed on both goldens.

## Observation: the jar draws `n + 1` dividers, we draw `n`

- **Context**: totals above. 195 = Σ(laneCount + 1) over the 57 multi-lane
  fixtures; 140 = Σ laneCount over all 59 with a band.
- **Finding**: upstream asserts `dividers.size() == swimlanes().size() + 1`
  (`Swimlanes.java:327`) and draws both outer edges. We draw one per lane
  whose `x > 0`, which — since every lane starts at `baseX = 12` — is every
  lane, and never the right edge.
- **Impact**: the `svg/g[][childCount]` family the exit bar names. T6's
  divider count per multi-lane fixture must rise by exactly one.
- **Confidence**: High.

## Observation: our lanes never start where the jar's do, and 87 of 140 sit on the 120px floor

- **Context**: `lanes` on both sides.
- **Finding**: OURS lane 0 is at `x=12` on all 59 fixtures; the JAR's is at
  `x=20` on 56 and `x=33` on one (`nikinu-06-sace939`, which sets
  `skinparam swimlaneWidth 400`). 87 of our 140 lane widths are exactly
  `SWIMLANE_MIN_WIDTH = 120`; the jar's content-fitted widths range
  `29 … 725.549`.
- **Impact**: T4/T5's target quantities, now individually pinned.
  `swimlaneWidth` is a FIFTH swimlane skinparam the brief does not list;
  upstream reads it as the minimum at `Swimlanes.java:398`
  (`double min = skinParam.swimlaneWidth()`). T1/T4 must decide whether it
  is in scope rather than discover it by a red pin.
- **Confidence**: High for the measurement; the `:398` read is one line —
  T4 reads the whole of `computeSizeInternal` before acting on it.

## Observation: the band height is NOT always the title font size

- **Context**: D2 says port `getTitlesHeight` literally, not the constant.
- **Finding**: jar band heights `{18: 55, 30: 1, 10: 1}`. The 30 is
  `cemipu-87-dinu624` (`TitleFontSize 30`). The 10 is `sikino-19-vuca111`
  with `SwimlaneTitleFontSize 8` — a title at font-size 8 measures 10 high,
  not 8. Ours is 28 everywhere (`SWIMLANE_HEADER_H`).
- **Impact**: concrete evidence for D2 — a port that wrote
  `swimlaneFontSize(theme)` for the band would be wrong on `sikino`. T6
  reads what `calculateDimension` returns for the title `TextBlock` at
  size 8 before writing anything. The mechanism is NOT identified here.
- **Confidence**: High for the numbers; the mechanism is unread.

## Observation: title alignment and band fill differ in kind, not value

- **Finding**: OURS titles are all `text-anchor="middle"`, bold, at the
  root font-size 18; the JAR's 139 titles carry NO `text-anchor` (its
  `CenteredText` computes `x` and draws left-aligned) and are not bold. JAR
  band fill is `none` on 56 and `#EEE` on `vidada-17-xuse810`, which sets
  `skinparam SwimlaneTitleBackgroundColor #EEE`; ours is `#FFF` with a
  border stroke on all 59.
- **Impact**: `SwimlaneTitleBackgroundColor` is the key the jar honours for
  the band fill in the corpus. D4 names the property
  `SwimlaneHeaderBackgroundColor`; T1 must check the upstream alias list
  for that key before deciding which spellings to wire, rather than trust
  either name from the brief.
- **Confidence**: High.

## Observation: a hyperlinked lane title yields three jar title texts

- **Finding**: `nesozi-09-zezu092` declares `|[[www.plantuml.com First
  actor]] |`; the jar's band holds 3 `<text>` for 2 lanes (the link is split
  across elements inside an `<a>`). Ours holds 2.
- **Impact**: a `textCount`-style tripwire for T6: title count is not
  `laneCount` when a title carries creole. Not this mission's defect.
- **Confidence**: High.

## Observation: a naive "tall vertical line" rule over-counts dividers

- **Context**: first cut of the instrument classified any vertical `<line>`
  spanning ≥ 50% of the canvas as a divider: 25 anomalies, including 1 jar
  divider on single-lane fixtures and 5 on two-lane ones.
- **Finding**: long `while`/`repeat` back-edges span more than half the
  canvas. The discriminator that holds is structural: upstream draws every
  divider WITHOUT the title translate every edge is drawn under
  (`Swimlanes.java:342` vs `:338-340`), so a divider's top is the drawing's
  top and no edge can share it. "Top-anchored AND ≥ 50%" leaves the three
  genuine findings above and nothing else.
- **Impact**: reinforces `measurement-artifacts-outnumber-defects`: 22 of
  the 25 first-cut anomalies were the instrument.
- **Confidence**: High.

## Note for the tasks that follow

This gate is an **equality** pin, not a ratchet. T3–T6 each break it by
design. Do not re-pin per task: T7 re-pins once, and the diff of this file
is what the close-out reports.

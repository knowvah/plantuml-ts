# amb-T0 — pre-change activity text census

Mission `activity-min-box-width`, batch 0. Pinned on branch
`feat/activity-min-box-width` (source identical to the brief's baseline
`8aad71eb`), measured 2026-09-09. Aggregate probe at the pin: 48291 -> 48291,
0 risers, 0 fallers.

Artefacts: `oracle/goldens/svg-activity/text-baseline.json` (the pin),
`tests/oracle/svg-conformance/text-census.ts` (the pure instrument, shared
by the gate and the re-pin generator),
`tests/oracle/svg-conformance/activity.text-baseline.test.ts` (the gate,
387 assertions). The generator is a scratch `npx jiti` script that calls
`statusOf` / `censusOf` over every committed fixture and cross-checks the
derived partition against `diff-baseline.json`; T6 extends the previous
mission's `repin-activity.ts` with the same three calls.

## Population — 373 committed fixtures, 0 partition mismatches

| status | count | numbers pinned? |
|---|---|---|
| `baseline` | 268 | yes, both sides |
| `error` (our parser refuses) | 82 | no |
| `jar-error` (golden is the jar's error page) | 23 | no |

## Totals at the pin (summed over the 268 baseline fixtures)

| quantity | OURS | JAR |
|---|---|---|
| `textCount` | 1586 | 1915 |
| `fill` | `#181818` 1423 · `#000` 152 · `#888` 4 · `#F00` 4 · `#FFF` 3 | `#000` 1869 · `#F00` 24 · `#FFF` 8 · `#00F` 7 · `#888` 4 · `#008000` 2 · `#FF0` 1 |
| `anchor` | `middle` 1133 · `start` 249 · `(absent)` 204 | `(absent)` 1915 |
| `inset` | `60` 779 · `10` 40 · `60.001` 7 · 71 other keys (843 total) | `10` 914 · `20` 6 · `10.001` 4 · `5` 2 · `7` 2 · `70.338` 1 · `67.975` 1 (930 total) |

## Observation: 779 of our 843 boxed texts sit at inset 60 — half the 120 floor

- **Context**: the `inset` histogram, OURS.
- **Finding**: `60` is exactly `ACTION_MIN_WIDTH / 2`: a centre-anchored text
  in a floored box. The 64 others are boxes wider than the floor (inset =
  width/2, 71 distinct keys) plus 40 at `10` (multi-line action labels drawn
  `text-anchor="start"` at `rect.x + padding`, `activity-renderer-shapes.ts:250`).
  The jar's 914 at `10` are the box `Padding 10` (`plantuml.skin:360`); its
  `20` and `5`/`7` are fixtures that set their own padding.
- **Impact**: T2 (floor) moves OUR inset from `60` to `width/2` on 779 texts
  WITHOUT touching the anchor; T5 then moves it to `10`. The two are
  separable in this histogram and nowhere else.
- **Confidence**: High.

## Observation: our `start` anchors are the multi-line and note sites, not the box

- **Finding**: the 249 `start` anchors are multi-line action labels
  (`:250`, `:265`), note text (`:319`, `:325`) and the connector label
  (`:499`). The 1133 `middle` are single-line action labels (`:112`, via
  `renderMultilineText`), diamond labels (`:300`) and edge labels
  (`renderer.ts:92`). The 204 `(absent)` are swimlane titles (positioned
  by x since `activity-swimlane-rendering` T6), the `g.title`/`g.legend`/
  `g.header`/`g.footer` chrome, and 44 note-body texts.
- **Impact**: T5's eight sites are exactly these; the swimlane title and
  the chrome groups are already anchor-free and must not be touched.
- **Confidence**: High — every site line number read this session.

## Observation: 152 of our texts are already `#000`

- **Finding**: swimlane titles (`swimlaneTitleFontColor`, 134), the
  `g.title` chrome (14) and `g.legend` (4). Every activity-renderer text
  (`#181818`, 1423) is `theme.colors.text`. The jar's 46 non-black texts
  are 24 `#F00`, 8 `#FFF`, 7 `#00F` (link text inside `<a>`), 4 `#888`
  (header/footer), 2 `#008000`, 1 `#FF0` — all from explicit
  `FontColor`/creole colour in the source, none from a block default.
- **Impact**: T4's cascade must resolve the explicit colours the source
  sets (`skinparam activityFontColor`, `<style>`, creole `<color>`), not
  only swap the constant; the 24 `#F00` on `loxija`/`dozaxu`/`sikino` are
  the check.
- **Confidence**: High.

## Observation: the jar draws 329 more texts than we do (1915 vs 1586)

- **Finding**: a pre-existing count gap the style census already pins as
  `textCount`; the jar's `prev=text` texts (518) are creole runs split
  across `<text>` elements, ours fuse them.
- **Impact**: none of T2-T5 may move `textCount` — the tripwire — and the
  gap itself is out of this mission's scope.
- **Confidence**: High for the count; the split mechanism is unread.

## Note for the tasks that follow

This gate is an **equality** pin, not a ratchet. T2, T4 and T5 each break it
by design (T2 OUR `inset`; T4 `fill`; T5 `anchor` and `inset`); T3 must NOT
move it. Do not re-pin per task: T6 re-pins once, and the diff of this file
is what the close-out reports.

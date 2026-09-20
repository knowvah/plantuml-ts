## Observation: `.puml` lane text is not reliable evidence for lane-crossing

- **Context**: classifying the 22 rows by which loop connector class each
  reaches on a cross-lane edge (`while-back`/`repeat-out`/`simple1`/
  `simple2`/`complex1`/`none`).
- **Finding**: reading the `.puml` source and reasoning about where a
  `|lane|` tag sits relative to `while`/`repeat`/`endwhile`/`repeat while`
  gives the wrong answer for `judatu-15-xize591`, `gesogi-81-xoma900`,
  `bulasi-17-vafa634` and `tobajo-64-mipi810` — all four LOOK cross-lane
  from the text (multiple `|lane|` tags present) but are same-lane at the
  walker level once you read the actual `bodyOutLane`/`headerInLane` (or
  `conditionOutLane`/`entryInLane`) values the frame carries. Confirmed by
  a temporary `ALLT_TRACE` env-gated `console.error` at
  `walk-while-branch.ts:185` (the `pushWhileBack` main-branch call) and
  `walk-repeat.ts:240,345` (`pushRepeatOut`/`pushRepeatBack`), reverted
  before commit — `git diff` on `src/` is empty. Do not classify a row from
  the `.puml` text alone; instrument the actual lane variables.
- **Impact**: three of the filing's own representative claims were wrong
  (re-filed in `next-missions.md`). Saves a future task from porting a
  translate shape for a row that never reaches it.
- **Confidence**: High (direct instrumentation of the exact lane variables
  `routeEdge` consumes, cross-checked against `--align`/`--dump`).

## Observation: `bulasi-17-vafa634` has only one declared swimlane

- **Context**: same classification pass.
- **Finding**: `bulasi` declares exactly one `|Swimlane 1|` and never a
  second lane. `Swimlanes.java:352`'s `if (swimlanes().size() > 1)` gate
  means `drawWhenSwimlanes`/`Cross` never run for it — the jar takes the
  single-lane `TextBlockInterceptorUDrawable` path (`Swimlanes.java:237-
  260`'s `else` branch). Its 29/42 align residual cannot be a lane-translate
  defect by construction.
- **Impact**: `fixtures.md`'s "lane lines: 1" column already hinted at this
  (vs. the 0-line D8 rows) but the filing still listed it as a "both
  builders" candidate; corrected.
- **Confidence**: High (`Swimlanes.java:352` read directly; `.puml` has one
  `|...|` line).

## Observation: `FtileRepeat.ConnectionOut` crosses lanes independently of `backConnection`

- **Context**: reading `walk-repeat.ts`'s `pushRepeatOut`/`pushRepeatBack`
  and instrumenting both.
- **Finding**: `selectRepeatBackConnection` (`tile-layout.ts:164-168`)
  picks `'complex1'` exactly when `swimlane !== swimlaneOut` (the repeat's
  own entry/exit lanes differ) and `'simple1'`/`'simple2'` otherwise. But
  `pushRepeatOut`'s own lane pair (`bodyOutLane`, `conditionInLane`) is a
  DIFFERENT pair — the body's own exit lane vs. the condition hexagon's own
  lane — and can differ even when the repeat's overall back-connection
  resolves to same-lane `simple1`. Confirmed on `rujuxa-07-neco067`
  (`bodyOutLane=L2`, `conditionInLane=L1`, `backConnection=simple1`,
  same-lane) and `megara-21-rumi574` (`bodyOutLane=Actor 3`,
  `conditionInLane=Actor 1`, `backConnection=simple1`). `becanu-19-diti597`
  reaches BOTH: `complex1` back AND a cross-lane `repeat-out`.
- **Impact**: a row can carry two independent translate residuals from one
  `repeat`; T3 must not assume `repeat-out` only appears alongside
  `complex1`.
- **Confidence**: High (direct instrumentation of both lane pairs on all 16
  repeat-bearing rows).

## Observation: D5's non-translatable cross-lane outcome is DROPPED, and unreachable by our port's `while`

- **Context**: task step 4, reading `UGraphicInterceptorOneSwimlane.java`
  (whole file) and `Swimlanes.java:318-356`.
- **Finding**: `drawWhenSwimlanes` (`Swimlanes.java:318-356`) does two
  passes. Pass 1, per lane: `full.drawU(new
  UGraphicInterceptorOneSwimlane(...))` (`:342-343`); that class's
  `draw(Connection)` case (`:92-104`) only calls `connection.drawU(this)`
  when `contained1 && contained2` (`:96-101`), i.e. the CURRENT swimlane
  equals BOTH `tile1.getSwimlaneOut()` and `tile2.getSwimlaneIn()` (or one
  side is null). For a true cross-lane connection (both non-null, unequal)
  no swimlane in the ordered list satisfies both conditions, so pass 1
  draws it in NO lane. Pass 2, `Cross.draw` (`:185-206`): when
  `tile1.getSwimlaneOut() != tile2.getSwimlaneIn()`
  (`:196-199`), wraps in `ConnectionCross` and calls `drawU`; that method
  (`ftile/ConnectionCross.java:49-65`) does nothing at all when the
  connection is not `instanceof ConnectionTranslatable` (`:50`, no `else`
  branch). Net: a non-translatable cross-lane connection is drawn in
  NEITHER pass — DROPPED entirely. This is D5's second named outcome, not
  a third; no stop 9.
  Separately: our port's own `FtileWhile.ConnectionBackEmpty`/
  `ConnectionOut` (`pushWhileBack`'s empty-body branch,
  `walk-while-branch.ts:172-176`, and `pushWhileOut`, `:203-215`) both pass
  the SAME lane variable (`headerOutLane`) as both `lane1` and `lane2` —
  structurally these can never be cross-lane in our walker, matching the
  jar (both connectors run header-to-itself). No baseline row exercises
  D5's drop outcome; confirmed by grepping all 268 baseline `.puml` files
  for a `while` with an empty body under swimlanes — none exists.
- **Impact**: D5 is answered (dropped) but currently unreachable/inert for
  `while` in this corpus; a future `'not-translatable'` tag (per D5's own
  decision text) has no fixture to validate against today.
- **Confidence**: High (both Java files read in full, line-cited above;
  corpus-wide grep for the empty-body pattern came back empty).

## Observation: zero break rows overlap the 22 lane-translate rows (D9)

- **Context**: task step 5, the D9 ride-along gate.
- **Finding**: grepped ALL 268 baseline `.puml` fixtures (not only the 5
  `activity-repeat-break-welding` + 9 `activity-gtile-break-size` named
  rows) for `break` co-occurring with a `|lane|` declaration in the same
  file: zero matches. No break row shares a slug name or a connector class
  with any of the 22 classified rows.
- **Impact**: T5 struck (D9) — no ride-along needed.
- **Confidence**: High (exhaustive grep over the full baseline manifest,
  not a sample).

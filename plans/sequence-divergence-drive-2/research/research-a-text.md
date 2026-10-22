## Text-position-only family: 83 rows, not 80

The family has 83 rows: 29 with only x diffs, 51 with x and y, and 3 more whose paths are `g/a/text/@x|@y`. Those 3 are actors with URLs: boparo-11, kuzoba-85, lunasu-43. Every diff in every row is assigned to exactly one of the 5 mechanisms below (3 of which split exo into E1/E2/E3). There are no unexplained rows.

Scratch files are in `/private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/22654321-fb13-42ce-aa81-e8c390d76578/scratchpad/research-a/`:
- `dump.tsv` lists every diff with its delta and jar text.
- `fam.json` holds the rows.

### 1. STICK — name of actor / boundary / control / entity / database

| field | value |
|---|---|
| rows | 54 (49 STICK-only + 5 that also need BADGE) |
| examples | balixa-47, cusiru-97, kibave-01 (all 5 kinds), kedipo-05, dudeku-78, rujetu-45, doleso-00, boparo-11 / kuzoba-85 / lunasu-43 (the `g/a` rows) |
| element | the participant label rows (name and «stereo») of the stick-kind participants, at head and tail |
| delta | x is ours +3 on every row. y is head ∓, tail ±, with size `T/2 − 11` where T is the label block height: −4 for one line (14), +3 for stereo+name (28), +6.5 for a 21pt stereo+name (kedipo) |
| upstream | `ComponentRoseActor.java:60` (padding `topRightBottomLeft(0,3,0,3)`), `:75` (head: text drawn at `(getTextMiddlePostion, dimStickman.getHeight())`), `:78` (tail: text drawn at dy 0), `:85` (`(prefW − getTextWidth)/2`), `:91` (component height = stick height + text height). `AbstractTextualComponent.java:107` (text width = pure + X1 + X2), `:113` (text height = block + top + bottom = block). Boundary/Control/Entity/Database have the same body: `ComponentRoseBoundary.java:76,79`, `ComponentRoseControl.java:77,80`, `ComponentRoseEntity.java:77,80`, `ComponentRoseDatabase.java:82,85` |
| port | x: `sequence-layout-participant-label.ts:276-280` (`nameCenterX` returns `p.centerX` for stick kinds). y: `sequence-layout-participant-sizing.ts:191-192` (`labelYOffset = fontSize/2 + 4*k`, a constant with no upstream citation) |
| mechanism | **x:** upstream starts the block at `(prefW − (pure+6))/2`, so the block centre is at component centre −3. The port centres on `centerX`. **y:** upstream puts the block top at bottom − T (head) or top + 0 (tail), so the centre is offset by T/2. The port uses `fontSize/2 + 4` |
| arithmetic (balixa "Alice") | Stick width = 13·2 + 2·0.5 = 27. Stick height = 16 + 27 + 15 + 1 + 0 + 1 = 60 (`ActorStickMan.java:121`). prefW = max(27, 30.45 + 6) = 36.45. Component x = 98.156 − 18.225 = 79.931, so text x = 79.931 + 0 = 79.931, which is the jar value; ours is 82.931. Head: component y = 10, so text top = 70 and baseline = 70 + 10.889 = 80.889, the jar value. Ours: cy = 84 − 7 − 4 = 73, giving baseline 76.889 |
| rows to zero | 49 alone, 54 together with BADGE |
| write-set | `sequence-layout-participant-label.ts` (`nameCenterX`; `buildLabelRuns` :324 passes the block height), `sequence-layout-participant-sizing.ts` (`participantLabelCy` :177-193 and `ParticipantLabelMetrics` :137-144 take the block height instead of `fontSize/2+4`), `renderer-participant-shapes.ts` :185/:202-203 (the tail `dy` reads the same function, so it needs the same block height). This probably also needs a block-height field on `ParticipantGeo` (`geo-participant.ts`) |

### 2. EXO — label of a border (`[`/`]`) message, in `exoLabelLeft`

Three confirmed sub-mechanisms, all in one file.

| field | value |
|---|---|
| rows | 18: bacupi-77, jotase-88, dojapu-42, jebole-52, kapuva-33, kugati-67, momuxe-95, nanoza-23, zofeda-77, fonope-49, gogise-40, kevavu-57, domaji-70, kivavu-72, bozuru-10, texoze-85, lozuru-10, gejeji-12 |
| element | the message label text of an exo message |
| delta | Built from −6 (E1; +6 on the right border), −10 (E2) and −3.575 (E3) |
| **E1 upstream** | `CommunicationExoTile.java:122-124`: `textDeltaX = point1 − x1` with x1 = border1 (`point2 − x2` on the right). This is computed **before** the circle insets at `:137-147` (`diamCircle/2 + 2 = 6`) |
| **E1 port** | `sequence-layout-exo.ts:208-209` applies the insets inside `exoSpan`. Then `:223` computes textDeltaX from the inset ends, so left-border circles lose 6. On the right border the provisional `x2 = point2 − 6` gives +6 where upstream gives max(0, point2 − border2) = 0 |
| **E1 arithmetic** | dojapu `[o<-o`: upstream label = x1+6 + 7 + 10 + (point1 − x1) = point1 + 23; port = point1 + 17. That is −6, matching 52.937 vs 46.937 |
| **E2 upstream** | `ComponentRoseArrow.java:174-177` adds `getArrowDeltaX()` (10) when the direction is RIGHT_TO_LEFT_REVERSE **or BOTH_DIRECTION**. Direction comes from `ArrowConfiguration.java:181-192`, applied to the config that `CommunicationExoTile.java:103-104` reverses when direction is −1. The base config is `withDirectionBoth` or `withDirectionNormal` (`CommandExoArrowAny.java:88-89`, `ArrowConfiguration.java:88-98`), and `x` sets `withHead1(CROSSX)` (`CommandExoArrowAny.java:111-130`) |
| **E2 port** | `sequence-layout-exo.ts:224`: `reverseHead = getDirection(type) === -1 ? 10 : 0`. It misses direction +1 with a head on dressing1: `[<->`, `[x<->x`, `x->]` |
| **E2 arithmetic** | gogise `[<->`: 43.763 + 10 = 53.763 (jar) |
| **E3 upstream** | `Display.java:308-310`: `getWithNewlines` collapses `\\` to `\`. The label's preferred width (which sets `point1 = posC − width`) comes from that block |
| **E3 port** | `sequence-layout-exo.ts:138` measures `event.label.split('\n')` raw, while drawing uses `displayLines` (`text-block-geo.ts:378`). The width is too large by one `\`, so point1 is too far left |
| **E3 arithmetic** | DeterministicMeasurer width of `\` in monospace 13 = 3.575. lozuru `[o\\-` = −6 −3.575 = −9.575 |
| rows to zero | E1 alone 9; E2 alone 3; E3 alone 2. E1+E2 needed: bozuru, texoze. E1+E3: lozuru. All three: gejeji. Fixing all three together zeroes 18 |
| write-set | `sequence-layout-exo.ts` only: `labelBlockWidth` :127-141 (use `displayLines`); `exoSpan` :208-210 (keep the pre-inset x1/x2); `exoLabelLeft` :221-226 (textDeltaX from the pre-inset ends; head clearance from the reversed config's arrow direction) |

### 3. ALIGN — message label with a non-LEFT `SequenceMessageAlign` or arrow-style `HorizontalAlignment`

| field | value |
|---|---|
| rows | 8: cexelu-68, dokuse-50, jatase-07 (right), dopuko-30 (center), nizoxo-38, kemaba-15 (direction), sizumo-60 (first), vuvuge-45 (reverseDirection) |
| element | message labels, including the alignment of each row inside the block |
| delta | −5 to −279 (ours is always at the LEFT position, 36.469 / 46.469) |
| upstream | `Rose.java:299-336` resolves messagePosition from the `root/element/sequenceDiagram/arrow` merged style string, including first / direction / reversedirection. `ComponentRoseArrow.java:166-172` handles CENTER: `(W − abs(textDeltaX) − tw)/2`; RIGHT: `W − abs(textDeltaX) − tw − padX2 − (L2R_NORMAL ? 10 : 0)`. Rows sit inside the block by the style's alignment (`AbstractTextualComponent.java:81,89-92`). `right:right` becomes `right` at `FromSkinparamToStyle.java:321` (already ported, `FromSkinparamToStyle.ts:411`) |
| port | `sequence-layout-message.ts:186-197` (`labelLeftOf` implements only the LEFT branch). `text-block-geo.ts:366+` (`messageLabelBlock` left-aligns every row) |
| arithmetic | cexelu: W = 188.619 + 2 − 29.469 = 161.15. textPos = 161.15 − 119.113 − 7 − 10 = 25.037, so x = 54.506 (jar row 2). Row 1, right-aligned: 54.506 + 119.113 − 25.269 = 148.35 (jar). sizumo a2 (L2R, RIGHT): 54.756 − 14.462 − 7 − 10 + 34.15 = 57.444 (jar). b1 (R2L): 67.444 (jar) |
| rows to zero | 8 |
| write-set | `sequence-arrow-paint.ts` (messagePosition per Rose:299-336), `sequence-layout-message.ts` (`labelLeftOf` and the arrow width), `text-block-geo.ts` (row alignment in `messageLabelBlock`). Mirror the CENTER/RIGHT branches in `sequence-layout-exo.ts` `exoLabelLeft`, which shares `ComponentRoseArrow`. The port's left/right encoding of direction differs from upstream's (see the comment at `sequence-layout-message.ts:165-180`), so direction/first must be mapped from geometry, not from `dressing1`. Unconfirmed: multi-line rows under direction/first/reversedirection (no fixture has one) |

### 4. BADGE — name rows beside a sprite or char badge (`TextBlockSprited`)

| field | value |
|---|---|
| rows | 5: birocu-87, favale-68, peciku-06, xediki-78 (+18), cexeco-21 (+25). All 5 also have STICK diffs (on "User") |
| element | the «stereo» and name rows of a `participant` with a `<<($sprite,…)>>` badge |
| delta | y +18 / +25, at head and tail |
| upstream | `TextBlockSprited.java:62`: block height = max(sprite height, label height). `:76`: the label is drawn at dx only, so rows start at the **block top**. The block is created at `Display.java:687` |
| port | `sequence-layout-participant-label.ts:326`: `top = cy − Σrows/2` centres the rows on the block centre |
| arithmetic | birocu: box y = 10, padTop = 7, so block top = 17 and «APIGateway» baseline = 17 + 10.889 = 27.889 (jar). Ours: cy = 17 + 64/2 = 49, top = 49 − 14 = 35, baseline 45.889 (+18). cexeco has the single row: 49 − 7 = 42, so +25 |
| rows to zero | 0 alone, 5 together with STICK |
| write-set | `sequence-layout-participant-label.ts` `buildLabelRuns`: when `p.badge` is set, `top = cy − max(badge.height, Σrows)/2`. `renderBadge` keeps cy unchanged |

Outside the family, the char-badge rows nimoxu-60 (+4) and fakova-98 (+2) show the same y pattern. They have other diffs too.

### 5. QUEUE — queue name

| field | value |
|---|---|
| rows | 3: butofu-60, pumula-71, sudugu-16 |
| element | the queue participant's label rows (stereo included), at head and tail |
| delta | x is ours +5 |
| upstream | `ComponentRoseQueue.java:67` (label = `asSmall` label), `:77` (delta = 0). `USymbolQueue.java:130-131` gives `Margin(5,15,5,5)`; `:147` draws the label at `margin.getX1()` (5). The Margin constructor is (x1, x2, y1, y2) at `USymbol.java:60-65`. The glyph width is block + 20, so the label centre is at component centre −5 |
| port | `sequence-layout-participant-label.ts:276-277` (`nameCenterX` returns `p.centerX` for queue) |
| arithmetic | butofu "bar": jar 87.687 = componentX + 5, so componentX = 82.687. Glyph centre = 82.687 + 10 + w/2. Ours draws centred, which is 5 to the right |
| rows to zero | 3 |
| write-set | `sequence-layout-participant-label.ts` `nameCenterX` only |

### Risk to the 419 pinned fixtures

I grepped all 423 dirs under `oracle/goldens/svg-sequence/*/in.puml`:
- **STICK, QUEUE, BADGE:** no pinned fixture declares an actor, boundary, control, entity, database or queue. The 7 hits were `actor -> director`, which makes an implicit participant, and `actor {` style blocks. None has a `<<(` badge and none uses `!theme`. Zero exposure as long as each fix is gated on participant type or badge.
- **ALIGN:** the only pinned fixture with align is sevicu-84, and it is explicitly `left`. The LEFT path must stay byte-identical.
- **EXO, E1:** pinned mocuna-66 has border circles but no labels, so no text is affected.
- **EXO, E2:** for direction −1 the new rule still gives +10, because upstream's dressing2 always has a head. That keeps necofe-81, dugata-50 and the other pinned direction −1 exo fixtures unchanged. No pinned fixture has a direction +1 exo message with a head on dressing1.
- **EXO, E3:** `displayLines` leaves a single `\` unchanged; I verified that `[\-o` gives `[\-o`. That keeps the pinned kopaxi and jitesa fixtures unchanged.

Scope outside this family (non-zero rows across the corpus, of 722): 125 contain a stick kind, 4 a queue, 10 an align setting, 11 a badge.

### Ranked by rows-to-zero

1. STICK: 49 (54 together with BADGE)
2. EXO, as one fix to E1+E2+E3 in `sequence-layout-exo.ts`: 18. Each alone gives E1 9, E2 3, E3 2.
3. ALIGN: 8
4. BADGE: 5, but only together with STICK (0 alone)
5. QUEUE: 3

STICK + EXO + ALIGN + BADGE + QUEUE = 83 of 83.

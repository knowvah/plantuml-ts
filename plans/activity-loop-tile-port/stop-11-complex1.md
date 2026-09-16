# Stop 11 filing — `ConnectionBackComplex1` is reachable from six baseline fixtures

Filed 2026-09-16 during Batch 2 (before T6 could trigger it).

## Finding

D5 and the README's "does NOT do" list assumed `ConnectionBackComplex1`
(`ftile/vcompact/FtileRepeat.java:333-404`) was a cross-lane corner no
baseline fixture reaches. Parsing the 43 repeat rows with our parser
(`ActivityRepeat.swimlane` = lane at `repeat`, `swimlaneOut` = lane at
`repeat while`, the same pair `InstructionRepeat.java:51,194-196` stores)
finds six where they differ, which `FtileRepeat.java:186-199` routes to
`Complex1`:

| slug | swimlane | swimlaneOut |
|---|---|---|
| `becanu-19-diti597` | col1 | col2 |
| `givanu-33-kire967` | col1 | col2 |
| `kasadu-53-tuki533` | Author | Reviewer |
| `kudedo-31-pafi082` | Lane2 | Lane1 |
| `mafete-03-rapa918` | Swimlane1 | Swimlane2 |
| `manata-12-rido730` | actorA | actorC |

T6 as specified ("throw a named error for Complex1") would fail to render
six baseline fixtures, so T6 cannot be executed as written.

## Size of the missing port

`ConnectionBackComplex1` is ~70 lines: `drawSnake` (`:364-402`) computes
`y1 = d2.y + d2.h/2`, `y2 = d1.y + d1.h/2`, `x1_a = d2.x + d2.w`,
`x1_b = d2.x + d2.w/2 + repeat.w/2 + 12`, then ONE of two snakes:
`x2 < x1_a` -> `asToLeft`, `emphasize UP`, points `(x1_a,y1) ->
(x1_b|x1_a+10, y1) -> (same x, y2) -> (d1.x + d1.w, y2)`; else
`asToRight`, `emphasize UP`, `(x1_a,y1) -> (middle,y1) -> (middle,y2) ->
(d1.x, y2)` with `middle = x1_a/4 + x2*3/4`. The `drawTranslate` variant
(`:356-362`) applies the two lane translates to `p1`/`p2` first, as
`ConnectionIn` does. It is not "genuinely large"; the deferral premise was
reachability, which is now disproved.

## Options for the human (D5 is locked; stop 3)

1. Amend D5 + the README scope: T6 ports `Complex1` alongside `Simple1`/
   `Simple2` (recommended -- ~70 lines, same shape as the other two, and
   six fixtures otherwise keep a knowingly wrong back edge).
2. Keep the scope: T6 draws `Simple1`/`Simple2` for the 37 same-lane
   repeats and leaves the awrl-era left-side route for the six, journaled
   as a known divergence, with `activity-repeat-complex-back` filed.
3. Halt the mission at T5 and re-plan Batch 3.

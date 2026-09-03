# T4 (linetype-ortho-routing) — measured result exceeds the hand-computed prediction

- **Context**: T4 forwarded `theme.linetype` onto `DotInputGraph` at state's
  three assembly sites (`buildDotGraph`, `runPass`, `buildTopLevelPass`).
  The task brief predicted `pavuzo-79-zodu430` scope 2/width/index 2 would
  land at ~0.002 px delta (from a hand-computed `ink 108.164568 + 35 =
  143.164568 px` estimate against the jar's `1.988368 in`).
- **Finding**: measured with `scripts/measure-composite-declared-size.ts`,
  the actual result is an EXACT match — `ours: 1.988368`, `jar: 1.988368`,
  `deltaPx: 0`, `match: true`. `kejabo-83-vinu490` (polyline, no prediction
  on record) also landed exact: `deltaPx: 0`. 11 of 12 declarations across
  both fixtures are now exact; the 12th (`kejabo` scope 2/height/index 2) is
  a pre-existing `-0.000072` px last-digit rounding artifact the harness
  itself documents as unrelated noise (`isLastDigit`, not this mission's
  concern).
- **Impact**: the ~0.002 px prediction was a napkin estimate (measured text
  ink + a fixed margin, by hand) rather than a run of the actual layout
  code; the real computation carries full precision and converges exactly.
  Do not treat a "materially different" measured result as automatically
  suspect — check whether it is *better* in the same direction (closer to
  zero, same sign of correction) before treating it as a mechanism
  mismatch. Here it was the same fix, more precisely computed.
- **Confidence**: High (both fixtures independently measured, script output
  captured verbatim).

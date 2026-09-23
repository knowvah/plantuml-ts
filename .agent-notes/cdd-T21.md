# cdd-T21 — stereotype-spot badges (A5 M3a/M3b)

## Observation: M3b's mechanism is `LeafType.ENTITY` sharing `ENUM`'s own
letter upstream, not a missing case anyone had to guess at

- **Context**: task step 2 — read `EntityImageClassHeader#getCircledChar`
  (`svek/image/EntityImageClassHeader.java:229-260`) before touching
  `class-badge.ts#badgeLetter`.
- **Finding**: the Java switch has `case ENTITY: return 'E';` two lines
  below `case ENUM: return 'E';` (`:239-242`) — the SAME letter, not a new
  glyph. This port's `badgeLetter` had no `'entity'` case at all, so it fell
  to `default: return 'C'`. Jar-verified against
  `xidura-26-teki974/in.svg`'s `ENTITY` classifier badge
  (`<path d="M379.614,137.5 L371.895,137.5 ...">`, cx=376/cy=131): after
  translating by `(376-22, 131-23) = (354, 108)`, that path is byte-identical
  to this table's pre-existing `E` entry. Fix: one `case 'entity': return
  'E';` arm in `badgeLetter` (`src/diagrams/class/class-badge.ts`).
- **Impact**: fixed all 3 of M3b's reach list (`lilura-67-cati343`,
  `tepazu-23-zapo261`, `xidura-26-teki974` — each has `entity ENTITY` with
  no spot override) to `pass=true structural=0 numeric=0` on
  `render-diff.mts`.
- **Confidence**: High (byte-exact match against real oracle bytes, verified
  via a throwaway `jiti` script calling the real `badgeGlyphPath`, not a
  reimplementation).

## Observation: 8 new letters, one fixture each, all round-trip byte-exact

- **Context**: task step 3 — scrape R/J/O/W/D/Q/S/X from the A5 16-fixture
  reach list (`diagnosis/A5-geometry.md` M3a).
- **Finding**: each letter's source fixture + declaring classifier:
  - R — `vegubu-29-bomu147`, `class Conformance << (R, #FF7700) Resource >>`
  - J — `dacisu-77-paca840`, `class BluetoothRetransmitter << (J,orchid) >>`
  - O — `gamevo-26-runo973`, `class osgGroup << OSG >>` (`!define OSG
    (O,lightblue)`) — the sibling `!define QW (W,orange)` in the SAME
    fixture is declared but never used by any classifier (grep confirms no
    `QW` reference in the fixture body), so W had to come from a different
    fixture.
  - W — `befasi-62-vimu310`, `class EWSMainWindow <<(W,orange)>>` — this
    fixture ALSO has 4 `<<(Q,orchid)>>` classes (lines 49-52), so it doubles
    as the Q source too.
  - D — `jikase-93-tipa633`, ``Class foo2 <<(D,orange)ABC>>``
  - Q — `befasi-62-vimu310`, `class WaveMedium <<(Q,orchid)>>`
  - S — `bejeli-39-sina124`, `class NamedStereotype <<(S,#FF7700)Stereotype>>`
  - X — `rideze-59-lizu265`, `class Dwelling <<(X,#FF7700)>>`
  Each raw `d` was read directly from the fixture's cached `in.svg`
  (`<ellipse cx cy>` + sibling `<path d>`), translated to the table's shared
  reference center `(22, 23)` by subtracting `(cx-22, cy-23)` from every
  coordinate (alternating x/y), then verified to round-trip byte-exact back
  through the REAL `badgeGlyphPath(kind, cx, cy, letter)` (not a
  reimplementation) for all 8 letters before being committed to
  `class-badge-glyph-data.ts`.
- **Impact**: `dacisu-77-paca840` (J), `jikase-93-tipa633` (D),
  `lilura-67-cati343`/`tepazu-23-zapo261`/`xidura-26-teki974` (M3b, E) all
  reach `conformant`/`structural=0,numeric=0` post-fix. `bejeli-39-sina124`
  (S) drops to `structural=0` (only its PRE-EXISTING, unrelated
  `svg/@height` Δ1 numeric diff remains — present in the t18 baseline too,
  not introduced here).
- **Confidence**: High.

## Observation: fixing a structural mismatch can RAISE a fixture's `numeric`
count even though nothing regressed — `compareNodes`'s own documented
short-circuit, not a new bug

- **Context**: `pin-diff t18.json t21.json` flagged 12 fixtures as
  `verdict: diverged -> structural-match, diff count rose <N> -> <M>` (e.g.
  `befasi-62-vimu310` 624->818, `gamevo-26-runo973` 13->452). Per
  `diagnosis.md`, read the mechanism before accepting the rise.
- **Finding**: `tests/oracle/svg-conformance/compare.ts:150-178`'s own doc
  comment (D5, `plans/sequence-root-chrome/decisions.md`): `compareNodes`
  returns early on a childCount/tag mismatch and charges exactly ONE diff
  for the whole skipped subtree, "however large" it is. Before this task, a
  Q/W/S/R/O/J/D/X-letter classifier's badge drew the wrong LETTER SHAPE (a
  `C`-curve outline with a different path-command count than the jar's
  outline), so `compareNodes` short-circuited on that one `<path>` and
  charged 1 structural diff, never descending to compare its individual
  coordinates. Now that the shape matches, `compareNodes` descends and
  reports every individual numeric coordinate that still differs — which,
  for a MULTI-classifier fixture with several same-letter badges (e.g.
  `befasi-62-vimu310`'s 3 W's + 4 Q's), can be dozens of numeric lines per
  classifier. Traced one instance directly (`gamevo-26-runo973`'s
  `QObject` badge, `g[1]/g[4]/path[1]/@d`): deltas of 0.02-1.57px, NOT a
  uniform translation (ruling out a bug in this task's own translate math,
  which would shift every coordinate by the same `dx`/`dy`) — consistent
  with a pre-existing, unrelated node-position precision divergence for
  that classifier, now exposed rather than introduced.
- **Impact**: every "rose" fixture's `structural` count DROPPED (badge
  shape mismatches fixed) and none was `conformant` in `t18.json`
  beforehand — no t18-conformant fixture lost conformance (the mission's
  stop condition). The raised `numeric` sums are real, PRE-EXISTING
  per-coordinate divergences for OTHER same-letter classifiers in those
  fixtures, now visible instead of masked — out of this task's write-set
  (layout/node-position code, not `class-badge.ts`). Left unfixed,
  named here for a future targeted pass.
- **Confidence**: High for the mechanism (direct source read + one traced
  example); Medium for "every individual instance is layout precision, not
  a badge bug" (traced one fixture in depth, not all 12).

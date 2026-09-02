## Observation: `participant X AS Y` (uppercase) creates TWO participants

- **Context**: `plans/sequence-creole` C2. `gucare-93-petu502` was the one
  fixture that LOST descent when every sequence display started splitting on
  its escaped newline.
- **Finding**: `sequence-parse-helpers.ts:302-307` builds all three `as`
  alternatives with `new RegExp(..., 'u')` — no `i` flag. Upstream's
  `CommandParticipantA3` uses a bare `new RegexLeaf("as")` (`:57`) inside a
  `Pattern2`, and `Pattern2.cmpile` compiles with `Pattern.CASE_INSENSITIVE`
  (`Pattern2.java:114`). So `participant "Provider Global Settings" AS
  PROVIDERSETTINGS` becomes ONE participant whose display is that whole
  string, and the later `PROVIDERSETTINGS ->` messages auto-create a SECOND.
  The surplus is exactly +5 root-group children: 1 `g`, 2 `rect`, 2 `text`.
- **Impact**: that fixture ALSO had 5 message labels carrying an escaped
  newline, each emitting one `<text>` where the jar emits two — so before C2
  the deficit and the surplus cancelled at 124 = the jar's count and
  `compareSvg` descended. Supplying the missing 5 runs exposed the surplus,
  and the fixture now short-circuits at `svg/g[1][childCount]` 129 vs 124.
  The descent it had was an artefact of two errors, not fidelity. Fixing the
  `i` flag is a one-character change in a file outside C2's write-set; it
  should restore descent AND remove a spurious participant column.
- **Confidence**: High — mechanism traced to `file:line` on both sides, and
  the +5 accounted for tag by tag.

## Observation: the diff CENSUS golden pins fixtures, not just bucket rules

- **Context**: same task. `npm test` came back with three red files where the
  brief predicted one (the sequence ratchet).
- **Finding**: `tests/oracle/svg-conformance/sequence-diff-census.test.ts`'s
  last describe re-computes a 12-fixture slice of the real corpus and asserts
  it equals `oracle/goldens/svg-sequence/diff-census.json`. Any sequence
  output change that touches one of the first 12 measurable fixtures turns it
  red — here `TeozTimelineIssues_0007_Test`, which has four escaped-newline
  message labels and went `descended: false -> true` (diffCount 5 with one
  `missing-element` short-circuit, to 266 real per-attribute diffs).
- **Impact**: the census is a SECOND corpus-pinned golden beside the ratchet,
  and a mission that changes sequence geometry must budget for re-generating
  it: `npx jiti tests/oracle/svg-conformance/sequence-diff-census.ts` rewrites
  the whole file. Plan briefs that pre-authorise "expect exactly one red file"
  should name it too.
- **Confidence**: High — reproduced, and the fixture's transition matched the
  distance instrument's own per-fixture record.

## Observation: `parseWithNewlines` never splits a REAL newline

- **Context**: same task, deciding whether `text-block-geo.ts`'s existing
  `label.split('\n')` should survive alongside the escape split.
- **Finding**: `Display#getWithNewlines` (`Display.java:262-346`) has no
  real-newline branch at all — upstream's `Display` is a `List<CharSequence>`
  before anything reads it, so a second entry IS the line break. This port has
  no `Display` type: its parser lowers the escape to a real newline for note
  and divider bodies (`command-note-factory.ts:119`, `command-misc.ts:89`) and
  joins the multi-line `ref`/`note` block forms with one (`parser.ts:122`).
- **Impact**: replacing `split('\n')` with `splitDisplayLines` alone would
  silently collapse every multi-line `ref` body and block-form note to one
  line. The two must be COMPOSED, which is what `text-block-geo.ts
  #displayLines` does and documents.
- **Confidence**: High — read the Java method body; the port's three
  real-newline producers are each cited above.

## Observation: weightedScore RISES when a short-circuiting document gets closer

- **Context**: same task. The sequence ratchet went 93 red -> 79 red, but 7
  fixtures were NEW rises, and its own failure message asserts a rise "has NO
  benign reading ... not even a mass one".
- **Finding**: there is one. `compare.ts:396-406` charges a `[childCount]`
  short-circuit `sumUnits(actualChildren) + sumUnits(expectedChildren)` — an
  upper bound on BOTH subtrees, a function of their SIZES and not of how close
  the two counts are. So for a fixture that short-circuits at
  `svg/g[1][childCount]` both before and after a change, adding CORRECT
  elements always raises the charge. Measured, ours -> jar's:

  | fixture | before | after | jar |
  |---|---|---|---|
  | `vuniba-19-repo187` | 30 | 32 | 33 |
  | `diruxe-35-xujo142` | 43 | 49 | 89 |
  | `gacujo-48-leto751` | 73 | 84 | 86 |
  | `taboza-78-vali232` | 19 | 20 | 32 |

  Every one moved TOWARD the jar and every one's weightedScore rose.
  `vuniba-19-repo187` is the clean proof: 3 short became 1 short.
- **Impact**: the monotonicity argument in `sequence.diff-baseline.ratchet
  .test.ts`'s message holds only where the comparison DESCENDS. On a fixture
  still short-circuiting at the root child count on both sides, a rise is
  benign iff `|ours - jar|` fell. Read that pair before treating a rise as a
  regression — the message currently tells you not to, and it is wrong for
  this case. (The remaining two of the seven: `xiceso-64-pelu456` and
  `kenilu-88-javu563` both went 30 -> 32 against 31, i.e. overshot by 1 from
  short by 1, so those two are genuinely no better; `gucare-93-petu502` is the
  uppercase-`AS` unmasking above.)
- **Confidence**: High — measured at both refs with `compareSvg` directly.

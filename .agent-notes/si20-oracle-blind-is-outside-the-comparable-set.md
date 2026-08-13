# Observation: `dot-sync-report`'s "oracle-blind" count sits OUTSIDE the comparable denominator, not inside the EQUAL count

- **Context**: SI20 T4 close-out, checking the exit-bar arithmetic before
  writing the measured number down. ADR-6 (and, in the same words, this
  mission's README, T3's journal entry and SI17's ADR-6) states the object
  breakdown as *"78 EQUAL + 2 no-candidate, with 1 oracle-blind already
  **inside** the 78 — it passes trivially because the jar dumps no DOT to
  disagree with."* That last clause is wrong, and the correction is
  arithmetic, not cosmetic.

- **Finding**: `buildAgg` tests the fixture markup for `!pragma layout elk`
  and `continue`s **before** `analyzeFixture`
  (`scripts/dot-sync-report.ts:265-266`). `a.total` is incremented inside
  `analyzeFixture` (`:219`), so an oracle-blind fixture never enters the
  denominator and can never be counted EQUAL. The report even prints the
  two sets separately: `reportSkips(..., a.total + a.oracleBlind, ...)`
  (`:269`) analysed **81**, while the header reads `80 CLASS fixtures`.

  Measured on object at this mission's close (`--equal-list`, then the
  EQUAL list subtracted from the CLASS-tagged canonical set):

  | bucket | count | slugs |
  |---|---|---|
  | CLASS-tagged object fixtures | 81 | — |
  | oracle-blind, **excluded before analysis** | 1 | `robitu-34-vupe367` (`!pragma layout elk`) |
  | comparable denominator | 80 | — |
  | structurally EQUAL | 78 | — |
  | `no-candidate` (we feed nothing) | 2 | `zicope-62-pica490`, `zuvila-56-nuda425` |

  So `80 = 78 + 2` exactly, with the oracle-blind fixture as an 81st outside
  it. It is the **only** `!pragma layout` fixture in the whole object corpus
  — there is no smetana/vizjs object fixture that could have been the
  "trivially EQUAL" one the older phrasing describes.

- **Impact**: the headline **78/80 is unaffected** — only the *composition*
  claim was wrong, and only in the direction of overstating what the EQUAL
  count covers. Two consequences worth carrying:
  1. Do not treat `oracle-blind` as debt already paid inside a pass count. A
     type's real coverage is `equal / total`, and `total` already excludes
     it. Reading it as "inside" silently credits the port with a fixture no
     comparator ever looked at.
  2. `analyzeFixture:222` is a *different* mechanism that genuinely does
     score a trivial pass: `dots.length === 0 && inputs.length === 0` counts
     EQUAL (both sides skipped graphviz — `GraphvizImageBuilder.buildImage:
     211-222`). That one IS inside the count and is legitimate. The two are
     easy to conflate, and the older phrasing conflates them.

  The same script serves every type, so SI17's "7 oracle-blind inside the
  710" reads the same way and deserves the same check. **Not asserted here**
  — class was not re-measured per-slug at this close-out, and 710/711 itself
  is unmoved either way; only the prose about what the 710 contains is in
  question.

- **Confidence**: High for object — measured, with the slugs enumerated, and
  the mechanism read out of the script rather than inferred from the totals.
  Unverified for class, deliberately.

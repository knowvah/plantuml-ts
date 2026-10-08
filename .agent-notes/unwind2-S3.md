# unwind2-S3 — tab stops in labels

## Observation: the tab-stop port existed, but only on four of the text paths
- **Context**: retiring DIVERGENCES.md "`\t` in labels — a real tab, but no
  tab-stop indentation".
- **Finding**: `core/klimt/creole/legacy/AtomText.ts` already ported
  `AtomText#getWidth`/`getTabSize` (java:239-275), and description
  (`EntityImageDescriptionDelegates.ts#drawTextAtom`), state
  (`state-sizing-creole.ts#expandRun`) and class members
  (`class-member-creole-render-text.ts#resolveTabbedTextRuns`) draw the
  `drawU` walk. Jar fixtures showed every OTHER path drew the tab inside one
  `<text>`: activity actions/notes (chrome `drawTextAtom`), class notes
  (`resolveMemberAtoms` with `expandTabs` off), sequence (every label), and
  link labels (class/description/state). The divergence entry was stale for
  the four ported paths.
- **Impact**: when a creole text feature "already exists", probe every engine
  with a jar fixture before trusting it — the port is per-adapter, not shared.
- **Confidence**: High

## Observation: the tab stop is per ATOM, not per line
- **Context**: reading `AtomText#drawU` (java:217-231).
- **Finding**: `x` starts at 0 inside each `AtomText`, so `<b>x</b>a\tb`
  places the stop relative to the start of the `a\tb` run, not the line.
  Under the deterministic width table a space measures 0, so the stop is
  always `fontSize * 4` (`AtomText.java:272-274`) — 56 at 14pt, 52 at 13pt.
- **Impact**: a line-level tab expansion is wrong for mixed-style lines.
- **Confidence**: High

## Observation: jar left-aligns multi-line description labels; ours centres
- **Context**: probing `rectangle "a\tb\nlonger\tc"`.
- **Finding**: the jar draws `rectangle "longer\nW"` with `W` at the SAME x
  as `longer` (also for `component`, and for a `[ ]` body); this port
  centres `W`. Not a tab behaviour — tab-free text shows it. Out of S3's
  scope; reported, not fixed.
- **Impact**: multi-line description labels in this port are offset by
  `(maxWidth - lineWidth) / 2` against the jar.
- **Confidence**: High (jar probe, scripts/oracle-render.sh)

## Observation: a correct tab split raises mukebo-35's sequence ratchet score
- **Context**: sequence ratchet after the tab walk reached sequence notes.
- **Finding**: `mukebo-35-xoju095`'s note line `...renegociation ?     <TAB>    `
  now draws as two `<text>`s, the second at the jar's own +156 (3 x 52)
  stop. The ONLY comparator change is `svg/g[1][childCount]` 114 -> 115
  against the jar's 121, whose short-circuit charge grows 99 -> 105
  (weightedScore 601 -> 607). The anti-monotone-under-growth artefact, not a
  regression.
- **Impact**: re-pin, do not revert.
- **Confidence**: High (before/after compareSvg diff lists are identical
  except that row)

## Observation: jar emits textLength for a whitespace-only run
- **Context**: same mukebo-35 line.
- **Finding**: the jar draws the post-tab `"    "` with `textLength="14.3"`
  (3.575 per space at 13pt) although the SAME jar sizes the tab stop as if a
  space measured 0 (stop = 13 * 4). This port emits `textLength="0"`.
  Mechanism not traced (pre-existing, tab-independent).
- **Confidence**: Medium

## Observation: jar writes a tab in a sequence participant `<title>` as `.`
- **Context**: `participant "a\tb" as A`.
- **Finding**: the jar emits `<title>a.b</title>`; this port emits the raw
  `a\tb` source text (`renderer-lifeline.ts#toTooltipText`, S4's file).
  No `'\t' -> '.'` mapping found in `klimt/drawing/svg/` or `Display`
  (`Display#toTooltipText`, `Display.java:601-605`, returns line 0 as-is).
  Mechanism UNKNOWN.
- **Confidence**: High on the observation, unknown on the mechanism

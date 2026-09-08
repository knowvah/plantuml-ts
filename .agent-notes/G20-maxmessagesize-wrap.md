## Observation: edge-label word-wrap (`maxMessageSize`/`wrapMessageWidth`) landed
- **Context**: Wiring `skinparam maxMessageSize`/`wrapMessageWidth` edge-label
  word-wrap (`SvekEdge.java:288-300`, `skin/SkinParam.java:971-978`).
- **Finding**: `Fission#getSplitted` (already ported, `Fission.ts`), fed a
  single plain-text `CreoleAtom` per physical line, reproduces the jar's
  greedy word-wrap exactly with no new break-rule code -- verified against
  `usecase/kafexo-72-xupa679`'s validated arithmetic (90x41) byte-for-byte.
  The description/usecase engine's edge-label RENDER path
  (`renderer-edge.ts`/`SvekEdge.ts#drawLabels`) draws `edge.label.text` as
  ONE `UText.build` call regardless of DOT-gate line count -- multi-line
  edge-label rendering (even literal `\n`) is a pre-existing, separately
  documented gap (`link-edge-attrs.ts#mainLabelText`'s own comment), NOT
  something this fix could regress or was expected to close. Same is true
  for state (`state-renderer-transitions.ts` draws `transition.label.text`
  as one line).
- **Finding**: `state/lurage-50-kobo763` (`skinparam maxMessageSize 150`,
  pinned `dotEqual: false` pre-fix) now computes a DOT label reservation of
  EXACTLY 125x54, matching the jar's own cached `svek-1.dot`
  (`WIDTH="125" HEIGHT="54"`) byte-for-byte -- the unwrapped pre-fix value
  was 472x15. This looks like a full fix, not just a "move" of the pin, but
  per the task's own instruction it was reported, not re-pinned.
- **Finding**: `theme.ts`/`link-edge-attrs.ts` were both already sitting
  AT the 500-line hook cap before this task touched them (theme.ts's own
  git-HEAD baseline was 624, already over-cap from prior work). Any edit
  that grows an over-cap file at all is blocked (directional ratchet, see
  `~/.claude/hooks/check-complexity.py`'s own docstring) -- `theme.ts`
  needed a real split (`deepMergeTheme` + helpers -> new `theme-merge.ts`)
  before the new field could land; `link-edge-attrs.ts` only needed the
  new statement compressed to net +1 line.
- **Impact**: Future wrap-related work on state's RENDER path
  (`state-transition-label.ts`/`attachTransitionLabel`) would need a
  signature refactor (bundling font+measurer+maxWidth into one ctx object)
  since `attachTransitionLabel` is already at the 5-param cap with two
  callers (`layout.ts`, `state-composite-pass.ts`) -- deliberately NOT done
  this iteration (out of scope: DOT-gate sizing only, per the mission
  brief's explicit boundary).
- **Confidence**: High (jar-oracle byte match on kafexo and lurage's DOT
  box; full render diff on all 6 sequence fixtures confirmed byte-identical
  via git-stash A/B).

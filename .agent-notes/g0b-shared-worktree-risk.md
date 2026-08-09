# Observation: parallel batch agents share ONE git working tree

- **Context**: G0b batch 1 — three concurrent agents (T1/T2/T3) writing
  disjoint file sets on branch feat/g0b-annotations.
- **Finding**: mid-batch, T1's untracked files (src/core/annotations/*)
  transiently appeared missing; git reflog showed a concurrent
  checkout/reset by another agent (T3 captured byte-stability baselines by
  switching tree state). Untracked files survived, but any agent running
  `git checkout`/`reset`/`stash`/`clean` mid-batch can destroy other
  agents' uncommitted work — `clean` WOULD have deleted them.
- **Impact**: agent prompts for parallel batches must explicitly forbid
  git state mutations (checkout/reset/stash/clean); baseline-vs-after
  comparisons need pre-captured artifacts or `git show <ref>:<path>`
  (read-only) instead of tree switching. Alternative: EnterWorktree-style
  isolation per agent.
- **Confidence**: High (reflog evidence + first-hand file disappearance).

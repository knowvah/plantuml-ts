#!/usr/bin/env bash
# isw: create one task worktree off the mission branch with the gitignored
# dependencies linked (memory: batch-parallelism-needs-worktrees). Copied from
# add4's mkwt.sh with the branch and prefix changed (a
# mission must carry its OWN copy).
set -euo pipefail
R="$(git rev-parse --show-toplevel)"; t="$1"; W="$R/.claude/worktrees/isw-$t"
git -C "$R" worktree add -q -b "isw/$t" "$W" feat/instrument-space-width
cd "$W"
for p in .husky/_ node_modules oracle/dist assets/stdlib tests/corpus plans/class-divergence-drive/tools/node_modules packages/emoji/assets packages/sprites-archimate/assets packages/stdlib-all/generated packages/stdlib-aws/assets packages/stdlib-aws/generated packages/stdlib-tupadr3/assets packages/stdlib-tupadr3/generated packages/stdlib/assets packages/stdlib/generated; do
  [ -e "$R/$p" ] && { rm -rf "$W/$p"; mkdir -p "$(dirname "$W/$p")"; ln -s "$R/$p" "$W/$p"; }
done
for c in dot-sync-equal render-manifest-baseline.json render-manifest-baseline.si28.json shared-seam-baseline-manifest.json state-declared-size-baseline.jsonl state-declared-size-baseline.si28.jsonl visual-qa-svg; do ln -s "$R/test-results/$c" "$W/test-results/$c"; done
echo "$W"

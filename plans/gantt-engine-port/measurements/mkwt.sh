#!/usr/bin/env bash
# gep (copied from lad): create one task worktree off the mission branch with the gitignored
# dependencies linked (memory: batch-parallelism-needs-worktrees). Copied from
# ufp's mkwt.sh with the branch and prefix changed (a mission must carry its
# OWN copy -- cdd7 journal row 8).
set -euo pipefail
R="$(git rev-parse --show-toplevel)"; t="$1"; W="$R/.claude/worktrees/gep-$t"
git -C "$R" worktree add -q -b "gep/$t" "$W" "${2:-feat/gantt-engine-port}"
cd "$W"
# signing (2026-10-16): agents never block on the YubiKey; the orchestrator
# re-signs gep/Tn when it rebases the branch onto the mission tip.
git config --worktree commit.gpgsign false
for p in .husky/_ node_modules oracle/dist assets/stdlib tests/corpus plans/class-divergence-drive/tools/node_modules packages/emoji/assets packages/sprites-archimate/assets packages/stdlib-all/generated packages/stdlib-aws/assets packages/stdlib-aws/generated packages/stdlib-tupadr3/assets packages/stdlib-tupadr3/generated packages/stdlib/assets packages/stdlib/generated; do
  [ -e "$R/$p" ] && { rm -rf "$W/$p"; mkdir -p "$(dirname "$W/$p")"; ln -s "$R/$p" "$W/$p"; }
done
for c in dot-sync-equal render-manifest-baseline.json render-manifest-baseline.si28.json shared-seam-baseline-manifest.json state-declared-size-baseline.jsonl state-declared-size-baseline.si28.jsonl visual-qa-svg; do
  [ -e "$R/test-results/$c" ] && { mkdir -p "$W/test-results"; ln -s "$R/test-results/$c" "$W/test-results/$c"; }
done
echo "$W"

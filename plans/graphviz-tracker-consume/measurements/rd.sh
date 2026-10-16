#!/usr/bin/env bash
# gtc: render-diff every target row (fixtures.md) into $M/<tag>-rd.txt and print
# the summary lines. Usage: rd.sh <tag> [tree/slug ...]  (default: all targets)
set -u
cd "$(git rev-parse --show-toplevel)"
M=plans/graphviz-tracker-consume/measurements; t=${1:?tag}; shift
ROWS=("$@")
[ ${#ROWS[@]} -eq 0 ] && ROWS=(
  unknown/rubebe-45-sura795 unknown/rufopi-30-roro642 component/zosuje-43-zebi775
  component/xenusu-76-sabi405 component/repoge-41-demu604 unknown/xagonu-36-sudi116
  unknown/deroxu-29-gude369 state/pavuzo-79-zodu430
  unknown/bamami-10-lava790 unknown/bobixe-18-riza923 unknown/pugodi-27-kone040
  class/sokevu-87-toce485)
npx jiti plans/class-divergence-drive/tools/render-diff.mts "${ROWS[@]}" > "$M/$t-rd.txt" 2>&1
grep '^###' "$M/$t-rd.txt"

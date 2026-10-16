#!/usr/bin/env bash
# gtc (copied from dur) bN close: survey every engine into $M/, waiting for load < 12 before each
# engine (a survey timeout at load >= 8 is not a finding). Usage: chain.sh <bN-eng>
set -u
cd "$(git rev-parse --show-toplevel)"
M=plans/graphviz-tracker-consume/measurements/${1:?bN-eng}
mkdir -p "$M"
for e in $(ls test-results/dot-cache); do
  while :; do l=$(sysctl -n vm.loadavg | awk '{print $2}'); awk "BEGIN{exit !($l < 12)}" && break; echo "wait load $l"; sleep 30; done
  echo "== $e $(date +%T) $(sysctl -n vm.loadavg)"
  npm run -s svg:survey -- "$e" --out "$M/parity-$e.json" 2>&1 | grep -E '^wrote|timeout|Error' | tail -3
done
echo "DONE $(date +%T)"

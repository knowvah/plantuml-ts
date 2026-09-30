#!/usr/bin/env bash
# cdd6 b3 close: survey every engine into final-eng/, waiting for load < 8
# before each engine (a survey timeout at load >= 8 is not a finding).
set -u
cd "$(git rev-parse --show-toplevel)"
M=plans/class-divergence-drive-6/measurements/final-eng
for e in class unknown $(ls plans/class-divergence-drive-6/measurements/b3-eng | sed -n 's/^parity-\(.*\)\.json$/\1/p' | grep -v '^class$\|^unknown$'); do
  while :; do l=$(sysctl -n vm.loadavg | awk '{print $2}'); awk "BEGIN{exit !($l < 8)}" && break; echo "wait load $l"; sleep 30; done
  echo "== $e $(date +%T) $(sysctl -n vm.loadavg)"
  npm run -s svg:survey -- "$e" --out "$M/parity-$e.json" 2>&1 | grep -E '^wrote|timeout|Error' | tail -3
done
echo "DONE $(date +%T)"

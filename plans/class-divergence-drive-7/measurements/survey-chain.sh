#!/usr/bin/env bash
# cdd7: survey every engine into measurements/<ckpt>-eng/, waiting for load < 8
# before each engine (a survey timeout at load >= 8 is not a finding, stop 7).
# Usage: survey-chain.sh <ckpt>   (e.g. b0, b1, final)
set -u
cd "$(git rev-parse --show-toplevel)"
M=plans/class-divergence-drive-7/measurements/$1-eng; mkdir -p "$M"
for e in class unknown $(ls plans/class-divergence-drive-6/measurements/final-eng | sed -n 's/^parity-\(.*\)\.json$/\1/p' | grep -v '^class$\|^unknown$'); do
  while :; do l=$(sysctl -n vm.loadavg | awk '{print $2}'); awk "BEGIN{exit !($l < 8)}" && break; echo "wait load $l"; sleep 30; done
  echo "== $e $(date +%T) $(sysctl -n vm.loadavg)"
  npm run -s svg:survey -- "$e" --out "$M/parity-$e.json" 2>&1 | grep -E '^wrote|timeout|Error' | tail -3
done
echo "DONE $(date +%T)"

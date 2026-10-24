#!/usr/bin/env bash
# lad (copied from gtc) close: survey every engine into $M/<bN-eng>/, waiting for
# load < LOAD_MAX before each engine (a survey timeout at load >= 8 is not a
# finding). Usage: [LOAD_MAX=n] chain.sh <bN-eng> [engines...]
set -u
cd "$(git rev-parse --show-toplevel)"
M=plans/lengthadjust-document-wide/measurements/${1:?bN-eng}; shift
mkdir -p "$M"
engines="${*:-$(ls test-results/dot-cache)}"
for e in $engines; do
  while :; do l=$(sysctl -n vm.loadavg | awk '{print $2}'); awk "BEGIN{exit !($l < ${LOAD_MAX:-12})}" && break; echo "wait load $l"; sleep 30; done
  echo "== $e $(date +%T) $(sysctl -n vm.loadavg)"
  npm run -s svg:survey -- "$e" --out "$M/parity-$e.json" 2>&1 | grep -E '^wrote|timeout|Error' | tail -3
done
echo "DONE $(date +%T)"

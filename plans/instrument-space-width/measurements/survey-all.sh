#!/usr/bin/env bash
# isw: survey every engine into $1 (dir). Usage: survey-all.sh <outdir> [engines...]
set -u
cd /Users/scottseely/git/knowvah/plantuml-ts
out="$1"; shift; mkdir -p "$out"
engines="${*:-$(ls tests/oracle/svg-conformance/parity-*.json | sed 's/.*parity-\(.*\)\.json/\1/')}"
for e in $engines; do
  npm run -s svg:survey -- "$e" --out "$out/parity-$e.json" > "$out/.log-$e.txt" 2>&1 || echo "FAIL $e"
  echo "done $e $(uptime | sed 's/.*averages: //')"
done
echo ALL-DONE

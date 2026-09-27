#!/usr/bin/env bash
# cdd5-T0c: recapture ONE cache dir in place through scripts/oracle-render.sh,
# the same call capture-oracle-cache.ts#renderFixture makes, but (1) never
# rewrites in.puml (fixture set/content unchanged) and (2) clears every prior
# jar output first, so a jar failure or a renamed output cannot leave
# 7beta11 bytes behind (stop 8). Adopts a lone differently-named .svg as
# in.svg (aoh-T0 Finding 2). Prints "<status> <dir>".
set -uo pipefail
REPO="$(cd "$(dirname "$0")/../../../.." && pwd)"
d="$1"
[ -f "$d/in.puml" ] || { echo "NOPUML $d"; exit 0; }
rm -f "$d"/*.svg "$d"/svek-*.dot
"$REPO/scripts/oracle-render.sh" "$d" "$d/in.puml" </dev/null >/dev/null 2>&1
if [ -f "$d/in.svg" ]; then echo "OK $d"; exit 0; fi
n=$(find "$d" -maxdepth 1 -name '*.svg' | wc -l | tr -d ' ')
if [ "$n" = "1" ]; then f=$(find "$d" -maxdepth 1 -name '*.svg'); mv "$f" "$d/in.svg"; echo "RENAMED $d $(basename "$f")"; exit 0; fi
echo "FAIL($n) $d"

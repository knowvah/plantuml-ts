#!/usr/bin/env bash
# cdd5-T0c/T0e: recapture ONE cache dir like recapture-one.sh, but only in a
# wall-clock minute where PSystemError.java:218-228 adds no time-based
# decoration (Patreon 1/8/13/55, Liberapay 15, dedication 30/39/48 -- minute
# = currentTimeMillis/60000 % 60, i.e. UTC minute == local minute here).
# Retries until the minute at render start AND end are both safe.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
bad() { case "$(( 10#$(date -u +%M) ))" in 1|8|13|15|30|39|48|55) return 0;; *) return 1;; esac; }
d="$1"
for attempt in 1 2 3 4 5 6; do
  while bad; do sleep 2; done
  out=$("$HERE/recapture-one.sh" "$d")
  if ! bad; then echo "$out (attempt $attempt)"; exit 0; fi
done
echo "GAVEUP $d"

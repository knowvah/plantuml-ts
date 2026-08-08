#!/usr/bin/env bash
# Build the patched PlantUML oracle jar from the fork's dot-output branch.
# Stock behavior + DOT dump via -DPLANTUML_DUMP_DOT. See oracle/README.md.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
FORK="${PLANTUML_FORK:-$HOME/git/plantuml}"

# Read the pin from pin.json rather than duplicating it here. The hardcoded
# copy this replaced went stale: the checkout drifted 59 commits ahead and the
# guard below could not see it, because it assumed ONE seam commit when there
# are two (see pin.json:seamCommitCount and the retired previousPin block).
PIN_JSON="$HERE/pin.json"
read_pin() { sed -n "s/.*\"$1\": *\"\{0,1\}\([^\",]*\)\"\{0,1\},\{0,1\}$/\1/p" "$PIN_JSON" | head -1; }
PIN_SHA="$(read_pin upstreamSha)"
SEAM_COUNT="$(read_pin seamCommitCount)"
: "${SEAM_COUNT:=1}"

[ -d "$FORK/.git" ] || { echo "fork not found at $FORK (set PLANTUML_FORK)"; exit 1; }

git -C "$FORK" switch dot-output

# The seam must sit on the pinned upstream tree. The pristine base is
# dot-output~<seamCommitCount>. FAIL (don't just warn) on drift: a silent warn
# is what let the port implement post-pin upstream behaviour against a pre-pin
# oracle for six weeks. Set ORACLE_ALLOW_DRIFT=1 to build anyway.
base_tree="$(git -C "$FORK" rev-parse "dot-output~${SEAM_COUNT}^{tree}")"
pin_tree="$(git -C "$FORK" rev-parse "${PIN_SHA}^{tree}" 2>/dev/null || true)"
if [ -z "$pin_tree" ]; then
  echo "ERROR: pin.json upstreamSha ($PIN_SHA) not found in $FORK" >&2
  exit 1
fi
if [ "$base_tree" != "$pin_tree" ]; then
  echo "ERROR: dot-output~${SEAM_COUNT} tree != pinned upstream tree." >&2
  echo "       The checkout has drifted from pin.json. Either rebase dot-output" >&2
  echo "       onto ${PIN_SHA}, or advance pin.json AND re-baseline the goldens" >&2
  echo "       (pin.json:note). Set ORACLE_ALLOW_DRIFT=1 to override." >&2
  [ "${ORACLE_ALLOW_DRIFT:-0}" = "1" ] || exit 1
  echo "WARN: ORACLE_ALLOW_DRIFT=1 — building from a drifted tree anyway." >&2
fi

( cd "$FORK" && ./gradlew jar -x test --console=plain )

jar="$(ls -t "$FORK"/build/libs/plantuml-*.jar | head -1)"
mkdir -p "$HERE/dist"
cp "$jar" "$HERE/dist/plantuml-oracle.jar"
echo "oracle jar -> $HERE/dist/plantuml-oracle.jar  (from $(basename "$jar"))"

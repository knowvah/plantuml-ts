#!/usr/bin/env bash
# Stock-jar verifier (aepp D5). The error-page conformance rule only applies
# where the STOCK upstream jar errors; an error produced only by the patched
# oracle jar (oracle/pin.json#patches) is a seam artifact.
#
# 1. Build stock upstream at oracle/pin.json#upstreamSha (git archive of the
#    fork checkout into a temp dir -- NEVER git switch/checkout the fork), cache
#    it at oracle/dist/stock/plantuml-stock-<sha>.jar (gitignored via dist/).
# 2. Assert the oracle seam strings are absent from the jar.
# 3. For every cached oracle fixture whose in.svg looks like an error page (a
#    cheap candidate pre-filter only), run the stock jar on in.puml with NO -D
#    flags, one JVM per fixture.
# 4. Stock "errors" is upstream's own signal: exit status 200
#    (cli/ExitStatus.java:43 ERROR_200_SOME_DIAGRAMS_HAVE_ERROR, set at
#    ExitStatus.java:104 getExitCode() when hasErrors, which Run.java:286/374
#    and SourceFileReaderAbstract.updateStatus:112-113 raise for PSystemError /
#    PSystemUnsupported). Line + message come from `-stdrpt:1`
#    (CliFlag.java:226; StdrptV1.printInfo prints status=ERROR / lineNumber= /
#    label= to stderr, Run.java:362). (`--check-syntax`, CliFlag.java:138-139,
#    returns before printInfo at Run.java:347 and so yields no line/message.)
# 5. Fixtures the stock jar DRAWS go through a controlled experiment on the
#    ORACLE jar (oracle/dist/plantuml-oracle.jar): run with no -D flags, then
#    with only -DPLANTUML_DETERMINISTIC_TEXT=true. Exit 0 then 200 means the
#    crash is upstream code reached only at the oracle's text widths; recorded
#    with provenance 'oracle-widths'. Any other disagreement is not recorded
#    and is listed via --draws-out.
# 6. Write oracle/goldens/stock-error-pages.json (deterministic, sorted).
#
# Usage: scripts/stock-jar-verify.sh [--draws-out <file>]
#   Env: PLANTUML_FORK (default ~/git/plantuml), STOCK_JOBS (default 4).
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FORK="${PLANTUML_FORK:-$HOME/git/plantuml}"
PIN="$REPO/oracle/pin.json"
CACHE="$REPO/test-results/dot-cache"
OUT_JSON="$REPO/oracle/goldens/stock-error-pages.json"
JOBS="${STOCK_JOBS:-4}"
DRAWS_OUT=""
if [ "${1:-}" = "--draws-out" ]; then DRAWS_OUT="$2"; fi

read_pin() { sed -n "s/.*\"$1\": *\"\{0,1\}\([^\",]*\)\"\{0,1\},\{0,1\}$/\1/p" "$PIN" | head -1; }
SHA="$(read_pin upstreamSha)"
VERSION="$(read_pin plantumlVersion)"
DIR="$REPO/oracle/dist/stock"
JAR="$DIR/plantuml-stock-$SHA.jar"
EXIT_ERRORS=200 # ExitStatus.ERROR_200_SOME_DIAGRAMS_HAVE_ERROR
SEAM_STRINGS=(PLANTUML_DETERMINISTIC_TEXT PLANTUML_DUMP_DOT)

build_stock() {
  local tmp; tmp="$(mktemp -d)"
  git -C "$FORK" archive "$SHA" | tar -x -C "$tmp"
  # generateGitProperties needs .git; skipping it does not change the source.
  ( cd "$tmp" && ./gradlew jar -x test -x generateGitProperties --console=plain >&2 )
  mkdir -p "$DIR"
  cp "$(ls -t "$tmp"/build/libs/plantuml-*.jar | grep -v -- '-sources\|-javadoc' | head -1)" "$JAR"
  rm -rf "$tmp"
}

assert_no_seams() {
  local s
  for s in "${SEAM_STRINGS[@]}"; do
    if unzip -p "$JAR" '*.class' 2>/dev/null | grep -aq "$s"; then
      echo "ERROR: seam string $s found in $JAR; not a stock jar" >&2
      exit 1
    fi
  done
}

[ -f "$JAR" ] || build_stock
assert_no_seams

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
CANDIDATE_RE='PlantUML version|An error has occurred|Syntax Error|\[From '
( cd "$CACHE" && grep -lE "$CANDIDATE_RE" ./*/*/in.svg | sed 's#^\./##; s#/in.svg$##' | LC_ALL=C sort ) > "$WORK/candidates.txt"

# One JVM per fixture; prints "<key>\t<exit>" and leaves stderr in $WORK/err/.
run_one() {
  local key="$1" jar="$2" cache="$3" work="$4" tag="${5:-}" flag="${6:-}" t
  mkdir -p "$work/o$tag/$key" "$work/err$tag/$(dirname "$key")"
  t=timeout; command -v timeout >/dev/null 2>&1 || t=gtimeout
  set +e
  "$t" 60s java -Djava.awt.headless=true $flag -cp "$jar" net.sourceforge.plantuml.Run \
    -tsvg -stdrpt:1 -o "$work/o$tag/$key" "$cache/$key/in.puml" 2> "$work/err$tag/$key.txt" >/dev/null
  echo "$?" > "$work/err$tag/$key.exit"
  set -e
}
export -f run_one
xargs -P "$JOBS" -I{} bash -c 'run_one "$@"' _ {} "$JAR" "$CACHE" "$WORK" < "$WORK/candidates.txt"

# Controlled experiment for the stock draws (step 5).
ORACLE_JAR="$REPO/oracle/dist/plantuml-oracle.jar"
for key in $(cat "$WORK/candidates.txt"); do
  [ "$(cat "$WORK/err/$key.exit")" = "$EXIT_ERRORS" ] || echo "$key"
done > "$WORK/stock-draws.txt"
xargs -P "$JOBS" -I{} bash -c 'run_one "$@"' _ {} "$ORACLE_JAR" "$CACHE" "$WORK" .nod "" < "$WORK/stock-draws.txt"
xargs -P "$JOBS" -I{} bash -c 'run_one "$@"' _ {} "$ORACLE_JAR" "$CACHE" "$WORK" .det -DPLANTUML_DETERMINISTIC_TEXT=true < "$WORK/stock-draws.txt"

node --experimental-strip-types "$REPO/scripts/lib/stock-jar-record.ts" \
  "$WORK" "$SHA" "$VERSION" "$EXIT_ERRORS" "$OUT_JSON" "$DRAWS_OUT"

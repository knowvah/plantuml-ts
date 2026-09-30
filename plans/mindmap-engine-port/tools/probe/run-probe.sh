#!/usr/bin/env bash
# Compiles and runs a T0c jar probe (StyleProbe, LayoutProbe) against the
# pinned oracle jar, the same jar scripts/oracle-render.sh renders from
# (oracle/dist/plantuml-oracle.jar) -- never a jar edit, never a different
# jar. -DPLANTUML_DETERMINISTIC_TEXT=true is set on every run, mirroring
# oracle-render.sh, so LayoutProbe's StringBounder matches what the
# cached test-results/dot-cache/mindmap/<slug>/in.svg goldens were
# rendered with (see FileFormat.java's "plantuml-ts oracle seam" comment).
#
# Usage:
#   run-probe.sh <ProbeClassName> [args...]
#
# Examples:
#   run-probe.sh LayoutProbe path/to/fixture.puml
#   run-probe.sh StyleProbe snippet.txt special root,element,mindmapDiagram,node --level 2 --delta 3000
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$DIR/../../../.." && pwd)"
JAR="$REPO/oracle/dist/plantuml-oracle.jar"
OUT="$DIR/out"

if [ $# -lt 1 ]; then
  echo "usage: $0 <ProbeClassName> [args...]" >&2
  exit 2
fi
PROBE="$1"; shift

if [ ! -f "$JAR" ]; then
  echo "oracle jar not found: $JAR" >&2
  exit 1
fi

mkdir -p "$OUT"
javac -cp "$JAR" -d "$OUT" "$DIR"/*.java

exec java -DPLANTUML_DETERMINISTIC_TEXT=true -cp "$JAR:$OUT" "$PROBE" "$@"

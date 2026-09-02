#!/usr/bin/env bash
# Render .puml through the pinned oracle jar the way the conformance harness
# does — deterministic text metrics ON.
#
# Use this instead of a hand-typed `java -jar …`. Omitting
# PLANTUML_DETERMINISTIC_TEXT makes the jar measure with REAL platform font
# metrics, while every harness in this repo renders through
# `DeterministicMeasurer`. The two disagree on every text-derived number — node
# widths, row heights, textLength — so a hand-rolled comparison reports large
# "defects" that are purely the flag. That has cost real time (mission A5, M7:
# a 10x8 document-dimension discrepancy that measured as 1px once the flag was
# set), which is why this wrapper exists.
#
# Mirrors `scripts/oracle-corpus.ts#runOracle`; keep the two in sync.
#
# Usage:
#   scripts/oracle-render.sh <out-dir> <file.puml> [more.puml …]
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JAR="$REPO/oracle/dist/plantuml-oracle.jar"
# Apache Batik, needed ONLY for `<latex>`/`<math>`. `math/ConverterSvg.java:88-99`
# reaches Batik through `Class.forName`, so the jar runs happily without it and
# `LatexBuilder#getSvg` (java:77) throws ClassNotFoundException, which
# `ScientificEquationSafe` swallows into `getRollback()` — the raw formula in
# monospace instead of typeset maths. That fallback is silent, and it is what
# produced this corpus's original latex oracles. Batik is oracle-generation
# only and is never shipped in the library.
#   curl -fsSLO --output-dir oracle/dist/batik \
#     https://repo1.maven.org/maven2/org/apache/xmlgraphics/batik-all/1.17/batik-all-1.17.jar \
#     https://repo1.maven.org/maven2/org/apache/xmlgraphics/xmlgraphics-commons/2.9/xmlgraphics-commons-2.9.jar
BATIK="$REPO/oracle/dist/batik"

if [ $# -lt 2 ]; then
  echo "usage: $0 <out-dir> <file.puml> [more.puml ...]" >&2
  exit 2
fi
if [ ! -f "$JAR" ]; then
  echo "oracle jar not found: $JAR" >&2
  exit 1
fi

OUT="$1"; shift
mkdir -p "$OUT"

CP="$JAR"
if [ -d "$BATIK" ] && [ -n "$(ls -A "$BATIK"/*.jar 2>/dev/null)" ]; then
  CP="$JAR:$BATIK/*"
else
  echo "warn: $BATIK absent -- <latex>/<math> will render as a monospace" >&2
  echo "      rollback rather than typeset maths. See the header." >&2
fi

exec java \
  -DPLANTUML_DETERMINISTIC_TEXT=true \
  -DPLANTUML_DUMP_DOT="$OUT" \
  -cp "$CP" \
  net.sourceforge.plantuml.Run \
  -tsvg -o "$OUT" "$@"

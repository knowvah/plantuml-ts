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

JAR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/oracle/dist/plantuml-oracle.jar"

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

exec java \
  -DPLANTUML_DETERMINISTIC_TEXT=true \
  -DPLANTUML_DUMP_DOT="$OUT" \
  -jar "$JAR" \
  -tsvg -o "$OUT" "$@"

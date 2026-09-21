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

# Single-fixture jar budget in seconds -- keep in sync BY HAND with
# ORACLE_JAR_TIMEOUT_MS in scripts/lib/oracle-jar-timeout.ts (code-review-
# tasks.md item 3); there is no shared config format between bash and
# TypeScript here.
TIMEOUT_SECONDS=25

# macOS ships no `timeout(1)` by default (it is in GNU coreutils, installed
# here as `gtimeout` via `brew install coreutils`); Linux/CI images normally
# have GNU `timeout`. Prefer whichever is on PATH; if neither is, run
# unbounded and say so -- a caller driving this from Node (capture-oracle-
# cache.ts, oracle-corpus.ts) already applies its own execFileSync timeout,
# but a bare CLI invocation of this script has nothing else bounding it.
TIMEOUT_BIN=""
if command -v timeout >/dev/null 2>&1; then
  TIMEOUT_BIN="timeout"
elif command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT_BIN="gtimeout"
fi

if [ -z "$TIMEOUT_BIN" ]; then
  echo "warn: no timeout/gtimeout on PATH -- this render is UNBOUNDED." >&2
  echo "      install GNU coreutils (macOS: brew install coreutils) or bound" >&2
  echo "      the caller yourself (see scripts/capture-oracle-cache.ts)." >&2
  exec java \
    -DPLANTUML_DETERMINISTIC_TEXT=true \
    -DPLANTUML_DUMP_DOT="$OUT" \
    -cp "$CP" \
    net.sourceforge.plantuml.Run \
    -tsvg -o "$OUT" "$@"
else
  exec "$TIMEOUT_BIN" "${TIMEOUT_SECONDS}s" java \
    -DPLANTUML_DETERMINISTIC_TEXT=true \
    -DPLANTUML_DUMP_DOT="$OUT" \
    -cp "$CP" \
    net.sourceforge.plantuml.Run \
    -tsvg -o "$OUT" "$@"
fi

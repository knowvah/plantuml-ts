#!/usr/bin/env python3
"""check-schema.py — validates findings/*.md records against SCHEMA.md (ADR-1).

Stdlib only. Parses every findings/*.md except SCHEMA/PARTITION*/METRIC-AUDIT/
SYNTHESIS, counts `### <slug>` records, checks each has the SCHEMA fields in
order, non-empty originFileLine/javaRef/ruledOut when status is resolved,
nextStep when unresolved, and that the slug set equals PARTITION's 94
(from partition.json, written by T0). Prints `N records, M violations`;
exit 1 when M > 0.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SKIP = ("SCHEMA.md", "METRIC-AUDIT.md", "SYNTHESIS.md")
FIELDS = [
    "bucketLabel", "rows", "status", "mechanism", "originFileLine", "javaRef",
    "causalChain", "ruledOut", "pairingRisk", "sharedCauseWith",
    "proposedWriteSet", "sizeEstimate", "confidence", "nextStep",
]
STATUSES = {"resolved", "unresolved", "already-conformant", "divergence-proposed"}
FIELD_RE = re.compile(r"^- \*\*(\w+):\*\*\s*(.*)$")
FILE_LINE_RE = re.compile(r"[\w./~-]+\.(?:ts|java|py|md|puml|sh|json|js):\d+")


def load_partition():
    with open(os.path.join(HERE, "partition.json")) as f:
        p = json.load(f)
    return set(p["real"]) | set(p["precision"]) | set(p["unmatched"])


def parse_records(path):
    """Yield (slug, fields-in-order:list[(name, value)]) per `### slug` block."""
    slug, fields = None, []
    with open(path) as f:
        lines = f.read().splitlines()
    for line in lines + ["### __end__"]:
        if line.startswith("### "):
            if slug is not None:
                yield slug, fields
            slug, fields = line[4:].strip(), []
            continue
        if slug is None:
            continue
        m = FIELD_RE.match(line)
        if m:
            fields.append([m.group(1), m.group(2).strip()])
        elif fields and line.strip() and not line.startswith("#"):
            fields[-1][1] += " " + line.strip()  # continuation (tables, wraps)


def check_record(fname, slug, fields, out):
    names = [n for n, _ in fields]
    vals = dict(fields)
    if names != FIELDS:
        out.append(f"{fname} {slug}: fields not exactly SCHEMA order: {names}")
        return
    status = vals["status"]
    if status not in STATUSES:
        out.append(f"{fname} {slug}: bad status {status!r}")
    if status == "resolved":
        for k in ("originFileLine", "javaRef", "ruledOut"):
            if not vals[k]:
                out.append(f"{fname} {slug}: empty {k} on resolved record")
        for k in ("originFileLine", "javaRef"):
            if vals[k] and not FILE_LINE_RE.search(vals[k]):
                out.append(f"{fname} {slug}: {k} is not a file:line ({vals[k][:60]})")
    if status == "unresolved" and not vals["nextStep"]:
        out.append(f"{fname} {slug}: unresolved without nextStep")
    if "|" not in vals["rows"] and status != "unresolved":
        out.append(f"{fname} {slug}: rows has no table")


def main():
    expected = load_partition()
    violations, seen = [], {}
    for fname in sorted(os.listdir(HERE)):
        if not fname.endswith(".md") or fname in SKIP or fname.startswith("PARTITION"):
            continue
        for slug, fields in parse_records(os.path.join(HERE, fname)):
            base = slug.split("#")[0]
            if base in seen and "#" not in slug:
                violations.append(f"{fname} {slug}: duplicate of {seen[base]}")
            seen.setdefault(base, fname)
            check_record(fname, slug, fields, violations)
    n = sum(1 for _ in seen)
    # Slug-set completeness is only meaningful once records exist (empty dir
    # at T0 must pass; the batch-2 gate requires all 94).
    missing = (expected - set(seen)) if seen else set()
    extra = set(seen) - expected
    for s in sorted(missing):
        violations.append(f"missing record for PARTITION fixture {s}")
    for s in sorted(extra):
        violations.append(f"record for unknown fixture {s} (not in PARTITION)")
    for v in violations:
        print(v)
    print(f"{n} records, {len(violations)} violations")
    sys.exit(1 if violations else 0)


if __name__ == "__main__":
    main()

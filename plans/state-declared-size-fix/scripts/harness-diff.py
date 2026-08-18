#!/usr/bin/env python3
"""harness-diff.py — ratchet gate for measure-composite-declared-size.ts
runs (T0, plans/state-declared-size-fix/decisions.md D4/D5).

Rows are keyed by (fixture, scope, axis, idx) — Candidate B's declared-
position pairing (T0), so idx is a real node's declared position, not a
sort rank. A run is a valid re-pin only when every row in `now` either:
  - exists in `baseline` at the same key with |deltaPx| <= the baseline
    row's |deltaPx| (shrank or held), or
  - is new WITHOUT a baseline counterpart only if it did not exist in
    `now` either (i.e. genuinely absent from both — never printed).

Any row that appears in `now` but not in `baseline` ("appeared"), or whose
|deltaPx| exceeds its baseline counterpart's ("grew"), is a regression and
fails the gate. Rows whose baseline `match` was false and whose `now`
`match` is true are counted as "went exact" — a strict improvement, not an
offender.

Usage:
    harness-diff.py <baseline.jsonl> <now.jsonl>

Exit 0 and "OK: N rows went exact, 0 rows appeared or grew" when clean.
Exit 1 and a listing of offenders otherwise.
"""
import json
import sys
from collections import defaultdict

# Float noise tolerance for the deltaPx comparison — both runs derive
# deltaPx from the same 6-decimal-inch values * 72 px/in, so any residual
# below this is float representation noise, not a real growth.
GROWTH_EPSILON = 1e-9


def load_rows(path):
    """Parse one harness JSONL dump into (rows-by-key, row-count-by-fixture).

    Summary lines (`{"summary": ...}`) are skipped. Unmatched-fixture lines
    (`{"fixture": ..., "unmatched": true}`) register the fixture with a row
    count of 0 but contribute no keyed row.
    """
    rows = {}
    fixture_counts = defaultdict(int)
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            if "summary" in obj:
                continue
            fixture = obj["fixture"]
            if obj.get("unmatched"):
                fixture_counts.setdefault(fixture, 0)
                continue
            key = (fixture, obj["scope"], obj["axis"], obj["index"])
            rows[key] = obj
            fixture_counts[fixture] += 1
    return rows, fixture_counts


def diff_rows(baseline, now):
    """Return (went_exact_count, offender_messages) for `now` against
    `baseline`. Offenders are rows that appeared (no baseline counterpart)
    or grew (baseline counterpart with a smaller |deltaPx|)."""
    went_exact = 0
    offenders = []
    for key, now_row in now.items():
        base_row = baseline.get(key)
        if base_row is None:
            offenders.append(f"APPEARED {key}: now deltaPx={now_row['deltaPx']}")
            continue
        now_delta = abs(now_row["deltaPx"])
        base_delta = abs(base_row["deltaPx"])
        if now_delta > base_delta + GROWTH_EPSILON:
            offenders.append(
                f"GREW {key}: baseline deltaPx={base_row['deltaPx']} "
                f"now deltaPx={now_row['deltaPx']}"
            )
        elif base_row.get("match") is False and now_row.get("match") is True:
            went_exact += 1
    return went_exact, offenders


def print_fixture_counts(baseline_counts, now_counts):
    """Per-fixture row counts, printed only for fixtures whose count
    changed — the common case (an unchanged fixture) is not signal."""
    changed = sorted(
        fx
        for fx in set(baseline_counts) | set(now_counts)
        if baseline_counts.get(fx, 0) != now_counts.get(fx, 0)
    )
    if not changed:
        return
    print("Per-fixture row counts (baseline -> now):")
    for fx in changed:
        print(f"  {fx}: {baseline_counts.get(fx, 0)} -> {now_counts.get(fx, 0)}")


def main(argv):
    if len(argv) != 3:
        print(f"usage: {argv[0]} <baseline.jsonl> <now.jsonl>", file=sys.stderr)
        return 2
    baseline_rows, baseline_counts = load_rows(argv[1])
    now_rows, now_counts = load_rows(argv[2])

    went_exact, offenders = diff_rows(baseline_rows, now_rows)
    print_fixture_counts(baseline_counts, now_counts)

    if offenders:
        print(f"FAIL: {len(offenders)} rows appeared or grew:")
        for offender in offenders:
            print(f"  {offender}")
        return 1

    print(f"OK: {went_exact} rows went exact, 0 rows appeared or grew")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

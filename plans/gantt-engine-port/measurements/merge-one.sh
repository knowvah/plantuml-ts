#!/usr/bin/env bash
# gep close step 1 per task: --no-ff merge of gep/<Tn> into the mission branch
# (only when `git diff HEAD` is empty), then the gantt ratchets (once batch 7
# turns them on) and any test files named on the command line.
# Usage: merge-one.sh <Tn> "<merge subject>" [<test file or dir> ...]
# Never chain `git branch -D` on the same line (sdd3 row 104).
set -u
cd "$(git rev-parse --show-toplevel)"
t=${1:?Tn}; msg=${2:?subject}; shift 2
[ -z "$(git diff HEAD --stat)" ] || { echo "DIRTY tree, refusing"; exit 2; }
git merge --no-ff -q "gep/$t" -m "Merge gep/$t: $msg" || { echo "MERGE FAILED"; exit 3; }
git log --oneline -1
npx tsc --noEmit -p tsconfig.json 2>&1 | tail -3
npx vitest run tests/oracle/svg-conformance/gantt.golden.ratchet.test.ts tests/oracle/svg-conformance/gantt.diff-baseline.ratchet.test.ts "$@" --maxWorkers=2 --coverage.enabled=false 2>&1 \
  | grep -E 'Test Files|Tests |FAIL|✗|×|No test files' | head -20

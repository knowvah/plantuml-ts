#!/usr/bin/env bash
# lad close step 1 per task: --no-ff merge of lad/<Tn> into the mission branch
# (only when `git diff HEAD` is empty), then the authored lengthAdjust gate and
# any golden ratchet files named on the command line.
# Usage: merge-one.sh <Tn> "<merge subject>" [<ratchet test file> ...]
# Never chain `git branch -D` on the same line as this script (sdd3 row 104):
# delete the task branch only after reading a green result.
set -u
cd "$(git rev-parse --show-toplevel)"
t=${1:?Tn}; msg=${2:?subject}; shift 2
[ -z "$(git diff HEAD --stat)" ] || { echo "DIRTY tree, refusing"; exit 2; }
git merge --no-ff -q "lad/$t" -m "Merge lad/$t: $msg" || { echo "MERGE FAILED"; exit 3; }
git log --oneline -1
npx vitest run tests/oracle/svg-conformance/lengthadjust.authored.ratchet.test.ts "$@" --maxWorkers=2 2>&1 \
  | grep -E 'Test Files|Tests |FAIL|✗|×' | head -20

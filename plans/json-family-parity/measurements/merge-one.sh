#!/usr/bin/env bash
# jfp close step 1 per task (copied from ddc): --no-ff merge of jfp/<Tn> into
# the mission branch (only when `git diff HEAD` is empty), then typecheck, the
# json/yaml/hcl golden ratchets, the structural gate, the positional gate (D4, from b0 close), the extensions ratchet
# (extended mode), and any test files named on the command line.
# Usage: merge-one.sh <Tn> "<merge subject>" [<test file or dir> ...]
# Never chain `git branch -D` on the same line (sdd3 row 104).
set -u
cd "$(git rev-parse --show-toplevel)"
t=${1:?Tn}; msg=${2:?subject}; shift 2
[ -z "$(git diff HEAD --stat)" ] || { echo "DIRTY tree, refusing"; exit 2; }
git merge --no-ff -q "jfp/$t" -m "Merge jfp/$t: $msg" || { echo "MERGE FAILED"; exit 3; }
git log --oneline -1
npx tsc --noEmit -p tsconfig.json 2>&1 | tail -3
C=tests/oracle/svg-conformance
ratchets="$C/json.golden.ratchet.test.ts $C/yaml.golden.ratchet.test.ts $C/hcl.golden.ratchet.test.ts $C/json-family-structural.test.ts $C/json-family-positional.test.ts $C/extensions.ratchet.test.ts"
npx vitest run $ratchets "$@" --maxWorkers=2 --coverage.enabled=false 2>&1 \
  | grep -E 'Test Files|Tests |FAIL|✗|×|No test files' | head -20

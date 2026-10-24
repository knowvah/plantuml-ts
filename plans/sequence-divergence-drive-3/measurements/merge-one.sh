#!/usr/bin/env bash
# sdd3 close step 1 per task: --no-ff merge of sdd3/<Tn> into the mission
# branch (only when `git diff HEAD` is empty), then the golden ratchet and
# classify, diffing every row's ws against <prev-classify.json>.
# Usage: merge-one.sh <Tn> "<merge subject>" <prev-classify.json> <out-classify.json>
set -u
cd "$(git rev-parse --show-toplevel)"
t=${1:?Tn}; msg=${2:?subject}; prev=${3:?prev}; out=${4:?out}
T=plans/sequence-divergence-drive-3/tools
[ -z "$(git diff HEAD --stat)" ] || { echo "DIRTY tree, refusing"; exit 2; }
git merge --no-ff -q "sdd3/$t" -m "Merge sdd3/$t: $msg" || { echo "MERGE FAILED"; exit 3; }
git log --oneline -1
npx vitest run tests/oracle/svg-conformance/sequence.golden.ratchet.test.ts --maxWorkers=2 2>&1 | grep -E 'Test Files|Tests |FAIL|✗|×' | head -20
npx tsx $T/classify.mts "$out" 2>&1 | grep -E 'Error|error:' | head -5
node -e "
const a=require(process.argv[1]), p=require(process.argv[2]);
const idx=new Map(p.map(r=>[r.slug,r]));let s=0,z=0;for(const r of a){s+=r.ws;if(r.ws===0)z++;const q=idx.get(r.slug);if(!q)console.log('NEW',r.slug,r.ws);else if(q.ws!==r.ws)console.log(q.ws<r.ws?'ROSE':'fell',r.slug,q.ws,'->',r.ws)}
console.log('sum',s,'zero',z,'rows',a.length)" "$(pwd)/$out" "$(pwd)/$prev"

#!/usr/bin/env bash
# dur: census (component, usecase) + target render-diffs for a close. Usage: close-measure.sh bN
set -u
cd "$(git rev-parse --show-toplevel)"
M=plans/description-url-wrappers/measurements; b=${1:?bN}
npx tsx scripts/svg-conformance-census.ts component --json $M/$b-census.json > $M/$b-component-census.log 2>&1
npx tsx scripts/svg-conformance-census.ts usecase --json $M/$b-usecase-census.json > $M/$b-usecase-census.log 2>&1
for t in component usecase; do
  npx tsx scripts/svg-conformance-census.ts $t --per-fixture > $M/$b-$t-census-per-fixture.txt 2>&1
  npx tsx scripts/svg-conformance-census.ts $t --families > $M/$b-$t-census-families.txt 2>&1
done
mkdir -p $M/$b-rd
for r in $(grep -oE '^\| (component|usecase|unknown)/[a-z0-9-]+' plans/description-url-wrappers/fixtures.md | sed 's/^| //'); do
  npx jiti plans/class-divergence-drive/tools/render-diff.mts $r > $M/$b-rd/${r#*/}.txt 2>&1
done
node $M/census-sum.mjs $M/$b-census.json; node $M/census-sum.mjs $M/$b-usecase-census.json

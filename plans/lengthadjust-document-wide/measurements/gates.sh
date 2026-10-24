#!/usr/bin/env bash
# lad (copied from gtc): run the four gates into $M/<tag>-*; usage: gates.sh <tag>
set -u
cd "$(git rev-parse --show-toplevel)"
M=plans/lengthadjust-document-wide/measurements; t=${1:?tag}
echo "uptime: $(uptime)" > $M/$t-npm-test.log
npm test -- --maxWorkers=4 --reporter=default --reporter=json --outputFile.json=$M/$t-vitest.json >> $M/$t-npm-test.log 2>&1; echo "npm test exit $?" >> $M/$t-npm-test.log
npm run typecheck > $M/$t-typecheck.log 2>&1; echo "exit $?" >> $M/$t-typecheck.log
npm run lint > $M/$t-lint.log 2>&1; echo "exit $?" >> $M/$t-lint.log
npm run build > $M/$t-build.log 2>&1; echo "exit $?" >> $M/$t-build.log
{ du -sk dist; ls -l dist/*.js dist/*.mjs dist/*.cjs 2>/dev/null; find dist -name '*.js' -size +200k -exec ls -l {} \; ; } > $M/$t-size.txt
node -e "const j=require('./$M/$t-vitest.json');console.log('collected',j.testResults.length,'failedTests',j.numFailedTests,'passed',j.numPassedTests)" >> $M/$t-npm-test.log
echo "ondisk $(find tests -name '*.test.ts' -not -path 'tests/e2e/*' | wc -l)" >> $M/$t-npm-test.log
echo GATES_DONE

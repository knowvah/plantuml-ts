/** sep T5-cov: print our SVG for one authored fixture (DeterministicMeasurer). */
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { authoredSaltIncludeStore, readAuthoredSaltFixture, renderFixtureSalt } from '../../../../tests/oracle/svg-conformance/render-fixture-salt.js';
const slug = process.argv[2]!;
console.log(renderFixtureSalt(readAuthoredSaltFixture(slug).markup, new DeterministicMeasurer(), { includeStore: authoredSaltIncludeStore() }));

/**
 * `npx jiti plans/data-diagram-conformance/measurements/pin-files.mts <slug>... [--write] [--repo <root>] [--goldens <dir>]`
 *
 * The orchestrator's pin path for the svg-files golden ratchet (T0b's
 * `files.golden.ratchet.test.ts`, D1: files is byte-exact, D4): exactly
 * `pin-json-family.mts` with the type fixed to `files` -- cache
 * `test-results/dot-cache/files/<slug>`, goldens `oracle/goldens/svg-files/`,
 * refusal prefixes `svg-files/` and `files/`. Run `repin-files-routing.mts`
 * after every pin: the routing/refusal gates walk `oracle/goldens/svg-files/`
 * and demand a row per golden dir.
 */
import { pathToFileURL } from 'node:url';
import { runCli } from './pin-json-family.mts';

/* v8 ignore start -- CLI entry point; the logic is tested in pin-json-family.test.mts. */
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) runCli(process.argv.slice(2), 'pin-files.mts', 'files');
/* v8 ignore stop */

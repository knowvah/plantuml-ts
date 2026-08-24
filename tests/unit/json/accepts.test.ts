/**
 * json's and yaml's `accepts()` read structure out of text that is not
 * structure: a `@startuml` source is never even offered to the JSON/YAML
 * factories upstream -- `JsonDiagramFactory#getDiagramType()` is `JSON`
 * unconditionally, and `DiagramType.getTypes` only ever produces `JSON` from
 * the `@startjson` start token; `PSystemBuilder.java:258-259` then skips any
 * factory whose type is not in the block's candidate set. Upstream has NO
 * content heuristic here at all -- the start token is the entire gate.
 *
 * This port's dispatcher still needs a content heuristic for `@startuml`
 * blocks (`sequence`/`class`/`state`/`unknown`), because it resolves those by
 * scanning every plugin's `accepts()` in registration order (D1). The bug was
 * that heuristic accepting on a single character (`{`, `[`, a bare
 * word-then-colon) without checking that character actually opens something
 * JSON/YAML-shaped, so PlantUML's own syntax collided with it:
 *
 *   - `[-> Bob : message1`      -- sequence's "message from an actor outside
 *                                   the diagram" arrow, not a JSON array
 *   - `{start} [-> Bob : ...`   -- sequence's teoz timing anchor label, not a
 *                                   JSON object
 *   - `sprite Netw jar:...`     -- a sprite declaration, not a YAML key
 *   - `note over Alice : ...`   -- a note command, not a YAML key
 *   - `Title: Test`             -- CommandTitle's colon form
 *                                   (`title(?:[%s]*:[%s]*|[%s]+)`,
 *                                   CommandTitle.java:63), not a YAML key
 *
 * @see plans/routing-heuristic-repair/batch-2/T3-json-yaml-braces.md
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { jsonPlugin } from '../../../src/diagrams/json/index.js';
import { yamlPlugin } from '../../../src/diagrams/yaml/index.js';
import { preprocess } from '../../../src/core/preprocessor.js';
import { extractBlocks } from '../../../src/core/block-extractor.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

/** The extracted block's directive-stripped interior, exactly what the
 *  dispatcher hands to `accepts()` for an ambiguous-type `@startuml` block. */
function blockLinesOf(fixtureDir: string): readonly string[] {
  const source = readFileSync(join(fixtureDir, 'in.puml'), 'utf8');
  const { lines } = preprocess(source);
  return extractBlocks(lines)[0]!.lines;
}

// ---------------------------------------------------------------------------
// AC1 -- message-body braces and PlantUML colon syntax must not be claimed.
// ---------------------------------------------------------------------------

describe('jsonPlugin.accepts() no longer claims sequence-message braces', () => {
  it.each([
    ['[-> Bob : message1', 'the "message from an actor outside the diagram" arrow'],
    ['[<- Alice : dummy1', 'the "message to an actor outside the diagram" arrow'],
    ['SbcMXdCtrl->SbcMXdCtrl: struct timespec initialTimeout={1,0}', 'brace content inside message text'],
    ['{start} [-> Bob : start doing things', 'a teoz timing anchor label'],
    ['{end} Bob -> Alice : finish', 'a teoz timing anchor label'],
  ])('rejects %s (%s)', (line) => {
    expect(jsonPlugin.accepts(['@startuml', line, '@enduml'])).toBe(false);
  });
});

describe('yamlPlugin.accepts() no longer claims PlantUML colon syntax', () => {
  it.each([
    ['sprite Netw jar:archimate/network', 'a sprite declaration'],
    ['note over Alice : initial state of Alice', 'a note command'],
    ['Title: Test', 'CommandTitle\'s colon form'],
  ])('rejects %s (%s)', (line) => {
    expect(yamlPlugin.accepts(['@startuml', line, '@enduml'])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC2 -- a genuine @startjson / @startyaml source must still be claimed,
// verified against an existing oracle fixture rather than a synthetic one.
// ---------------------------------------------------------------------------

describe('jsonPlugin.accepts() still claims a genuine @startjson source', () => {
  it('accepts oracle/goldens/svg-json/lipuxo-26-susi944', () => {
    const dir = join(REPO_ROOT, 'oracle/goldens/svg-json/lipuxo-26-susi944');
    expect(jsonPlugin.accepts(blockLinesOf(dir))).toBe(true);
  });

  it('accepts a genuine JSON array root: oracle/goldens/svg-json/rutofu-66-kivu935', () => {
    const dir = join(REPO_ROOT, 'oracle/goldens/svg-json/rutofu-66-kivu935');
    expect(jsonPlugin.accepts(blockLinesOf(dir))).toBe(true);
  });
});

describe('yamlPlugin.accepts() still claims a genuine @startyaml source', () => {
  it('accepts oracle/goldens/svg-yaml/gipoxa-19-bico146', () => {
    const dir = join(REPO_ROOT, 'oracle/goldens/svg-yaml/gipoxa-19-bico146');
    expect(yamlPlugin.accepts(blockLinesOf(dir))).toBe(true);
  });

  it('accepts a genuine YAML list root: oracle/goldens/svg-yaml/finofu-94-daso450', () => {
    const dir = join(REPO_ROOT, 'oracle/goldens/svg-yaml/finofu-94-daso450');
    expect(yamlPlugin.accepts(blockLinesOf(dir))).toBe(true);
  });
});

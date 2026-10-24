/**
 * sdd3-T1c: a participant declaration's `[[url]]` is prefixed with
 * `skinparam topurl`.
 *
 * `CommandParticipant.java:187-192` (single-line) and
 * `CommandParticipantMultilines.java:163-168` (multi-line) both build
 * `new UrlBuilder(diagram.getSkinParam().getValue("topurl"), UrlMode.STRICT)`;
 * `UrlBuilder.withTopUrl` (`UrlBuilder.java:140-146`) prefixes `topurl` onto
 * any url that does not start with `http:`, `https:` or `file:`.
 */
import { describe, it, expect } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import type { SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import {
  parseParticipantDeclaration,
  participantUrlOf,
} from '../../../src/diagrams/sequence/sequence-participant-declaration.js';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

const TOPURL = 'http://www.google.com';

/** `src/index.ts#umlSourceOfBlock`'s widening: `skinparam` lines reach the
 *  parser only through the preprocessed block's `skinparamAssignments`. */
function sourceOf(body: readonly string[]): UmlSource {
  const block = buildBlockUmls(`@startuml\n${body.join('\n')}\n@enduml`)[0]!;
  if (!block.ok) throw new Error('preprocessor failure');
  return {
    ...block.source,
    stylePositions: block.preprocessed.stylePositions,
    skinparamAssignments: block.preprocessed.skinparamAssignments,
    styleSource: block.preprocessed,
  };
}

/** A bare participant-only body is a parse error; a message makes it a diagram. */
function parse(lines: string[]): SequenceDiagramAST {
  const result = parseSequence(sourceOf([...lines, 'Bob -> Alice : ok']));
  if ('refused' in result) throw new Error(`parseSequence refused: ${result.message}`);
  return result;
}

describe('participant url topurl (CommandParticipant.java:187-192)', () => {
  it('prefixes a relative url on a single-line declaration', () => {
    const ast = parse([`skinparam topurl ${TOPURL}`, 'participant Bob [[/search{This is bob}]]']);
    expect(ast.participants[0]!.url).toEqual({ url: `${TOPURL}/search`, tooltip: 'This is bob' });
  });

  it('leaves an absolute http url unchanged (UrlBuilder.java:141-142)', () => {
    const ast = parse([`skinparam topurl ${TOPURL}`, 'participant Alice [[http://www.sf.net]]']);
    expect(ast.participants[0]!.url?.url).toBe('http://www.sf.net');
  });

  it('leaves the url unchanged when no topurl is set', () => {
    const ast = parse(['participant Bob [[/search]]']);
    expect(ast.participants[0]!.url?.url).toBe('/search');
  });

  it('prefixes the multi-line form (CommandParticipantMultilines.java:163-168)', () => {
    const ast = parse([`skinparam topurl ${TOPURL}`, 'participant Bob [[/search]] [', 'line one', ']']);
    expect(ast.participants[0]!.url?.url).toBe(`${TOPURL}/search`);
  });

  it('prefixes a `create` declaration (same CommandParticipant.executeArg)', () => {
    const ast = parse([`skinparam topurl ${TOPURL}`, 'create participant Bob [[/search]]', 'Alice -> Bob : hi']);
    expect(ast.participants.find((p) => p.id === 'Bob')?.url?.url).toBe(`${TOPURL}/search`);
  });
});

describe('parseParticipantDeclaration topurl thunk', () => {
  it('reads topurl only when the declaration carries a url (CommandParticipant.java:185-187)', () => {
    let reads = 0;
    const readTopUrl = (): string => {
      reads += 1;
      return TOPURL;
    };
    expect(parseParticipantDeclaration('Bob', readTopUrl).url).toBeUndefined();
    expect(reads).toBe(0);
    expect(parseParticipantDeclaration('Bob [[/x]]', readTopUrl).url?.url).toBe(`${TOPURL}/x`);
    expect(reads).toBe(1);
  });

  it('participantUrlOf without topurl is unchanged (CommandUrl keeps its call shape)', () => {
    expect(participantUrlOf('[[/search]]')?.url).toBe('/search');
    expect(participantUrlOf('[[/search]]', TOPURL)?.url).toBe(`${TOPURL}/search`);
  });
});

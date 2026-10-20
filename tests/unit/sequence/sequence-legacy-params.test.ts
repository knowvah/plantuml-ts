/**
 * sdd1 T4a: the sequence dispatch's legacy `SkinParam#params` store
 * (`SkinParam.java:205`), filled by `setParam`'s params half (`:227-229`) at
 * each skinparam's own line (T1e), read through `getValue` (`:323-340`, with
 * its never-cleared `cacheKeyValue`) and `getHtmlColor` (`:371-396`,
 * `getParamName` `:424-432`, `HColorSet#getColorOrWhite` `HColorSet.java:58-63`).
 * Precedent: `src/diagrams/wbs/wbs-skin-param.ts:92-136`.
 */
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import {
  createSequenceStyleDispatch,
  executeDeclarationsBefore,
  SequenceLegacyParams,
  type SequenceStyleDispatch,
} from '../../../src/diagrams/sequence/sequence-skin-param.js';

/** `ColorParam.sequenceGroupBodyBackground` (`ColorParam.java:60`). */
const GROUP_BODY = 'sequenceGroupBodyBackground';

/** `src/index.ts#umlSourceOfBlock`'s widening, over a `@startuml` body. */
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

function dispatchOf(body: readonly string[]): SequenceStyleDispatch {
  return createSequenceStyleDispatch(sourceOf(body));
}

describe('SequenceLegacyParams (SkinParam#params)', () => {
  it('stores under cleanForKeySlow keys with a trin value (SkinParam.java:227-229)', () => {
    const params = new SequenceLegacyParams();
    params.setParam('Sequence_Group.BodyBackGroundColor', '  40112233 ');
    expect(params.getValue('sequencegroupbodybackgroundcolor')).toBe('40112233');
    expect(params.getValue('SEQUENCEGROUPBODYBACKGROUNDCOLOR')).toBe('40112233');
  });

  it('getValue is null for a key never set (SkinParam.java:338-339)', () => {
    expect(new SequenceLegacyParams().getValue('footbox')).toBeNull();
  });

  it('a later setParam overwrites a key not read yet', () => {
    const params = new SequenceLegacyParams();
    params.setParam('footbox', 'show');
    params.setParam('footbox', 'hide');
    expect(params.getValue('footbox')).toBe('hide');
  });

  it('getValue caches its first answer for good, null included (cacheKeyValue, SkinParam.java:323-340)', () => {
    const params = new SequenceLegacyParams();
    expect(params.getValue('footbox')).toBeNull();
    params.setParam('footbox', 'hide');
    expect(params.getValue('footbox')).toBeNull();

    const set = new SequenceLegacyParams();
    set.setParam('footbox', 'show');
    expect(set.getValue('footbox')).toBe('show');
    set.setParam('footbox', 'hide');
    expect(set.getValue('footbox')).toBe('show');
  });

  it('the cache is keyed by the key as read, not as cleaned', () => {
    const params = new SequenceLegacyParams();
    expect(params.getValue('footbox')).toBeNull();
    params.setParam('footbox', 'hide');
    expect(params.getValue('FootBox')).toBe('hide');
  });
});

describe('SequenceLegacyParams#getHtmlColorToken (getHtmlColor(param, null, false))', () => {
  function tokenOf(value: string): string | undefined {
    const params = new SequenceLegacyParams();
    params.setParam('sequenceGroupBodyBackgroundColor', value);
    return params.getHtmlColorToken(GROUP_BODY);
  }

  it('is undefined when the param is not set (SkinParam.java:383-384)', () => {
    expect(new SequenceLegacyParams().getHtmlColorToken(GROUP_BODY)).toBeUndefined();
  });

  it('reads `<param>color` (getParamName, SkinParam.java:424-432)', () => {
    expect(tokenOf('yellow')).toBe('yellow');
  });

  it('keeps a colour written without `#` as written (HColorSet.java:79-80 strips an optional `#`)', () => {
    expect(tokenOf('40112233')).toBe('40112233');
    expect(tokenOf('#40112233')).toBe('#40112233');
  });

  it('keeps `transparent`, which parseColor accepts (HColorSet.java:82-83)', () => {
    expect(tokenOf('transparent')).toBe('transparent');
  });

  it('an unparsable value is WHITE, as getColorOrWhite (HColorSet.java:58-63, HColors.java:87)', () => {
    expect(tokenOf('notacolour')).toBe('#FFFFFF');
  });
});

describe('the dispatch replays each skinparam into params at its own line (T1e)', () => {
  const BODY = ['A -> B', 'skinparam sequenceGroupBodyBackgroundColor yellow', 'C -> D'];

  it('a skinparam is not in params before its line is dispatched', () => {
    const dispatch = dispatchOf(BODY);
    expect(executeDeclarationsBefore(dispatch, 1)).toBeNull();
    expect(dispatch.params.getHtmlColorToken(GROUP_BODY)).toBeUndefined();
  });

  it('a skinparam is in params once its line is dispatched', () => {
    const dispatch = dispatchOf(BODY);
    expect(executeDeclarationsBefore(dispatch, Number.POSITIVE_INFINITY)).toBeNull();
    expect(dispatch.params.getHtmlColorToken(GROUP_BODY)).toBe('yellow');
  });

  it('a `skinparam sequence { … }` block entry reaches params under its full key', () => {
    const dispatch = dispatchOf(['skinparam sequence {', '  GroupBodyBackgroundColor 00FF0040', '}', 'A -> B']);
    expect(executeDeclarationsBefore(dispatch, Number.POSITIVE_INFINITY)).toBeNull();
    expect(dispatch.params.getHtmlColorToken(GROUP_BODY)).toBe('00FF0040');
  });

  it('a hand-built source without assignments replays its skinparam map', () => {
    const dispatch = createSequenceStyleDispatch({
      lines: [],
      type: 'sequence',
      styleSource: { skinparam: new Map([['sequencegroupbodybackgroundcolor', 'aqua']]), styles: [] },
    });
    expect(executeDeclarationsBefore(dispatch, Number.POSITIVE_INFINITY)).toBeNull();
    expect(dispatch.params.getHtmlColorToken(GROUP_BODY)).toBe('aqua');
  });
});

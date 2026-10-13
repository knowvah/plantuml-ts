/**
 * `SentenceDecoder` (eggs/SentenceDecoder.java). The jar's secrets stay
 * secret (D10): the positive path uses a payload built here and checked
 * against the jar through `jshell` (`EggUtils.xor("Hi|there".getBytes(UTF_8),
 * fromSecretSentence("abc def").toByteArray())` = `4fe3c573e2dc75ef`, decoded
 * by the jar's `SentenceDecoder` as ok, `Hi|there`).
 */
import { describe, expect, it } from 'vitest';

import { EggUtils } from '../../../src/diagrams/eggs/EggUtils.js';
import { SentenceDecoder } from '../../../src/diagrams/eggs/SentenceDecoder.js';

/** The jar's second encrypted sentence (PSystemEggFactory.java:51). */
const SECOND = EggUtils.toByteArrays('421e5b773c5df733a1194f716f18e8842155196b3b');

describe('SentenceDecoder', () => {
  it('decodes a payload xor-ed with the sentence key (java:47-51)', () => {
    const decoder = new SentenceDecoder('abc def', EggUtils.toByteArrays('4fe3c573e2dc75ef'));
    expect(decoder.isOk()).toBe(true);
    expect(decoder.getSecret()).toBe('Hi|there');
  });

  it('rejects a decode holding an ISO control char (java:59-61)', () => {
    const decoder = new SentenceDecoder('', EggUtils.toByteArrays('41094142'));
    expect(decoder.getSecret()).toBe('A\tAB');
    expect(decoder.isOk()).toBe(false);
  });

  it('rejects the C1 controls and DEL (Character.isISOControl)', () => {
    expect(new SentenceDecoder('', EggUtils.toByteArrays('7f')).isOk()).toBe(false);
    expect(new SentenceDecoder('', EggUtils.toByteArrays('c29f')).isOk()).toBe(false);
    expect(new SentenceDecoder('', EggUtils.toByteArrays('c2a0')).isOk()).toBe(true);
  });

  it('rejects a char above 256 (java:55-57) and keeps 256 itself', () => {
    expect(new SentenceDecoder('', EggUtils.toByteArrays('c480')).isOk()).toBe(true);
    expect(new SentenceDecoder('', EggUtils.toByteArrays('c481')).isOk()).toBe(false);
  });

  it('rejects malformed UTF-8 (decoded as U+FFFD)', () => {
    const decoder = new SentenceDecoder('', EggUtils.toByteArrays('ff'));
    expect(decoder.getSecret()).toBe('�');
    expect(decoder.isOk()).toBe(false);
  });

  it('does not decode charlie with the jar second secret (jshell: false, 20 chars)', () => {
    const decoder = new SentenceDecoder('charlie', SECOND);
    expect(decoder.isOk()).toBe(false);
    expect(decoder.getSecret()).toHaveLength(20);
  });
});

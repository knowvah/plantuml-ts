/**
 * `EggUtils` (eggs/EggUtils.java). Expected values are Java's own, printed by
 * `jshell --class-path oracle/dist/plantuml-oracle.jar` calling the jar's
 * `EggUtils` (1.2026.8beta1).
 */
import { describe, expect, it } from 'vitest';

import { EggUtils } from '../../../src/diagrams/eggs/EggUtils.js';

describe('EggUtils.fromSecretSentence (java:61-75)', () => {
  it('reads letters as base-26 digits, ignoring case and everything else', () => {
    expect(EggUtils.fromSecretSentence('Hello, World')).toBe(38933758647189n);
  });

  it('folds é and ê to e before reading (java:64-65)', () => {
    expect(EggUtils.fromSecretSentence('étê')).toBe(3202n);
  });

  it('skips letters outside a-z after lower-casing (convertChar, java:78-83)', () => {
    expect(EggUtils.fromSecretSentence('Ä1b')).toBe(1n);
  });

  it('keeps the first char of a multi-char lower case (goLowerCase(char), StringUtils.java:241-243)', () => {
    expect(EggUtils.fromSecretSentence('İx')).toBe(231n);
  });

  it('is zero for a sentence with no letters', () => {
    expect(EggUtils.fromSecretSentence('')).toBe(0n);
  });
});

describe('EggUtils.toByteArray (BigInteger#toByteArray)', () => {
  it('is big-endian two-complement, minimal', () => {
    expect(EggUtils.fromByteArrays(EggUtils.toByteArray(EggUtils.fromSecretSentence('Hello, World')))).toBe(
      '2368f8da9b95',
    );
  });

  it('adds a leading zero byte when the top bit is set', () => {
    expect(EggUtils.fromByteArrays(EggUtils.toByteArray(EggUtils.fromSecretSentence('zzzz')))).toBe('06f90f');
    expect(EggUtils.fromByteArrays(EggUtils.toByteArray(255n))).toBe('00ff');
  });

  it('is one zero byte for zero', () => {
    expect(EggUtils.fromByteArrays(EggUtils.toByteArray(0n))).toBe('00');
  });
});

describe('EggUtils hex and xor (java:43-59, :85-94)', () => {
  it('round-trips hex, two digits per byte', () => {
    expect(EggUtils.fromByteArrays(EggUtils.toByteArrays('00ff10'))).toBe('00ff10');
    expect([...EggUtils.toByteArrays('0aFF')]).toEqual([10, 255]);
  });

  it('cycles the key over the data', () => {
    expect(EggUtils.fromByteArrays(EggUtils.xor(EggUtils.toByteArrays('00ff10'), EggUtils.toByteArrays('0f01')))).toBe(
      '0ffe1f',
    );
  });
});

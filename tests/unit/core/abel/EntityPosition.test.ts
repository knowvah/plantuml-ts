/**
 * EntityPosition.test.ts — SI1/T2: the 9-value `EntityPosition` enum
 * (abel/EntityPosition.java:54), `RADIUS` (:56), the input/output/normal
 * sets (:58-68), predicates (:70-80, :182-188), `fromStereotype`
 * (:153-176).
 */
import { describe, expect, it } from 'vitest';
import {
  EntityPosition,
  RADIUS,
  fromStereotype,
  getInputs,
  getNormals,
  getOutputs,
  isInput,
  isNormal,
  isOutput,
  isPort,
  usePortP,
} from '../../../../src/core/abel/EntityPosition.js';

describe('EntityPosition values (java:54) and RADIUS (java:56)', () => {
  it('has exactly the 9 upstream values, in declaration order', () => {
    expect(Object.keys(EntityPosition)).toEqual([
      'NORMAL',
      'ENTRY_POINT',
      'EXIT_POINT',
      'INPUT_PIN',
      'OUTPUT_PIN',
      'EXPANSION_INPUT',
      'EXPANSION_OUTPUT',
      'PORTIN',
      'PORTOUT',
    ]);
  });

  it('RADIUS is 6', () => {
    expect(RADIUS).toBe(6);
  });
});

describe('getInputs/getOutputs/getNormals (java:58-68)', () => {
  it('inputs are ENTRY_POINT, INPUT_PIN, EXPANSION_INPUT, PORTIN', () => {
    expect(getInputs()).toEqual(
      new Set([
        EntityPosition.ENTRY_POINT,
        EntityPosition.INPUT_PIN,
        EntityPosition.EXPANSION_INPUT,
        EntityPosition.PORTIN,
      ]),
    );
  });

  it('outputs are EXIT_POINT, OUTPUT_PIN, EXPANSION_OUTPUT, PORTOUT', () => {
    expect(getOutputs()).toEqual(
      new Set([
        EntityPosition.EXIT_POINT,
        EntityPosition.OUTPUT_PIN,
        EntityPosition.EXPANSION_OUTPUT,
        EntityPosition.PORTOUT,
      ]),
    );
  });

  it('normals is exactly NORMAL', () => {
    expect(getNormals()).toEqual(new Set([EntityPosition.NORMAL]));
  });
});

describe('isNormal/isInput/isOutput (java:70-80)', () => {
  it('isNormal only for NORMAL', () => {
    expect(isNormal(EntityPosition.NORMAL)).toBe(true);
    expect(isNormal(EntityPosition.ENTRY_POINT)).toBe(false);
  });

  it('isInput/isOutput follow the sets', () => {
    expect(isInput(EntityPosition.PORTIN)).toBe(true);
    expect(isInput(EntityPosition.PORTOUT)).toBe(false);
    expect(isOutput(EntityPosition.PORTOUT)).toBe(true);
    expect(isOutput(EntityPosition.NORMAL)).toBe(false);
  });
});

describe('fromStereotype (java:153-176)', () => {
  it('maps each stereotype label, case-insensitively', () => {
    expect(fromStereotype('<<entrypoint>>')).toBe(EntityPosition.ENTRY_POINT);
    expect(fromStereotype('<<EntryPoint>>')).toBe(EntityPosition.ENTRY_POINT);
    expect(fromStereotype('<<exitpoint>>')).toBe(EntityPosition.EXIT_POINT);
    expect(fromStereotype('<<inputpin>>')).toBe(EntityPosition.INPUT_PIN);
    expect(fromStereotype('<<outputpin>>')).toBe(EntityPosition.OUTPUT_PIN);
    expect(fromStereotype('<<expansioninput>>')).toBe(EntityPosition.EXPANSION_INPUT);
    expect(fromStereotype('<<expansionoutput>>')).toBe(EntityPosition.EXPANSION_OUTPUT);
  });

  it('throws on <<port>> (java:154-155 UnsupportedOperationException)', () => {
    expect(() => fromStereotype('<<port>>')).toThrow();
    expect(() => fromStereotype('<<PORT>>')).toThrow();
  });

  it('defaults to NORMAL for anything else', () => {
    expect(fromStereotype('<<whatever>>')).toBe(EntityPosition.NORMAL);
    expect(fromStereotype('')).toBe(EntityPosition.NORMAL);
  });
});

describe('isPort/usePortP (java:182-188)', () => {
  it('isPort only for PORTIN/PORTOUT', () => {
    expect(isPort(EntityPosition.PORTIN)).toBe(true);
    expect(isPort(EntityPosition.PORTOUT)).toBe(true);
    expect(isPort(EntityPosition.ENTRY_POINT)).toBe(false);
  });

  it('usePortP adds ENTRY_POINT and EXIT_POINT', () => {
    expect(usePortP(EntityPosition.PORTIN)).toBe(true);
    expect(usePortP(EntityPosition.ENTRY_POINT)).toBe(true);
    expect(usePortP(EntityPosition.EXIT_POINT)).toBe(true);
    expect(usePortP(EntityPosition.INPUT_PIN)).toBe(false);
    expect(usePortP(EntityPosition.NORMAL)).toBe(false);
  });
});

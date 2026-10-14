/**
 * `DONORS` -- the donor names `PSystemDonors#getDonors` decodes at runtime
 * (`PSystemDonors.java:156-170`), decoded once by the generator (ufp T0e, D5).
 * The decode is mirrored here independently of the generator: AsciiEncoder
 * (`code/AsciiEncoder.java`) -> Brotli (`code/CompressionBrotli.java`) ->
 * UTF-8 -> `replace('*', '.')` -> `StringTokenizer(s, "\n")`.
 */
import { brotliDecompressSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

import { AsciiEncoder } from '../../../src/core/klimt/sprite/AsciiEncoder.js';
import { DONORS } from '../../../src/diagrams/donors/donors-list.js';

/** `PSystemDonors.DONORS`, verbatim from `PSystemDonors.java:73-96`. */
const DONORS_ENCODED = [
  '6r8F0AoFktsyGOBPua5wjfPR-fZcX3WHBCyJYiF0HZpT1SGVuDxfSR-H_YAwqhrlcZ5glPofDGbvnfSS',
  'iFHQuIQCt_d2eyvUFWIVD0A61iW0SLF_nZdioMcw8rM6bE3DT-Z-bidQawtZOb7pEH6u2g0IqPnYkvU9',
  'URr2AgNu_9MFq4yWcuBESwPH96fUuEQexQVO-vhxdpexbp1BToim0gEY4QhylkPOUxarxw9QL8c2dQ0A',
  'TepbL5gr7AgeZ2tBoCS-CD6QGpwgrAoACHUHOXYTD0mY4QZBnUXZvCMOL7wfD-73TLL8Hjq1dMqDT7tJ',
  'sZRFnFJpHH-XqWRVOAJ025YEn4sqV1v6KD5oG52pYsniKUN8apXGf48B_kKFXQcCafnT0JKLdGP067m7',
  'AeXafperd6qw3AYmn1Pj5guwrzzO6k_BybIc2mrF83Ow9bg1LOBy3xh1EsiTZqIrXq4HwIdH6BOSvNCe',
  'M-c75NrkrX910g1Jit1_-IYdahgEurdxTwu5uB2qVDV37CET4sZA4gh8-6X1nXNehBKWYzwx72oaGDZ7',
  'uPinTAuyj2p2DfvI5clxPMnxBVE7hhJ1-iGy1HR-FVPBhWKSQj9LaXR05rg5TEjyef2M-VVIuzj_tnEk',
  'AUIurotw25T8-kt7sCnO2D2-PKX3Dq4W2TobLMkn1H7g4TetG6iX6OHpf5ts4R-aZ_m4m5kM4CDX4qez',
  '-FDBKQQENAW93rsLnWfWQR6YRIfwZs1GgYdeObHnPRJnuolJEljODfOiYpvvNcem9dvDfoWsbYjKP8PX',
  'eHxHdFcsjfLs2MwNCNZLVM9b5T1QuJtanhrVP22VUyX49EyCnti-SiioJKZCufZhPKhF-cHoyz2D2yxi',
  'fYSpofH3bW6TtSberaUiiLbCVpF8PkIridWCO7mDHLlmCACOl7uqEQQQOofQcooYOeiGITRc5RkOS1P1',
  'dfOZoL5HGkKMgriX8RzjOn6HAd6Zr65pkZFm3EzHb9VppbdrcB_TIie2AbERm2KjIAkbOj-pBf2XUoSz',
  'Kos9C_vzOi6sz-M1mQ7qYecM7jm0c4AIBZ8F128HEWgbz58cXWM-xhUxrUDp7TBnjq-d68T83qa2L073',
  'sLvGZTJPHeIDzHh_VzEd9Ixy-TUwRPDJlRtttONGE4WMW0WlDAIS4q8y1JutDam6dCAIB3f9k7BMqek1',
  'o8ADZC4kwcoPqNRZ9ykDo4rlBn-gyAUhN5JOwGTqNBXIx7qkgJ9zCOEAsRxnZSL53W7_4bL6PNBlAgDP',
  'OIJYA6HnxCVfRKFJ5pf8mHgeJU3OtUyj5XgQQxyYgJGSW7oo8QdKhD2YQarBOoEmKaxixwquAMVMPsUY',
  '7zCwSrxLGzqaPzTJZ2Xy-oaqzmWJqqNSX8LmJyv934Rune9yKIsMnDAo3ZjDi8B_-tuCRoHiieCF5Ee9',
  'fJpJWXnXa-nzgoZ-8DvTn40M5ijq9x5Ool58YgHmhcoPd25zfKyufMyGWw9m_7ylGRZCHFCLaYwzgvFC',
  'vRTMamoYEDJF9Ab5obQB3EoRIovRl2AtRMtIOTl-1txYVFaZwkAR220GpONWDQUX3pVMgwbX2_ARETp7',
  'PRPk9Z-FIz7EKGbirYSRDS1cgE991647e49u3VrL_GbRpcNus_DKAepKyDnH3JruhWQMaQqql4WQrBp8',
  'OjhwVifDdXn8d00TKAawZPqUneneXKCjlscp98DAuauL_ti6qjqbLTwgc3JAaAXwWysIs3hlpD3fdDmg',
  'N5xFyVJ632dr2-eBWZs6kbpF3NW20meXhW05oLNpljMACsHKbbNZmoeKHWws5JKqsWmMsHtZqr0shvYj',
  'yUpO5i08L0pzWmjxZuP6JgXesUQ4CXiH1ObIQ0ieiySejc6VaYvkEJMTj_PENUY7pPDDDVeMbUB0EZoZ',
  'yWe1',
].join('');

function decodeMirror(encoded: string): string[] {
  const brotli = new AsciiEncoder().decode(encoded);
  const text = new TextDecoder().decode(brotliDecompressSync(brotli)).replaceAll('*', '.');
  return text.split('\n').filter((token) => token.length > 0);
}

describe('DONORS', () => {
  it('holds the 262 decoded names, first and last as upstream decodes them', () => {
    expect(DONORS).toHaveLength(262);
    expect(DONORS[0]).toBe('Al........er');
    expect(DONORS.at(-1)).toBe('Ha...........nn');
  });

  it('matches an independent decode of the upstream constant, name for name', () => {
    const decoded = decodeMirror(DONORS_ENCODED);
    expect(decoded[1]).toBe('Peter Antoniac');
    expect(DONORS[1]).toBe(decoded[1]);
    expect(DONORS).toEqual(decoded);
  });

  it('keeps non-ASCII names as UTF-8 decoded text', () => {
    expect(DONORS).toContain('Florian Müller');
    expect(DONORS).toContain('Đức Phan Nguyễn');
  });
});

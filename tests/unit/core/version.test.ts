/**
 * Fitness function: `VERSION` is "kept in step with package.json#version"
 * (its own doc comment). It drifted (0.1.0 vs 0.2.0) and the error banner,
 * the about page and the `version` page all printed an untrue version
 * (ufp journal row 36).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { VERSION } from '../../../src/core/version.js';

describe('VERSION', () => {
  it('equals package.json#version', () => {
    const pkg = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')) as {
      version: string;
    };
    expect(VERSION).toBe(pkg.version);
  });
});

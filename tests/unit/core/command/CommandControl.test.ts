import { describe, expect, it } from 'vitest';
import { CommandControl } from '../../../../src/core/command/CommandControl.js';

describe('CommandControl', () => {
  it('has the three upstream constants in order (CommandControl.java:38-40)', () => {
    expect(Object.keys(CommandControl)).toEqual(['OK', 'NOT_OK', 'OK_PARTIAL']);
    expect(CommandControl.OK).toBe('OK');
    expect(CommandControl.NOT_OK).toBe('NOT_OK');
    expect(CommandControl.OK_PARTIAL).toBe('OK_PARTIAL');
  });
});

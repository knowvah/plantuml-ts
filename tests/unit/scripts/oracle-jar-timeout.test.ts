/**
 * Unit tests for scripts/lib/oracle-jar-timeout.ts (code-review-tasks.md
 * item 3 — the shared oracle-jar subprocess timeout).
 */
import { describe, it, expect } from 'vitest';
import { ORACLE_JAR_TIMEOUT_MS, oracleJarBatchTimeoutMs } from '../../../scripts/lib/oracle-jar-timeout.js';

describe('ORACLE_JAR_TIMEOUT_MS', () => {
  it('is the unified single-fixture jar timeout in milliseconds', () => {
    expect(ORACLE_JAR_TIMEOUT_MS).toBe(25_000);
  });
});

describe('oracleJarBatchTimeoutMs', () => {
  it('scales the single-fixture budget by the batch size', () => {
    expect(oracleJarBatchTimeoutMs(1)).toBe(25_000);
    expect(oracleJarBatchTimeoutMs(120)).toBe(3_000_000);
  });
});

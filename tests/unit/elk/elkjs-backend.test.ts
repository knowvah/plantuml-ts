/**
 * The elkjs backend (cdd8 D2 backend 1): the shared contract, plus the
 * failure modes specific to driving elkjs's worker dispatcher synchronously.
 */
import { describe, expect, it } from 'vitest';

import { ElkBackendError } from '../../../src/core/elk/elk-backend.js';
import { createElkjsBackend, ELKJS_DISPATCHER_MISSING } from '../../../src/core/elk/elkjs-backend.js';
import { loadElk } from '../../../src/core/elk/load-elk.js';
import { CoreOptions } from '../../../src/core/elk/proxy/core/options/CoreOptions.js';
import { SizeConstraint } from '../../../src/core/elk/proxy/core/options/SizeConstraint.js';
import { runElkBackendContract } from './elk-backend.contract.js';

runElkBackendContract('elkjs 0.12.0', loadElk);

/** A worker module whose `Worker` builds `worker`, for driving the failure paths. */
function moduleWith(worker: object): { Worker: new () => object } {
  return {
    Worker: class {
      constructor() {
        return worker;
      }
    },
  };
}

function oneNodeLayout(module: unknown): () => void {
  const elk = createElkjsBackend(module);
  const root = elk.createGraph();
  elk.createNode(root).setDimensions(10, 10);
  return () => elk.layout(root);
}

describe('elkjs backend: the 0.12.0 pin (stop 15)', () => {
  it('names the pin when the worker has no dispatcher', () => {
    const run = oneNodeLayout(moduleWith({}));
    expect(run).toThrow(ElkBackendError);
    expect(run).toThrow('elkjs worker dispatcher not found — elkjs must be exactly 0.12.0');
    expect(ELKJS_DISPATCHER_MISSING).toBe('elkjs worker dispatcher not found — elkjs must be exactly 0.12.0');
  });

  it('names the pin when the dispatcher has no dispatch function', () => {
    expect(oneNodeLayout(moduleWith({ dispatcher: { dispatch: 'moved' } }))).toThrow(ELKJS_DISPATCHER_MISSING);
    expect(oneNodeLayout(moduleWith({ dispatcher: null }))).toThrow(ELKJS_DISPATCHER_MISSING);
  });

  it('names the pin when the module exports no Worker', () => {
    expect(() => createElkjsBackend({ default: {} })).toThrow(
      'elkjs worker module has no Worker constructor — elkjs must be exactly 0.12.0',
    );
    expect(() => createElkjsBackend(undefined)).toThrow(ElkBackendError);
  });

  it('accepts the Worker under the CommonJS default export', () => {
    const elk = createElkjsBackend({ default: moduleWith({}) });
    expect(elk.createGraph().getParent()).toBeNull();
  });

  it('fails when the dispatcher does not reply in the same tick', () => {
    const silent = { dispatcher: { dispatch: (): void => undefined }, onmessage: null };
    expect(oneNodeLayout(moduleWith(silent))).toThrow(
      'elkjs register did not reply synchronously — elkjs must be exactly 0.12.0',
    );
  });

  it('wraps a dispatcher exception with its cause', () => {
    const boom = new Error('boom');
    const throwing = {
      dispatcher: {
        dispatch: (): void => {
          throw boom;
        },
      },
      onmessage: null,
    };
    let caught: unknown;
    try {
      oneNodeLayout(moduleWith(throwing))();
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ElkBackendError);
    expect((caught as ElkBackendError).message).toBe('elkjs register failed');
    expect((caught as ElkBackendError).cause).toBe(boom);
  });

  it('surfaces an error reply', () => {
    const worker: { onmessage: ((e: { data: unknown }) => void) | null; dispatcher: object } = {
      onmessage: null,
      dispatcher: {
        dispatch: (event: { data: { id: number } }): void => {
          worker.onmessage?.({ data: { id: event.data.id, error: 'bad graph' } });
        },
      },
    };
    expect(oneNodeLayout(moduleWith(worker))).toThrow('elkjs register replied with an error');
  });
});

describe('elkjs backend: graph ownership and unported surface', () => {
  it('rejects a node created by another backend', async () => {
    const [first, second] = [await loadElk(), await loadElk()];
    const foreign = first.createGraph();
    expect(() => second.createNode(foreign)).toThrow(ElkBackendError);
    expect(() => second.layout(foreign)).toThrow('ElkNode was not created by this ElkBackend');
    expect(() => second.createLabel(foreign)).toThrow(ElkBackendError);
  });

  it('throws on ElkEdge.isHierarchical, as the proxy does', async () => {
    const elk = await loadElk();
    const root = elk.createGraph();
    const edge = elk.createSimpleEdge(elk.createNode(root), elk.createNode(root));
    expect(() => edge.isHierarchical()).toThrow('UnsupportedOperationException');
  });

  it('refuses a proxy EnumSet on an option with no effective-value analysis', async () => {
    const elk = await loadElk();
    const root = elk.createGraph();
    root.setProperty(CoreOptions.NODE_SIZE_CONSTRAINTS, new Set([SizeConstraint.NODE_LABELS]));
    expect(() => elk.layout(root)).toThrow(
      'org.eclipse.elk.nodeSize.constraints: no effective value is known for an EnumSet of proxy enums',
    );
  });

  it('refuses a value of the wrong type for its option', async () => {
    const elk = await loadElk();
    const root = elk.createGraph();
    root.setProperty(CoreOptions.DIRECTION, true);
    expect(() => elk.layout(root)).toThrow('org.eclipse.elk.direction expects an ENUM value');
  });
});

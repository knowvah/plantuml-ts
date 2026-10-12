/**
 * `ElkBackend` over elkjs 0.12.0 (cdd8 D2, backend 1), the same ELK release
 * as the jar's (`org.eclipse.elk.core` pom.properties `version=0.12.0`).
 *
 * elkjs's public API is asynchronous, but its worker module's `FakeWorker`
 * carries a `dispatcher` whose `dispatch` runs synchronously and answers
 * through `onmessage` in the same tick (elk-worker.js:79543-79595). The
 * backend drives that dispatcher directly, so `layout` is synchronous like
 * upstream's `RecursiveGraphLayoutEngine#layout`. That dispatcher is not
 * public API, which is why elkjs is pinned to exactly 0.12.0 and every way
 * it can move fails here with an `ElkBackendError` naming the pin (stop 15).
 */
import { ElkBackendError, type ElkBackend } from './elk-backend.js';
import { ElkjsEdge, ElkjsLabel, ElkjsNode, findBestEdgeContainment } from './elkjs-graph.js';
import { applyElkJson, toElkJson } from './elkjs-json.js';
import type { ElkEdge } from './proxy/graph/ElkEdge.js';
import type { ElkLabel } from './proxy/graph/ElkLabel.js';
import type { ElkNode } from './proxy/graph/ElkNode.js';

const PIN = 'elkjs must be exactly 0.12.0';
export const ELKJS_DISPATCHER_MISSING = `elkjs worker dispatcher not found — ${PIN}`;
const NOT_OURS = 'ElkNode was not created by this ElkBackend';

/**
 * The only algorithm the jar registers: its
 * `META-INF/services/org.eclipse.elk.core.data.ILayoutMetaDataProvider` lists
 * `LayeredMetaDataProvider` alone, and upstream never sets
 * `CoreOptions.ALGORITHM`, so ELK resolves the default to layered.
 */
const LAYOUT_ALGORITHMS: readonly string[] = ['layered'];

interface ElkjsDispatcher {
  dispatch(event: { data: Record<string, unknown> }): void;
}

interface ElkjsWorker {
  onmessage: ((event: { data: unknown }) => void) | null;
}

type WorkerConstructor = new () => object;

function workerConstructorOf(module: unknown): WorkerConstructor | undefined {
  if (typeof module !== 'object' || module === null) return undefined;
  const ctor: unknown = (module as Record<string, unknown>)['Worker'];
  if (typeof ctor === 'function') return ctor as WorkerConstructor;
  return workerConstructorOf((module as Record<string, unknown>)['default']);
}

/** `worker.dispatcher` (elk-worker.js:79584-79587), if it still has a `dispatch` function. */
function dispatcherOf(worker: object): ElkjsDispatcher {
  const dispatcher = (worker as { dispatcher?: unknown }).dispatcher;
  const dispatch =
    typeof dispatcher === 'object' && dispatcher !== null ? (dispatcher as { dispatch?: unknown }).dispatch : undefined;
  if (typeof dispatch !== 'function') throw new ElkBackendError(ELKJS_DISPATCHER_MISSING);
  return dispatcher as ElkjsDispatcher;
}

/** The reply `dispatch` posted for request `id`, or why there is none. */
function replyData(reply: unknown, id: number, cmd: string): unknown {
  if (typeof reply !== 'object' || reply === null || (reply as { id?: unknown }).id !== id) {
    throw new ElkBackendError(`elkjs ${cmd} did not reply synchronously — ${PIN}`);
  }
  if ('error' in reply) throw new ElkBackendError(`elkjs ${cmd} replied with an error`, { cause: reply.error });
  return (reply as { data?: unknown }).data;
}

/**
 * Concurrency contract: `reply` is written by the worker's `onmessage` during
 * `dispatch` and read straight after it, inside one synchronous `request`.
 * Nothing yields between the two, so no other request can interleave.
 */
class ElkjsBackend implements ElkBackend {
  private dispatcher: ElkjsDispatcher | undefined;
  private reply: unknown;
  private nextId = 0;

  constructor(private readonly Worker: WorkerConstructor) {}

  createGraph(): ElkNode {
    return new ElkjsNode(this, null);
  }

  createNode(root: ElkNode): ElkNode {
    return new ElkjsNode(this, this.own(root));
  }

  createLabel(owner: ElkEdge | ElkNode): ElkLabel {
    const label = new ElkjsLabel();
    if (owner instanceof ElkjsEdge && owner.source.owner === this) owner.labels.push(label);
    else this.own(owner).labels.push(label);
    return label;
  }

  /** `ElkGraphUtil#createSimpleEdge`: source, target, then `updateContainment`. */
  createSimpleEdge(node1: ElkNode, node2: ElkNode): ElkEdge {
    const source = this.own(node1);
    const target = this.own(node2);
    return new ElkjsEdge(source, target, findBestEdgeContainment(source, target));
  }

  layout(root: ElkNode): void {
    const node = this.own(root);
    const sent = toElkJson(node);
    const reply = this.request({ cmd: 'layout', graph: sent.graph, layoutOptions: {}, options: {} });
    applyElkJson(node, sent, reply);
  }

  private own(node: ElkNode | ElkEdge): ElkjsNode {
    if (node instanceof ElkjsNode && node.owner === this) return node;
    throw new ElkBackendError(NOT_OURS);
  }

  /** The worker, built and its algorithms registered on first use. */
  private ready(): ElkjsDispatcher {
    if (this.dispatcher !== undefined) return this.dispatcher;
    const worker = new this.Worker();
    const dispatcher = dispatcherOf(worker);
    (worker as ElkjsWorker).onmessage = (event) => {
      this.reply = event.data;
    };
    this.dispatcher = dispatcher;
    try {
      this.request({ cmd: 'register', algorithms: LAYOUT_ALGORITHMS });
    } catch (err) {
      this.dispatcher = undefined;
      throw err;
    }
    return dispatcher;
  }

  /** `dispatch`, not `saveDispatch`, so a layout exception reaches us instead of becoming a posted error. */
  private request(data: { readonly cmd: string } & Record<string, unknown>): unknown {
    const dispatcher = this.ready();
    const id = this.nextId++;
    this.reply = undefined;
    try {
      dispatcher.dispatch({ data: { ...data, id } });
    } catch (err) {
      throw new ElkBackendError(`elkjs ${data.cmd} failed`, { cause: err });
    }
    return replyData(this.reply, id, data.cmd);
  }
}

/**
 * A backend over an imported `elkjs/lib/elk-worker(.min).js` module: its
 * `Worker` export, directly or under the CommonJS `default`. The worker is
 * only built at the first `layout`.
 */
export function createElkjsBackend(workerModule: unknown): ElkBackend {
  const Worker = workerConstructorOf(workerModule);
  if (Worker === undefined) throw new ElkBackendError(`elkjs worker module has no Worker constructor — ${PIN}`);
  return new ElkjsBackend(Worker);
}

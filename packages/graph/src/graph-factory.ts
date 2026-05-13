/**
 * Composition root for graph elements.
 *
 * Lives between user code and the `ElkX` constructors. Two reasons it exists
 * rather than callers using `new ElkNode(...)` directly:
 *   1. Optional id auto-generation via an injected `IIdAllocator`.
 *   2. A single seam where validation, observability, or pooling can hook in
 *      later without touching call sites.
 *
 * The factory does no topology validation today — that lives in the JSON loader,
 * where it is needed. In-code construction is trusted.
 */

import { ElkEdge, type IElkEdgeInput } from './elk-edge.js';
import { ElkGraph, type IElkGraphInput } from './elk-graph.js';
import { ElkLabel, type IElkLabelInput } from './elk-label.js';
import { ElkNode, type IElkNodeInput } from './elk-node.js';
import { ElkPort, type IElkPortInput } from './elk-port.js';
import { InvalidGraphError } from './errors.js';
import { type GraphElementId } from './identity.js';
import { type IIdAllocator } from './i-id-allocator.js';

const MissingIdMessage = 'Element built without an id; configure GraphFactory with an allocator.';

type WithOptionalId<T extends { id: GraphElementId }> = Omit<T, 'id'> & {
  readonly id?: GraphElementId | undefined;
};

export interface IGraphFactoryOptions {
  readonly idAllocator?: IIdAllocator;
}

export class GraphFactory {
  private readonly idAllocator: IIdAllocator | undefined;

  constructor(options: IGraphFactoryOptions = {}) {
    this.idAllocator = options.idAllocator;
  }

  public createLabel(input: WithOptionalId<IElkLabelInput>): ElkLabel {
    return new ElkLabel({ ...input, id: this.resolveId(input.id) });
  }

  public createPort(input: WithOptionalId<IElkPortInput>): ElkPort {
    return new ElkPort({ ...input, id: this.resolveId(input.id) });
  }

  public createEdge(input: WithOptionalId<IElkEdgeInput>): ElkEdge {
    return new ElkEdge({ ...input, id: this.resolveId(input.id) });
  }

  public createNode(input: WithOptionalId<IElkNodeInput>): ElkNode {
    return new ElkNode({ ...input, id: this.resolveId(input.id) });
  }

  public createGraph(input: WithOptionalId<IElkGraphInput>): ElkGraph {
    return new ElkGraph({ ...input, id: this.resolveId(input.id) });
  }

  private resolveId(maybeId: GraphElementId | undefined): GraphElementId {
    if (maybeId !== undefined) {
      return maybeId;
    }
    if (this.idAllocator === undefined) {
      throw new InvalidGraphError(MissingIdMessage);
    }
    return this.idAllocator.next();
  }
}

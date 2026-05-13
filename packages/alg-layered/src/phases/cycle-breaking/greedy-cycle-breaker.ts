/**
 * Greedy DFS-based cycle breaker.
 *
 * Runs a depth-first traversal; any edge that points to a node currently on
 * the DFS stack is a back edge. The phase rebuilds the layered adjacency with
 * those edges reversed, turning the graph into a DAG that the longest-path
 * layerer can consume. Self-loops are dropped since they cannot be flipped.
 *
 * Greedy because the choice of back edges depends on the DFS start order;
 * a more sophisticated implementation minimizes total reversed-edge weight
 * (the feedback-arc-set problem). Sufficient for ~50-node graphs.
 */

import { LayeredPhase } from '../../enums.js';
import { type ICycleBreaker } from '../../i-cycle-breaker.js';
import { appendUnique } from '../../model/adjacency.js';
import { type LayeredContext } from '../../model/layered-context.js';
import { type LNode } from '../../model/l-node.js';

interface IDfsState {
  readonly visited: Set<LNode>;
  readonly onStack: Set<LNode>;
  readonly backEdgesBySource: Map<LNode, Set<LNode>>;
}

interface IAdjacencyPair {
  readonly successors: ReadonlyMap<LNode, readonly LNode[]>;
  readonly predecessors: ReadonlyMap<LNode, readonly LNode[]>;
}

interface IMutableAdjacency {
  readonly successors: Map<LNode, LNode[]>;
  readonly predecessors: Map<LNode, LNode[]>;
}

export class GreedyCycleBreaker implements ICycleBreaker {
  public readonly phase = LayeredPhase.CycleBreaking;

  public execute(context: LayeredContext): void {
    const backEdges = this.findBackEdges(context);
    if (backEdges.size === 0) {
      return;
    }
    const { successors, predecessors } = this.buildReversedAdjacency(context, backEdges);
    context.replaceAdjacency(successors, predecessors);
  }

  private findBackEdges(context: LayeredContext): Map<LNode, Set<LNode>> {
    const state: IDfsState = {
      visited: new Set(),
      onStack: new Set(),
      backEdgesBySource: new Map(),
    };
    for (const node of context.nodes) {
      if (!state.visited.has(node)) {
        this.dfs(node, context, state);
      }
    }
    return state.backEdgesBySource;
  }

  private dfs(node: LNode, context: LayeredContext, state: IDfsState): void {
    state.visited.add(node);
    state.onStack.add(node);
    for (const successor of context.successorsOf(node)) {
      if (state.onStack.has(successor)) {
        this.markBackEdge(state.backEdgesBySource, node, successor);
      } else if (!state.visited.has(successor)) {
        this.dfs(successor, context, state);
      }
    }
    state.onStack.delete(node);
  }

  private markBackEdge(map: Map<LNode, Set<LNode>>, source: LNode, target: LNode): void {
    const existing = map.get(source);
    if (existing === undefined) {
      map.set(source, new Set([target]));
      return;
    }
    existing.add(target);
  }

  private buildReversedAdjacency(
    context: LayeredContext,
    backEdges: ReadonlyMap<LNode, ReadonlySet<LNode>>,
  ): IAdjacencyPair {
    const adjacency: IMutableAdjacency = { successors: new Map(), predecessors: new Map() };
    for (const source of context.nodes) {
      for (const target of context.successorsOf(source)) {
        this.placeEdge(source, target, backEdges, adjacency);
      }
    }
    return adjacency;
  }

  private placeEdge(
    source: LNode,
    target: LNode,
    backEdges: ReadonlyMap<LNode, ReadonlySet<LNode>>,
    adjacency: IMutableAdjacency,
  ): void {
    if (source === target) {
      return; // self-loops cannot be flipped; drop them from the layered view.
    }
    const reversed = backEdges.get(source)?.has(target) === true;
    const [from, to] = reversed ? [target, source] : [source, target];
    appendUnique(adjacency.successors, from, to);
    appendUnique(adjacency.predecessors, to, from);
  }
}

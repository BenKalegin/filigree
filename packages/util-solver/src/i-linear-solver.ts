/**
 * Abstraction over the linear-programming-like solver used by the layered
 * algorithm (network simplex, longest path).
 *
 * Concrete implementations are interchangeable: the layered pipeline does not
 * know whether it is running on top of a network-simplex layerer or a
 * longest-path layerer.
 */

export interface ILinearConstraint {
  readonly leftVariableId: string;
  readonly rightVariableId: string;
  readonly minimumGap: number;
}

export interface ILinearSolverInput {
  readonly variableIds: readonly string[];
  readonly constraints: readonly ILinearConstraint[];
}

export interface ILinearSolverResult {
  readonly assignment: ReadonlyMap<string, number>;
}

export interface ILinearSolver {
  solve(input: ILinearSolverInput): ILinearSolverResult;
}

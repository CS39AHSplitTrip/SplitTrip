// SplitTrip: how close the group is to its trip budget (#50).
// The bar turns yellow once the group has spent 80% of the budget, and red once
// it has spent more than the budget.
export const BUDGET_WARNING_RATIO = 0.8

export type BudgetStatus = 'ok' | 'warning' | 'over'

export function getBudgetProgress(spent: number, budget: number) {
  const ratio = spent / budget
  const status: BudgetStatus =
    spent > budget ? 'over' : ratio >= BUDGET_WARNING_RATIO ? 'warning' : 'ok'
  return {
    status,
    // How full the bar is, from 0 to 100
    percent: Math.min(100, Math.max(0, Math.round(ratio * 100))),
    overBy: Math.max(0, spent - budget),
  }
}

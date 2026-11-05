import { getGroupExpenses } from '@/lib/api'
import { getTotalGroupSpending } from '@/lib/totals'
import { baseProcedure } from '@/trpc/init'
import { z } from 'zod'

/**
 * SplitTrip: how much the group has spent so far, for the trip budget bar on
 * the Expenses tab (#50). Uses the same total as the stats page, so
 * reimbursements don't count as spending. Lives under `stats` so saving an
 * expense refreshes it along with the other totals.
 */
export const getStatsBudgetProcedure = baseProcedure
  .input(z.object({ groupId: z.string().min(1) }))
  .query(async ({ input: { groupId } }) => {
    const expenses = await getGroupExpenses(groupId)
    return { spent: getTotalGroupSpending(expenses) }
  })

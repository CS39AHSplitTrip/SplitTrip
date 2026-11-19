import { getGroupExpenses } from '@/lib/api'
import { getShareByParticipant } from '@/lib/totals'
import { baseProcedure } from '@/trpc/init'
import { z } from 'zod'

/**
 * SplitTrip: each member's share of the expenses, for the spending limits on
 * the Balances tab (#51). Lives under `stats` so saving an expense refreshes
 * it along with the other totals.
 */
export const getStatsSpendingProcedure = baseProcedure
  .input(z.object({ groupId: z.string().min(1) }))
  .query(async ({ input: { groupId } }) => {
    const expenses = await getGroupExpenses(groupId)
    return { shares: getShareByParticipant(expenses) }
  })

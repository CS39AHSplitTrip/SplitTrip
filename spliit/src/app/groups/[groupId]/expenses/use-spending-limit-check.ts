'use client'

import { useToast } from '@/components/ui/use-toast'
import { getMembersNewlyOverLimit } from '@/lib/spending-limit'
import { trpc } from '@/trpc/client'
import { useTranslations } from 'next-intl'

type Member = { id: string; name: string; spendingLimit: number | null }

// SplitTrip: wraps saving an expense, and afterwards shows "Boris is now over
// their spending limit" for anyone the save pushed over (#51). The expense is
// saved either way. Groups where nobody has a limit skip the extra queries.
export function useSpendingLimitCheck(groupId: string, participants: Member[]) {
  const utils = trpc.useUtils()
  const { toast } = useToast()
  const t = useTranslations('Balances.SpendingLimits')
  const hasLimits = participants.some((p) => p.spendingLimit !== null)

  return async (save: () => Promise<void>) => {
    if (!hasLimits) return save()

    // staleTime 0 so we compare against the shares right before this save
    const before = await utils.groups.stats.spending
      .fetch({ groupId }, { staleTime: 0 })
      .catch(() => null)
    await save()
    if (!before) return
    await utils.groups.stats.invalidate()
    const after = await utils.groups.stats.spending
      .fetch({ groupId })
      .catch(() => null)
    if (!after) return

    for (const { name } of getMembersNewlyOverLimit(
      participants,
      before.shares,
      after.shares,
    )) {
      toast({ description: t('nowOver', { name }) })
    }
  }
}

'use client'

import { getBudgetProgress } from '@/lib/budget'
import { cn, formatCurrency, getCurrencyFromGroup } from '@/lib/utils'
import { trpc } from '@/trpc/client'
import { useLocale, useTranslations } from 'next-intl'
import { useCurrentGroup } from '../current-group-context'

// SplitTrip: the trip budget bar at the top of the Expenses tab (#50).
// Shows nothing when the group has no budget.
export function BudgetProgress() {
  const { groupId, group } = useCurrentGroup()
  const t = useTranslations('Expenses.Budget')
  const locale = useLocale()
  const budget = group?.budget ?? null

  const { data } = trpc.groups.stats.budget.useQuery(
    { groupId },
    { enabled: budget !== null },
  )

  if (!group || budget === null || !data) return null

  const currency = getCurrencyFromGroup(group)
  const format = (amount: number) => formatCurrency(currency, amount, locale)
  const { status, percent, overBy } = getBudgetProgress(data.spent, budget)
  const spentLabel = t('spent', {
    spent: format(data.spent),
    budget: format(budget),
  })

  return (
    <div className="px-4 sm:px-6 flex flex-col gap-1.5">
      <div className="flex justify-between gap-2 text-sm">
        <span>{spentLabel}</span>
        {status === 'over' && (
          <span className="font-medium text-red-600 dark:text-red-400">
            {t('over', { amount: format(overBy) })}
          </span>
        )}
      </div>
      <div
        role="progressbar"
        data-status={status}
        aria-label={spentLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn(
            'h-full rounded-full transition-all',
            status === 'ok' && 'bg-primary',
            status === 'warning' && 'bg-yellow-500',
            status === 'over' && 'bg-red-600',
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

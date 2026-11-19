'use client'

import { Participant } from '@/generated/prisma/browser'
import { getBudgetProgress } from '@/lib/budget'
import { Currency } from '@/lib/currency'
import { cn, formatCurrency } from '@/lib/utils'
import { trpc } from '@/trpc/client'
import { useLocale, useTranslations } from 'next-intl'

// SplitTrip: "Spent €210.00 of €300.00" for each member with a spending limit,
// under the balances (#51). Shows nothing when nobody has a limit.
export function SpendingLimits({
  groupId,
  participants,
  currency,
}: {
  groupId: string
  participants: Participant[]
  currency: Currency
}) {
  const t = useTranslations('Balances.SpendingLimits')
  const locale = useLocale()
  const withLimit = participants.filter((p) => p.spendingLimit !== null)

  const { data } = trpc.groups.stats.spending.useQuery(
    { groupId },
    { enabled: withLimit.length > 0 },
  )

  if (withLimit.length === 0 || !data) return null

  const format = (amount: number) => formatCurrency(currency, amount, locale)

  return (
    <div className="mt-6 flex flex-col gap-4 text-sm">
      <h3 className="font-medium">{t('title')}</h3>
      {withLimit.map((participant) => {
        const limit = participant.spendingLimit!
        const spent = data.shares[participant.id] ?? 0
        const { status, percent, overBy } = getBudgetProgress(spent, limit)
        const spentLabel = t('spent', {
          spent: format(spent),
          limit: format(limit),
        })
        return (
          <div
            key={participant.id}
            className="flex flex-col gap-1.5"
            data-testid="spending-limit-row"
            data-participant={participant.name}
            data-status={status}
          >
            <div className="flex flex-wrap justify-between gap-x-2">
              <span>
                <strong>{participant.name}</strong> {spentLabel}
              </span>
              {status === 'over' && (
                <span className="font-medium text-red-600 dark:text-red-400">
                  {t('over', { amount: format(overBy) })}
                </span>
              )}
            </div>
            <div
              role="progressbar"
              aria-label={`${participant.name}: ${spentLabel}`}
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
      })}
    </div>
  )
}

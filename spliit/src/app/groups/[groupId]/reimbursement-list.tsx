import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Participant } from '@/generated/prisma/browser'
import { Reimbursement } from '@/lib/balances'
import {
  getReimbursementExpense,
  getReimbursementKey,
} from '@/lib/confirm-payment'
import { Currency, getCurrency } from '@/lib/currency'
import { useActiveUser, useUsdRate } from '@/lib/hooks'
import {
  getPaymentLinks,
  getRateLabel,
  parseCustomRate,
  PaymentApp,
  toUsdCents,
} from '@/lib/payment-links'
import { formatCurrency } from '@/lib/utils'
import { trpc } from '@/trpc/client'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'

// SplitTrip: the app names on the "Pay with…" buttons (#28)
const paymentAppNames: Record<PaymentApp, string> = {
  venmo: 'Venmo',
  paypal: 'PayPal',
  cashApp: 'Cash App',
}

type Props = {
  reimbursements: Reimbursement[]
  participants: Participant[]
  currency: Currency
  groupId: string
}

export function ReimbursementList({
  reimbursements,
  participants,
  currency,
  groupId,
}: Props) {
  const locale = useLocale()
  const t = useTranslations('Balances.Reimbursements')
  const tExpense = useTranslations('ExpenseForm')
  const { toast } = useToast()
  const utils = trpc.useUtils()
  const activeUserId = useActiveUser(groupId)
  const { mutateAsync: createExpense, isPending: isSaving } =
    trpc.groups.expenses.create.useMutation()

  // SplitTrip: non-USD groups get today's dollar rate so the Pay buttons
  // still work, e.g. €90.00 ≈ $97.20 (#42). Balances stay in the group's currency.
  const isUsd = currency.code === 'USD'
  const needsUsdRate = !isUsd && currency.code.length > 0
  const usd = useUsdRate(currency.code)
  const usdCurrency = getCurrency('USD')
  // The rate box reads like the label: "1 USD = [ ] MXN" for weaker currencies.
  // With no Frankfurter rate we guess USD first, since most missing ones are.
  const usdFirst = usd.rate ? usd.rate < 1 : true

  // SplitTrip: rates people typed in with "Use my own rate", one per transfer (#43).
  // Only kept in memory, so a reload goes back to Frankfurter's rate.
  const [customRates, setCustomRates] = useState<Record<string, string>>({})
  const setCustomRate = (key: string, value: string | undefined) =>
    setCustomRates(({ [key]: _, ...rest }) =>
      value === undefined ? rest : { ...rest, [key]: value },
    )
  // "1 USD = 17.25 MXN" or "1 EUR = 1.1224 USD", whichever is easier to read
  const rateLabel = (usdRate: number) => {
    const { from, to, rate } = getRateLabel(currency.code, usdRate)
    return {
      from,
      to,
      rate: rate.toLocaleString(locale, {
        maximumFractionDigits: rate >= 10 ? 2 : 4,
      }),
    }
  }

  // SplitTrip: the transfer someone tapped "Pay with…" on, and the one we're
  // asking "Did you pay…?" about once they come back to the tab (#29).
  // It's also kept in sessionStorage, because phones often reload the page
  // after you switch to the payment app and back.
  const storageKey = `${groupId}-pendingPayment`
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [askingKey, setAskingKey] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (saved) {
        setPendingKey(saved)
        setAskingKey(saved)
      }
    } catch {}
  }, [storageKey])

  useEffect(() => {
    if (!pendingKey) return
    const onReturn = () => {
      if (document.visibilityState === 'visible') setAskingKey(pendingKey)
    }
    document.addEventListener('visibilitychange', onReturn)
    window.addEventListener('focus', onReturn)
    return () => {
      document.removeEventListener('visibilitychange', onReturn)
      window.removeEventListener('focus', onReturn)
    }
  }, [pendingKey])

  const startPayment = (key: string) => {
    setPendingKey(key)
    setAskingKey(null)
    try {
      sessionStorage.setItem(storageKey, key)
    } catch {}
  }

  const forgetPayment = () => {
    setPendingKey(null)
    setAskingKey(null)
    try {
      sessionStorage.removeItem(storageKey)
    } catch {}
  }

  // "Yes, I paid": saves the same reimbursement as "Mark as paid", minus the form
  const confirmPayment = async (reimbursement: Reimbursement) => {
    try {
      await createExpense({
        groupId,
        expenseFormValues: getReimbursementExpense(
          reimbursement,
          tExpense('reimbursement'),
        ),
        participantId: activeUserId ?? undefined,
      })
    } catch {
      toast({ description: t('confirmFailed'), variant: 'destructive' })
      return
    }
    forgetPayment()
    utils.groups.balances.invalidate()
    utils.groups.expenses.invalidate()
    utils.groups.activities.invalidate()
    utils.groups.stats.invalidate()
  }

  if (reimbursements.length === 0) {
    return <p className="text-sm pb-6">{t('noImbursements')}</p>
  }

  const getParticipant = (id: string) => participants.find((p) => p.id === id)
  return (
    <div className="text-sm">
      {reimbursements.map((reimbursement, index) => {
        // SplitTrip: the person getting paid, and the apps they can be paid on (#28)
        const payee = getParticipant(reimbursement.to)
        const key = getReimbursementKey(reimbursement)

        // SplitTrip: their own rate wins over Frankfurter's if it's valid (#43)
        const typedRate = customRates[key]
        const showRateField =
          needsUsdRate && (typedRate !== undefined || !!usd.error)
        const customRate =
          typedRate !== undefined ? parseCustomRate(typedRate, usdFirst) : null
        const rateError = !!typedRate?.trim() && customRate === null
        const usdRate = customRate ?? usd.rate

        const paymentLinks = payee
          ? getPaymentLinks(payee, reimbursement.amount, currency, usdRate)
          : []
        return (
          <div
            className="py-4"
            key={index}
            data-testid="reimbursement-row"
            data-from={getParticipant(reimbursement.from)?.name ?? ''}
            data-to={payee?.name ?? ''}
          >
            <div className="flex justify-between">
              <div className="flex flex-col gap-1 items-start sm:flex-row sm:items-baseline sm:gap-4">
                <div>
                  {t.rich('owes', {
                    from: getParticipant(reimbursement.from)?.name ?? '',
                    to: payee?.name ?? '',
                    strong: (chunks) => <strong>{chunks}</strong>,
                  })}
                </div>
                <Button variant="link" asChild className="-mx-4 -my-3">
                  <Link
                    href={`/groups/${groupId}/expenses/create?reimbursement=yes&from=${reimbursement.from}&to=${reimbursement.to}&amount=${reimbursement.amount}`}
                  >
                    {t('markAsPaid')}
                  </Link>
                </Button>
              </div>
              <div className="text-right">
                {formatCurrency(currency, reimbursement.amount, locale)}
                {/* SplitTrip: the same amount in dollars, for non-USD groups (#42) */}
                {needsUsdRate && usdRate && (
                  <span data-testid="usd-amount">
                    {' ≈ '}
                    {formatCurrency(
                      usdCurrency,
                      toUsdCents(reimbursement.amount, currency, usdRate),
                      locale,
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* SplitTrip: the rate they typed in (#43) */}
            {needsUsdRate && customRate && (
              <p className="mt-1 text-xs text-muted-foreground text-right">
                {t('customRate', rateLabel(customRate))}
              </p>
            )}

            {/* SplitTrip: which rate we used and what day it's from (#42) */}
            {needsUsdRate && !customRate && usd.rate && usd.date && (
              <p className="mt-1 text-xs text-muted-foreground text-right">
                {t('usdRate', {
                  ...rateLabel(usd.rate),
                  date: new Date(usd.date).toLocaleDateString(locale, {
                    month: 'short',
                    day: 'numeric',
                    // Frankfurter's date is a plain day, so read it in UTC
                    timeZone: 'UTC',
                  }),
                })}{' '}
                {/* SplitTrip: lets them type the rate they actually got (#43) */}
                {typedRate === undefined && (
                  <button
                    type="button"
                    className="underline underline-offset-4"
                    onClick={() => setCustomRate(key, '')}
                  >
                    {t('useMyRate')}
                  </button>
                )}
              </p>
            )}

            {/* SplitTrip: Frankfurter failed or doesn't have this currency (#42) */}
            {needsUsdRate && usd.error && (
              <p className="mt-2 text-muted-foreground">{t('noUsdRate')}</p>
            )}

            {/* SplitTrip: the "Use my own rate" box. It opens right away when
                Frankfurter has no rate, so they can still pay (#43) */}
            {showRateField && (
              <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                <span>1 {usdFirst ? 'USD' : currency.code} =</span>
                <Input
                  className="w-24 h-8"
                  inputMode="decimal"
                  aria-label={t('rateFieldLabel')}
                  aria-invalid={rateError}
                  data-testid="custom-rate"
                  // Jump straight into the box after tapping "Use my own rate"
                  autoFocus={typedRate !== undefined}
                  value={typedRate ?? ''}
                  onChange={(event) => setCustomRate(key, event.target.value)}
                />
                <span>{usdFirst ? currency.code : 'USD'}</span>
                {usd.rate && (
                  <Button
                    variant="link"
                    size="sm"
                    className="px-1"
                    onClick={() => setCustomRate(key, undefined)}
                  >
                    {t('useTodaysRate')}
                  </Button>
                )}
                {rateError && (
                  <p className="w-full text-right text-destructive">
                    {t('invalidRate')}
                  </p>
                )}
              </div>
            )}

            {/* SplitTrip: "Pay with…" buttons, one for each app the person getting paid signed up for (#28) */}
            {paymentLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {paymentLinks.map(({ app, url }) => (
                  <Button key={app} variant="outline" size="sm" asChild>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => startPayment(key)}
                    >
                      {t('payWith', { app: paymentAppNames[app] })}
                    </a>
                  </Button>
                ))}
              </div>
            )}

            {/* SplitTrip: back from the payment app, so we ask if they paid (#29) */}
            {askingKey === key && (
              <div
                className="mt-2 p-3 rounded-md border bg-muted/50 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                role="status"
                data-testid="confirm-payment"
              >
                <p>
                  {t('didYouPay', {
                    name: payee?.name ?? '',
                    amount: formatCurrency(
                      currency,
                      reimbursement.amount,
                      locale,
                    ),
                  })}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={isSaving}
                    onClick={() => confirmPayment(reimbursement)}
                  >
                    {t('yesIPaid')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSaving}
                    onClick={forgetPayment}
                  >
                    {t('notYet')}
                  </Button>
                </div>
              </div>
            )}

            {/* SplitTrip: no payment apps yet, so we nudge them to add one in Settings (#28) */}
            {paymentLinks.length === 0 &&
              payee &&
              (isUsd || (needsUsdRate && usdRate)) && (
                <p className="mt-2 text-muted-foreground">
                  {t('noPaymentApp', { name: payee.name })}{' '}
                  <Link
                    href={`/groups/${groupId}/edit`}
                    className="underline underline-offset-4"
                  >
                    {t('addPaymentApp')}
                  </Link>
                </p>
              )}
          </div>
        )
      })}
    </div>
  )
}

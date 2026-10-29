import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Participant } from '@/generated/prisma/browser'
import { Reimbursement } from '@/lib/balances'
import {
  getReimbursementExpense,
  getReimbursementKey,
} from '@/lib/confirm-payment'
import { Currency } from '@/lib/currency'
import { useActiveUser } from '@/lib/hooks'
import { getPaymentLinks, PaymentApp } from '@/lib/payment-links'
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
        const paymentLinks = payee
          ? getPaymentLinks(payee, reimbursement.amount, currency)
          : []
        const key = getReimbursementKey(reimbursement)
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
              <div>
                {formatCurrency(currency, reimbursement.amount, locale)}
              </div>
            </div>

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
            {paymentLinks.length === 0 && payee && currency.code === 'USD' && (
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

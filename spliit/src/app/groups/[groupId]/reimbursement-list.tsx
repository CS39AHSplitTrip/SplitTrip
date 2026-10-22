import { Button } from '@/components/ui/button'
import { Participant } from '@/generated/prisma/browser'
import { Reimbursement } from '@/lib/balances'
import { Currency } from '@/lib/currency'
import { getPaymentLinks, PaymentApp } from '@/lib/payment-links'
import { formatCurrency } from '@/lib/utils'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'

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
              <div>{formatCurrency(currency, reimbursement.amount, locale)}</div>
            </div>

            {/* SplitTrip: "Pay with…" buttons, one for each app the person getting paid signed up for (#28) */}
            {paymentLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {paymentLinks.map(({ app, url }) => (
                  <Button key={app} variant="outline" size="sm" asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {t('payWith', { app: paymentAppNames[app] })}
                    </a>
                  </Button>
                ))}
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

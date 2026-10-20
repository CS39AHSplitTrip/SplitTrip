import { Currency } from '@/lib/currency'
import { amountAsDecimal } from '@/lib/utils'

// SplitTrip: builds the "Pay with…" links for the settle-up list (#28)

export type PaymentApp = 'venmo' | 'paypal' | 'cashApp'

export type PaymentLink = { app: PaymentApp; url: string }

type Payee = {
  venmoUsername?: string | null
  paypalUsername?: string | null
  cashAppCashtag?: string | null
}

// Makes a link for each app the person being paid signed up for (#27),
// with the amount already filled in. Apps they left empty get no link.
// Venmo and Cash App only work in the US, so it's USD groups only.
export function getPaymentLinks(
  payee: Payee,
  amount: number,
  currency: Currency,
): PaymentLink[] {
  if (currency.code !== 'USD') return []

  // Amounts are saved in cents, so 2450 turns into "24.50"
  const value = amountAsDecimal(amount, currency).toFixed(2)
  const links: PaymentLink[] = []

  if (payee.venmoUsername) {
    const username = encodeURIComponent(payee.venmoUsername)
    links.push({
      app: 'venmo',
      url: `https://venmo.com/${username}?txn=pay&amount=${value}&note=SplitTrip`,
    })
  }
  if (payee.paypalUsername) {
    const username = encodeURIComponent(payee.paypalUsername)
    links.push({
      app: 'paypal',
      url: `https://paypal.me/${username}/${value}`,
    })
  }
  if (payee.cashAppCashtag) {
    const cashtag = encodeURIComponent(payee.cashAppCashtag)
    links.push({
      app: 'cashApp',
      url: `https://cash.app/$${cashtag}/${value}`,
    })
  }

  return links
}

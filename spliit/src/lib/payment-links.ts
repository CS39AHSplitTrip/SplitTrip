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

// Turns a group amount into US cents using the rate from Frankfurter (#42),
// so €90.00 at 1.08 becomes 9720
export function toUsdCents(
  amount: number,
  currency: Currency,
  usdRate: number,
) {
  return Math.round(amountAsDecimal(amount, currency) * usdRate * 100)
}

// Picks which way to show the rate so the number is always 1 or more:
// "1 EUR = 1.12 USD", but "1 USD = 17.25 MXN" instead of "1 MXN = 0.058 USD"
export function getRateLabel(currencyCode: string, usdRate: number) {
  return usdRate >= 1
    ? { from: currencyCode, to: 'USD', rate: usdRate }
    : { from: 'USD', to: currencyCode, rate: 1 / usdRate }
}

// Turns the rate someone typed into a USD rate (#43). The box reads the same
// way as the label, so "1 USD = [18.50] MXN" means 1 MXN is 1/18.50 USD.
// Gives back null for anything that isn't a number above 0.
export function parseCustomRate(input: string, usdFirst: boolean) {
  const text = input.trim().replace(',', '.')
  const rate = Number(text)
  if (!text || !Number.isFinite(rate) || rate <= 0) return null
  return usdFirst ? 1 / rate : rate
}

// Makes a link for each app the person being paid signed up for (#27),
// with the amount already filled in. Apps they left empty get no link.
// Venmo and Cash App only work in the US, so the links are always in dollars:
// USD groups use the amount as is, other groups need a usdRate (#42).
export function getPaymentLinks(
  payee: Payee,
  amount: number,
  currency: Currency,
  usdRate?: number,
): PaymentLink[] {
  let cents: number
  if (currency.code === 'USD') {
    cents = amount
  } else if (usdRate) {
    cents = toUsdCents(amount, currency, usdRate)
  } else {
    // No rate (still loading or Frankfurter failed), so no links
    return []
  }

  // Amounts are saved in cents, so 2450 turns into "24.50"
  const value = (cents / 100).toFixed(2)
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

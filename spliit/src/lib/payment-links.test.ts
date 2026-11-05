import { getCurrency } from '@/lib/currency'
import { getPaymentLinks, getRateLabel, toUsdCents } from './payment-links'

// SplitTrip: checks the "Pay with…" link rules from #28
describe('getPaymentLinks', () => {
  const usd = getCurrency('USD')
  const anna = {
    venmoUsername: 'anna-k',
    paypalUsername: 'annak',
    cashAppCashtag: 'annak',
  }

  it('makes a link for every app Anna signed up for', () => {
    expect(getPaymentLinks(anna, 2450, usd)).toEqual([
      {
        app: 'venmo',
        url: 'https://venmo.com/anna-k?txn=pay&amount=24.50&note=SplitTrip',
      },
      { app: 'paypal', url: 'https://paypal.me/annak/24.50' },
      { app: 'cashApp', url: 'https://cash.app/$annak/24.50' },
    ])
  })

  it('only shows Cash App when that is all Anna has', () => {
    expect(
      getPaymentLinks({ cashAppCashtag: 'annak' }, 2450, usd).map(
        (link) => link.app,
      ),
    ).toEqual(['cashApp'])
  })

  it('shows nothing when Anna has no usernames', () => {
    expect(
      getPaymentLinks(
        { venmoUsername: null, paypalUsername: null, cashAppCashtag: null },
        2450,
        usd,
      ),
    ).toEqual([])
  })

  it('shows nothing for non-USD groups until we have a rate', () => {
    expect(getPaymentLinks(anna, 2450, getCurrency('EUR'))).toEqual([])
  })

  // #42: non-USD groups pay in dollars using Frankfurter's rate
  it('turns €90.00 into $97.20 at a rate of 1.08', () => {
    expect(getPaymentLinks(anna, 9000, getCurrency('EUR'), 1.08)).toEqual([
      {
        app: 'venmo',
        url: 'https://venmo.com/anna-k?txn=pay&amount=97.20&note=SplitTrip',
      },
      { app: 'paypal', url: 'https://paypal.me/annak/97.20' },
      { app: 'cashApp', url: 'https://cash.app/$annak/97.20' },
    ])
  })

  it('ignores the rate for USD groups', () => {
    expect(getPaymentLinks({ paypalUsername: 'annak' }, 2450, usd, 2)).toEqual([
      { app: 'paypal', url: 'https://paypal.me/annak/24.50' },
    ])
  })

  it('always puts two decimals in the amount', () => {
    expect(getPaymentLinks({ paypalUsername: 'annak' }, 2000, usd)).toEqual([
      { app: 'paypal', url: 'https://paypal.me/annak/20.00' },
    ])
  })
})

describe('toUsdCents', () => {
  it('rounds to the nearest cent', () => {
    // €10.00 × 1.1224 = $11.224, so 1122 cents
    expect(toUsdCents(1000, getCurrency('EUR'), 1.1224)).toBe(1122)
  })

  it('handles currencies with no decimals like yen', () => {
    // ¥1,500 × 0.0065 = $9.75
    expect(toUsdCents(1500, getCurrency('JPY'), 0.0065)).toBe(975)
  })
})

describe('getRateLabel', () => {
  it('shows strong currencies as 1 EUR = x USD', () => {
    expect(getRateLabel('EUR', 1.08)).toEqual({
      from: 'EUR',
      to: 'USD',
      rate: 1.08,
    })
  })

  it('flips weak currencies to 1 USD = x MXN', () => {
    const label = getRateLabel('MXN', 0.05)
    expect(label.from).toBe('USD')
    expect(label.to).toBe('MXN')
    expect(label.rate).toBeCloseTo(20)
  })
})

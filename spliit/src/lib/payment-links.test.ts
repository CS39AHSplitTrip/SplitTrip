import { getCurrency } from '@/lib/currency'
import { getPaymentLinks } from './payment-links'

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

  it('shows nothing for groups that are not in USD', () => {
    expect(getPaymentLinks(anna, 2450, getCurrency('EUR'))).toEqual([])
  })

  it('always puts two decimals in the amount', () => {
    expect(getPaymentLinks({ paypalUsername: 'annak' }, 2000, usd)).toEqual([
      { app: 'paypal', url: 'https://paypal.me/annak/20.00' },
    ])
  })
})

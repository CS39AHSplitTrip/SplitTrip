import { expenseFormSchema, groupFormSchema } from './schemas'

function byAmountExpense(amount: string, shares: string[]) {
  return {
    expenseDate: new Date('2026-09-01'),
    title: 'Dinner',
    amount,
    paidBy: 'a',
    splitMode: 'BY_AMOUNT',
    saveDefaultSplittingOptions: false,
    isReimbursement: false,
    paidFor: shares.map((shares, i) => ({ participant: `p${i}`, shares })),
  }
}

function issueMessages(input: unknown): string[] {
  const result = expenseFormSchema.safeParse(input)
  return result.success ? [] : result.error.issues.map((i) => i.message)
}

describe('expenseFormSchema, split by amount', () => {
  it('accepts amounts that add up to the expense amount', () => {
    expect(
      issueMessages(
        byAmountExpense('524.34', [
          '110.11',
          '209.74',
          '104.87',
          '89.14',
          '10.48',
        ]),
      ),
    ).toEqual([])
  })

  it('rejects amounts one cent off', () => {
    expect(
      issueMessages(
        byAmountExpense('524.34', [
          '110.11',
          '209.74',
          '104.87',
          '89.14',
          '10.49',
        ]),
      ),
    ).toEqual(['amountSum'])
  })

  it('sums amounts typed with a decimal comma', () => {
    expect(
      issueMessages(byAmountExpense('100', ['50', '30', '20,00'])),
    ).toEqual([])
  })

  it('reports an emptied amount instead of throwing on it', () => {
    expect(issueMessages(byAmountExpense('100', ['60', '']))).toEqual([
      'noZeroShares',
      'amountSum',
    ])
  })
})

// SplitTrip: checks the payment username rules from #27
describe('groupFormSchema, payment usernames', () => {
  function groupWithAnna(usernames: Record<string, unknown>) {
    return {
      name: 'Trip',
      currency: '$',
      currencyCode: 'USD',
      participants: [{ name: 'Anna', ...usernames }],
    }
  }

  it('takes off the "@" and "$" people type in front', () => {
    const result = groupFormSchema.parse(
      groupWithAnna({
        venmoUsername: '@anna-k',
        paypalUsername: ' annak ',
        cashAppCashtag: '$annak',
      }),
    )
    expect(result.participants[0]).toMatchObject({
      venmoUsername: 'anna-k',
      paypalUsername: 'annak',
      cashAppCashtag: 'annak',
    })
  })

  it('saves empty boxes as nothing', () => {
    const result = groupFormSchema.parse(
      groupWithAnna({ venmoUsername: '', paypalUsername: '   ' }),
    )
    expect(result.participants[0].venmoUsername).toBeNull()
    expect(result.participants[0].paypalUsername).toBeNull()
  })

  it('still works when no usernames are sent at all', () => {
    expect(groupFormSchema.safeParse(groupWithAnna({})).success).toBe(true)
  })

  it('says no to usernames with spaces', () => {
    const result = groupFormSchema.safeParse(
      groupWithAnna({ venmoUsername: 'anna k' }),
    )
    expect(result.success).toBe(false)
    expect(result.error?.issues.map((i) => i.message)).toEqual([
      'noSpacesInUsername',
    ])
  })
})

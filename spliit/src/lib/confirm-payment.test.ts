import { expenseFormSchema } from '@/lib/schemas'
import { getReimbursementExpense, getReimbursementKey } from './confirm-payment'

// SplitTrip: checks the payment that "Yes, I paid" saves (#29)
describe('getReimbursementExpense', () => {
  const borisPaysAnna = { from: 'boris', to: 'anna', amount: 2450 }
  const date = new Date('2026-10-27')

  it('saves Boris paying Anna $24.50 as a reimbursement', () => {
    expect(
      getReimbursementExpense(borisPaysAnna, 'Reimbursement', date),
    ).toEqual(
      expect.objectContaining({
        title: 'Reimbursement',
        expenseDate: date,
        category: 1,
        amount: 2450,
        paidBy: 'boris',
        paidFor: [{ participant: 'anna', shares: 1 }],
        isReimbursement: true,
        recurrenceRule: 'NONE',
      }),
    )
  })

  it('passes the same checks as the expense form', () => {
    const result = expenseFormSchema.safeParse(
      getReimbursementExpense(borisPaysAnna, 'Reimbursement', date),
    )
    expect(result.success).toBe(true)
  })
})

describe('getReimbursementKey', () => {
  it('changes when the amount changes', () => {
    expect(getReimbursementKey({ from: 'b', to: 'a', amount: 2450 })).not.toBe(
      getReimbursementKey({ from: 'b', to: 'a', amount: 2000 }),
    )
  })
})

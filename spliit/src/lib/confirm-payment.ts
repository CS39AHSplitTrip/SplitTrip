import { Reimbursement } from '@/lib/balances'
import { ExpenseFormInput } from '@/lib/schemas'

// SplitTrip: the "Yes, I paid" button saves a payment without opening the form (#29)

// Builds the same reimbursement that "Mark as paid" saves from the expense
// form: a "Payment" expense paid by the person who owed, for the person who
// got paid. The amount is already in cents, like the form sends it.
export function getReimbursementExpense(
  reimbursement: Reimbursement,
  title: string,
  date: Date = new Date(),
): ExpenseFormInput {
  return {
    expenseDate: date,
    title,
    category: 1, // category with Id 1 is Payment
    amount: reimbursement.amount,
    paidBy: reimbursement.from,
    paidFor: [{ participant: reimbursement.to, shares: 1 }],
    splitMode: 'EVENLY',
    saveDefaultSplittingOptions: false,
    isReimbursement: true,
    documents: [],
    notes: '',
    recurrenceRule: 'NONE',
  }
}

// Tells transfers apart, so we only ask about the one that was paid. If the
// balances changed since then, the key no longer matches and we don't ask.
export function getReimbursementKey({ from, to, amount }: Reimbursement) {
  return `${from}:${to}:${amount}`
}

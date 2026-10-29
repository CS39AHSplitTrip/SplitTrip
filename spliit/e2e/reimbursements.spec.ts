import { Page } from '@playwright/test'
import {
  addExpense,
  createGroup,
  expectBalance,
  EXPENSES_URL,
  openTab,
  paidForRow,
  reimbursementRow,
  uniqueSuffix,
} from './app'
import { expect, test } from './fixtures'
import { money } from './ui'

test('settles a debt through "Mark as paid"', async ({ page }) => {
  // Two participants, so the suggested reimbursement is unique and deterministic.
  const groupId = await createGroup(page, {
    name: `E2E Reimbursement ${uniqueSuffix()}`,
    participants: ['Alice', 'Bob'],
  })

  await addExpense(page, groupId, {
    title: 'Hotel',
    amount: '100',
    paidBy: 'Alice',
  })

  await openTab(page, 'Balances')
  await expectBalance(page, 'Alice', 50)
  await expectBalance(page, 'Bob', -50)

  const row = reimbursementRow(page, 'Bob', 'Alice')
  await expect(row).toContainText('Bob owes Alice')
  await expect(row).toContainText(money(50))

  await row.getByRole('link', { name: 'Mark as paid' }).click()
  await page.waitForURL(/\/expenses\/create\?.*reimbursement=yes/, {
    timeout: 30_000,
  })

  // The link prefills the whole form from its query string.
  await expect(page.locator('input[name="title"]')).toHaveValue('Reimbursement')
  await expect(page.locator('input[name="amount"]')).toHaveValue(/^50/)
  await expect(page.getByTestId('paid-by')).toContainText('Bob')
  await expect(paidForRow(page, 'Alice').getByRole('checkbox')).toHaveAttribute(
    'aria-checked',
    'true',
  )
  await expect(paidForRow(page, 'Bob').getByRole('checkbox')).toHaveAttribute(
    'aria-checked',
    'false',
  )

  await page.getByRole('button', { name: 'Create', exact: true }).click()
  await page.waitForURL(EXPENSES_URL, { timeout: 30_000 })

  await expect(
    page.getByTestId('expense-card').filter({ hasText: 'Reimbursement' }),
  ).toBeVisible()

  await openTab(page, 'Balances')
  await expectBalance(page, 'Alice', 0)
  await expectBalance(page, 'Bob', 0)
  await expect(page.getByText(/doesn.t need any reimbursement/)).toBeVisible()
})

// SplitTrip: "Did you pay…?" after coming back from the payment app (#29)
test.describe('confirm a payment with one tap', () => {
  async function payBobsDebtWithPayPal(page: Page) {
    const groupId = await createGroup(page, {
      name: `E2E Confirm Payment ${uniqueSuffix()}`,
      participants: ['Alice', 'Bob'],
      paypalUsernames: { Alice: 'alicek' },
    })
    await addExpense(page, groupId, {
      title: 'Hotel',
      amount: '49',
      paidBy: 'Alice',
    })
    await openTab(page, 'Balances')

    const row = reimbursementRow(page, 'Bob', 'Alice')
    await expect(row.getByTestId('confirm-payment')).toHaveCount(0)

    // PayPal opens in a new tab; we close it and come back to SplitTrip.
    // The real PayPal site is stubbed out so the test doesn't depend on it.
    await page
      .context()
      .route('https://paypal.me/**', (route) => route.fulfill({ body: '' }))
    const payLink = row.getByRole('link', { name: 'Pay with PayPal' })
    await expect(payLink).toHaveAttribute(
      'href',
      'https://paypal.me/alicek/24.50',
    )
    const popupPromise = page.waitForEvent('popup')
    await payLink.click()
    const popup = await popupPromise
    await popup.close()
    await page.bringToFront()
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))

    await expect(row.getByTestId('confirm-payment')).toContainText(
      `Did you pay Alice ${money(24.5)}?`,
    )
    return row
  }

  test('"Yes, I paid" saves the reimbursement', async ({ page }) => {
    const row = await payBobsDebtWithPayPal(page)
    await row.getByRole('button', { name: 'Yes, I paid' }).click()

    await expect(page.getByText(/doesn.t need any reimbursement/)).toBeVisible()
    await expectBalance(page, 'Alice', 0)
    await expectBalance(page, 'Bob', 0)

    await openTab(page, 'Expenses')
    await expect(
      page.getByTestId('expense-card').filter({ hasText: 'Reimbursement' }),
    ).toBeVisible()
  })

  test('"Not yet" hides the question and saves nothing', async ({ page }) => {
    const row = await payBobsDebtWithPayPal(page)
    await row.getByRole('button', { name: 'Not yet' }).click()

    await expect(row.getByTestId('confirm-payment')).toHaveCount(0)
    await expect(row).toContainText('Bob owes Alice')
    await expectBalance(page, 'Bob', -24.5)
  })
})

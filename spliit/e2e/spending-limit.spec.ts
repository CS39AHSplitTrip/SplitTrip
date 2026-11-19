import { addExpense, createGroup, uniqueSuffix } from './app'
import { expect, test } from './fixtures'
import { fillStable, money } from './ui'

// SplitTrip: spending limits for each member on the Balances tab (#51)
test.describe('spending limits', () => {
  const limitRow = (page: import('@playwright/test').Page, name: string) =>
    page.locator(
      `[data-testid="spending-limit-row"][data-participant="${name}"]`,
    )

  test("counts each member's share, warns at 80% and turns red when over", async ({
    page,
  }) => {
    const groupId = await createGroup(page, {
      name: `E2E Limit ${uniqueSuffix()}`,
      participants: ['Anna', 'Boris', 'Clara'],
      spendingLimits: { Boris: '300' },
    })

    // Anna pays €90 for all three: €30 counts toward Boris's limit, not €90
    await addExpense(page, groupId, {
      title: 'Dinner',
      amount: '90',
      paidBy: 'Anna',
    })
    await page.goto(`/groups/${groupId}/balances`)
    const boris = limitRow(page, 'Boris')
    await expect(boris).toContainText(`Spent ${money(30)} of ${money(300)}`)
    await expect(boris).toHaveAttribute('data-status', 'ok')

    // Boris's share reaches €250
    await addExpense(page, groupId, {
      title: 'Hotel',
      amount: '220',
      paidBy: 'Anna',
      paidFor: ['Boris'],
    })
    await page.goto(`/groups/${groupId}/balances`)
    await expect(boris).toContainText(`Spent ${money(250)} of ${money(300)}`)
    await expect(boris).toHaveAttribute('data-status', 'warning')

    // A new expense pushes him to €320: it's saved, with a note
    await addExpense(page, groupId, {
      title: 'Boat tour',
      amount: '70',
      paidBy: 'Anna',
      paidFor: ['Boris'],
    })
    await expect(
      page.getByText('Boris is now over their spending limit', {
        exact: true,
      }),
    ).toBeVisible()
    await expect(
      page.getByTestId('expense-card').filter({ hasText: 'Boat tour' }),
    ).toBeVisible()
    await page.goto(`/groups/${groupId}/balances`)
    await expect(boris).toContainText(`Spent ${money(320)} of ${money(300)}`)
    await expect(boris).toContainText(`${money(20)} over limit`)
    await expect(boris).toHaveAttribute('data-status', 'over')
  })

  test('rejects a limit that is not greater than 0', async ({ page }) => {
    await page.goto('/groups/create')
    await fillStable(
      page.locator('input[name="name"]'),
      `E2E Limit ${uniqueSuffix()}`,
    )

    for (const limit of ['0', '-50', 'abc']) {
      await fillStable(
        page.locator('input[name="participants.1.spendingLimit"]'),
        limit,
      )
      await page.getByRole('button', { name: 'Create', exact: true }).click()
      await expect(page.getByText('Enter a limit greater than 0')).toBeVisible()
      await expect(page).toHaveURL(/\/groups\/create$/)
    }
  })

  test('members without a limit look the same as before', async ({ page }) => {
    const groupId = await createGroup(page, {
      name: `E2E Limit ${uniqueSuffix()}`,
      participants: ['Anna', 'Boris', 'Clara'],
      spendingLimits: { Boris: '300' },
    })
    await page.goto(`/groups/${groupId}/balances`)
    await expect(limitRow(page, 'Boris')).toBeVisible()
    await expect(limitRow(page, 'Clara')).toHaveCount(0)
    await expect(limitRow(page, 'Anna')).toHaveCount(0)
  })

  test('a group where nobody has a limit shows no limits', async ({ page }) => {
    const groupId = await createGroup(page, {
      name: `E2E Limit ${uniqueSuffix()}`,
      participants: ['Anna', 'Boris'],
    })
    await page.goto(`/groups/${groupId}/balances`)
    await expect(page.getByTestId('balance-row').first()).toBeVisible()
    await expect(page.getByText('Spending limits')).toHaveCount(0)
  })
})

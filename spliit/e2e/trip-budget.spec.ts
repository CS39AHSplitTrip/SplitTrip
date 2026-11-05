import { addExpense, createGroup, EXPENSES_URL, uniqueSuffix } from './app'
import { expect, test } from './fixtures'
import { fillStable, money } from './ui'

// SplitTrip: the trip budget bar on the Expenses tab (#50)
test.describe('trip budget', () => {
  test('fills up, warns at 80% and turns red when over budget', async ({
    page,
  }) => {
    const groupId = await createGroup(page, {
      name: `E2E Budget ${uniqueSuffix()}`,
      participants: ['Anna', 'Boris'],
      budget: '1000',
    })

    const bar = page.getByRole('progressbar')
    await expect(
      page.getByText(`Spent ${money(0)} of ${money(1000)}`),
    ).toBeVisible()
    await expect(bar).toHaveAttribute('data-status', 'ok')

    await addExpense(page, groupId, {
      title: 'Hotel',
      amount: '850',
      paidBy: 'Anna',
    })
    await expect(
      page.getByText(`Spent ${money(850)} of ${money(1000)}`),
    ).toBeVisible()
    await expect(bar).toHaveAttribute('data-status', 'warning')

    await addExpense(page, groupId, {
      title: 'Dinner',
      amount: '270',
      paidBy: 'Boris',
    })
    await expect(
      page.getByText(`Spent ${money(1120)} of ${money(1000)}`),
    ).toBeVisible()
    await expect(page.getByText(`${money(120)} over budget`)).toBeVisible()
    await expect(bar).toHaveAttribute('data-status', 'over')
  })

  test("doesn't count paying someone back as spending", async ({ page }) => {
    const groupId = await createGroup(page, {
      name: `E2E Budget ${uniqueSuffix()}`,
      participants: ['Anna', 'Boris'],
      budget: '1000',
    })
    await addExpense(page, groupId, {
      title: 'Hotel',
      amount: '100',
      paidBy: 'Anna',
    })

    // Boris pays Anna back with "Mark as paid"
    await page.goto(`/groups/${groupId}/balances`)
    await page.getByRole('link', { name: 'Mark as paid' }).click()
    await page.waitForURL(/reimbursement=yes/, { timeout: 30_000 })
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    await page.waitForURL(EXPENSES_URL, { timeout: 30_000 })

    await expect(
      page.getByTestId('expense-card').filter({ hasText: 'Reimbursement' }),
    ).toBeVisible()
    await expect(
      page.getByText(`Spent ${money(100)} of ${money(1000)}`),
    ).toBeVisible()
  })

  test('rejects a budget that is not greater than 0', async ({ page }) => {
    await page.goto('/groups/create')
    await fillStable(
      page.locator('input[name="name"]'),
      `E2E Budget ${uniqueSuffix()}`,
    )

    for (const budget of ['0', '-50', 'abc']) {
      await fillStable(page.locator('input[name="budget"]'), budget)
      await page.getByRole('button', { name: 'Create', exact: true }).click()
      await expect(
        page.getByText('Enter a budget greater than 0'),
      ).toBeVisible()
      await expect(page).toHaveURL(/\/groups\/create$/)
    }
  })

  test('clearing the budget removes the bar', async ({ page }) => {
    const groupId = await createGroup(page, {
      name: `E2E Budget ${uniqueSuffix()}`,
      participants: ['Anna', 'Boris'],
      budget: '1000',
    })
    await expect(page.getByRole('progressbar')).toBeVisible()

    await page.goto(`/groups/${groupId}/edit`)
    const budget = page.locator('input[name="budget"]')
    await expect(budget).toHaveValue('1000')
    await fillStable(budget, '')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(budget).toHaveValue('')

    await page.goto(`/groups/${groupId}/expenses`)
    await expect(
      page
        .getByTestId('expense-card')
        .or(page.getByText(/doesn.t contain any expense/)),
    ).toBeVisible()
    await expect(page.getByRole('progressbar')).toHaveCount(0)
  })

  test('a group without a budget shows no bar', async ({ page }) => {
    await createGroup(page, {
      name: `E2E Budget ${uniqueSuffix()}`,
      participants: ['Anna', 'Boris'],
    })
    await expect(page.getByText(/doesn.t contain any expense/)).toBeVisible()
    await expect(page.getByRole('progressbar')).toHaveCount(0)
  })
})

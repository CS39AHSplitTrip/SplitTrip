import { getBudgetProgress } from './budget'

describe('getBudgetProgress', () => {
  it('is ok below 80% of the budget', () => {
    expect(getBudgetProgress(640_00, 1000_00)).toEqual({
      status: 'ok',
      percent: 64,
      overBy: 0,
    })
  })

  it('warns from 80% of the budget', () => {
    expect(getBudgetProgress(800_00, 1000_00).status).toBe('warning')
    expect(getBudgetProgress(850_00, 1000_00)).toEqual({
      status: 'warning',
      percent: 85,
      overBy: 0,
    })
  })

  it('still warns, not over, when spending equals the budget', () => {
    expect(getBudgetProgress(1000_00, 1000_00)).toEqual({
      status: 'warning',
      percent: 100,
      overBy: 0,
    })
  })

  it('is over when spending is more than the budget', () => {
    expect(getBudgetProgress(1120_00, 1000_00)).toEqual({
      status: 'over',
      percent: 100,
      overBy: 120_00,
    })
  })

  it('shows an empty bar with no spending', () => {
    expect(getBudgetProgress(0, 1000_00)).toEqual({
      status: 'ok',
      percent: 0,
      overBy: 0,
    })
  })
})

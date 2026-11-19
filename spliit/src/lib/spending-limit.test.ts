import { getMembersNewlyOverLimit } from './spending-limit'

describe('getMembersNewlyOverLimit', () => {
  const anna = { id: 'anna', name: 'Anna', spendingLimit: null }
  const boris = { id: 'boris', name: 'Boris', spendingLimit: 300_00 }
  const clara = { id: 'clara', name: 'Clara', spendingLimit: 100_00 }

  it('lists a member the save pushed over their limit', () => {
    expect(
      getMembersNewlyOverLimit(
        [anna, boris],
        { boris: 250_00 },
        { boris: 320_00 },
      ),
    ).toEqual([boris])
  })

  it("doesn't list a member who was already over", () => {
    expect(
      getMembersNewlyOverLimit([clara], { clara: 120_00 }, { clara: 150_00 }),
    ).toEqual([])
  })

  it("doesn't list a member who reaches the limit exactly", () => {
    expect(
      getMembersNewlyOverLimit([boris], { boris: 250_00 }, { boris: 300_00 }),
    ).toEqual([])
  })

  it('ignores members without a limit', () => {
    expect(
      getMembersNewlyOverLimit([anna], { anna: 0 }, { anna: 1_000_00 }),
    ).toEqual([])
  })
})

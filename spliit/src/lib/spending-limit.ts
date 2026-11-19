// SplitTrip: spending limits for each member (#51). A member's spending is their
// share of the expenses, from `getShareByParticipant`. The colors follow the
// trip budget: yellow at 80% of the limit, red once they go over.

type MemberWithLimit = {
  id: string
  name: string
  spendingLimit: number | null
}

// The members a save just pushed over their limit, so we can tell the group.
// Someone who was already over before the save isn't listed again.
export function getMembersNewlyOverLimit(
  participants: MemberWithLimit[],
  sharesBefore: Record<string, number>,
  sharesAfter: Record<string, number>,
) {
  return participants.filter(({ id, spendingLimit }) => {
    if (spendingLimit === null) return false
    const before = sharesBefore[id] ?? 0
    const after = sharesAfter[id] ?? 0
    return before <= spendingLimit && after > spendingLimit
  })
}

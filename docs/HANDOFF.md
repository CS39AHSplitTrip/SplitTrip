# Handoff

Where SplitTrip stands, and what a new team should know before picking it up. For setup, see the [README](../README.md).

## Current state

- `main` and `dev` have the same code as of PR #53.
- Epics 1 to 7 are done. Epic 7, Plan a Trip Budget Together (#49), has the group budget (#50) and a spending limit for each member (#51).
- Our changes in `spliit/src` are marked with a `// SplitTrip:` comment and the issue number, so `grep -rn "SplitTrip:" spliit/src` lists everything we changed in Spliit.

Main files we added or changed:

| File | What it does |
|---|---|
| `spliit/src/lib/payment-links.ts` | Builds the Venmo, PayPal and Cash App links, converts amounts to US cents, and parses a typed exchange rate |
| `spliit/src/lib/hooks.ts` (`useUsdRate`) | Gets today's dollar rate from Frankfurter |
| `spliit/src/lib/confirm-payment.ts` | Builds the payment that "Yes, I paid" saves |
| `spliit/src/app/groups/[groupId]/reimbursement-list.tsx` | The settle-up list: pay buttons, dollar amounts, the rate box, the "Did you pay?" prompt |
| `spliit/src/lib/budget.ts`, `.../expenses/budget-progress.tsx` | Trip budget colors and progress bar |
| `spliit/src/lib/spending-limit.ts`, `.../balances/spending-limits.tsx`, `.../expenses/use-spending-limit-check.ts` | Spending limits on the Balances tab, and the note when a save pushes someone over |
| `spliit/src/components/group-form.tsx` | Group settings, including payment usernames and the budget |
| `spliit/messages/en-US.json` | All new text. SplitTrip strings are only in English |

## Known issues

- "Closes #N" in a PR only closes the issue when the PR merges into `main`. Feature PRs merge into `dev`, so close their issues by hand.
- A `.DS_Store` file was committed to the repo root with #52. Delete it and add `.DS_Store` to `.gitignore`.
- "Yes, I paid" saves the payment with `new Date()`. The expense date is a plain day, so a payment confirmed in the evening in a US time zone can be saved with tomorrow's date. Pass today's date at UTC midnight instead.
- Frankfurter doesn't have every currency (Colombian pesos and Vietnamese dong are two that return nothing). Those groups see "Couldn't get today's exchange rate" and have to type their own rate before the pay buttons show.
- Currencies that Spliit doesn't list (Costa Rican colones, for example) become a custom currency with no code. Those groups get no dollar conversion and no pay buttons.
- A typed exchange rate resets when the page reloads.
- New text is only in `en-US.json`. Other languages show the English text or the message key.
- The pay buttons and the "Did you pay?" prompt were tested in desktop Chrome. We haven't checked them in the Venmo and Cash App phone apps on iOS and Android.

## Open questions

- Should a typed exchange rate be saved with the payment, so the group can see which rate was used later?
- A member's spending counts their share of each expense, not what they paid, as #51 asked. We haven't checked with real users whether that's what they expect.
- The over-limit note only shows to the person who saved the expense. Other members only see it on the Balances tab.
- Is there a payment app worth adding for groups outside the US, such as Wise or Revolut?

## Unplanted seed from Widening the Lens

The headline of our Postcard from the Future is "Off the grid, across borders, and still even." We built "across borders" (Epic 6) and "still even" (Epics 3 and 4). "Off the grid" is the part we didn't build.

The seed we wrote: put a phone in airplane mode, add an expense, and have it sync on its own once the phone is back online. It only has to work for adding expenses, not editing them. Spliit's service worker (`spliit/public/sw.js`) already caches the app's files and has an offline page, so the app shell exists. API calls are never cached, which is where the work starts.

Doing it would answer three questions:

- Can the app open with no signal at all?
- What happens when two people add expenses offline and both sync later?
- Is "it syncs on its own" realistic, or much harder than it sounds?

Our team chose to keep this as a what-if. Building it fully would mean saving expenses on the phone and sending them to the server later, which changes how every part of the app saves data.

## What we'd do next

1. Clean up first: remove `.DS_Store` and fix the payment date bug.
2. Try the offline seed above as a one- or two-day spike before deciding whether to build it fully.
3. Test the pay buttons on real phones.
4. Ask a few real groups whether the budget and limits help before adding more planning features.

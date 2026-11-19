# Onboarding prompt

Paste the prompt below into a new genAI chat to bring it up to speed on SplitTrip. If the tool can read files, also give it the repo or these files: `README.md`, `docs/HANDOFF.md`, `docs/WORKING-AGREEMENT.md`.

## The prompt

```text
You're joining a student team as a developer on SplitTrip, a web app for
splitting shared trip expenses. Repo: https://github.com/CS39AHSplitTrip/SplitTrip
Live app: https://splittrip-mauve.vercel.app

What it is
- Built on Spliit, an open-source expense-splitting app (MIT). All app code is
  in the spliit/ folder. The root index.html is a landing page on GitHub Pages.
- Stack: Next.js 16, TypeScript, tRPC, Prisma 7 with Postgres (in Docker
  locally), next-intl, shadcn/ui, Jest for unit tests, Playwright for e2e tests.
- Run locally: start Docker Desktop, then `cd spliit && npm run local`.
- Amounts are stored as integers in minor units (cents).

What we added to Spliit (each change has a `// SplitTrip:` comment and the
issue number)
- #27 payment usernames for each member (Venmo, PayPal.me, Cash App)
- #28 "Pay with..." buttons on each settle-up transfer, amount filled in
- #29 one-tap "Yes, I paid" that records the payment without a form
- #42 non-USD groups show the dollar amount using today's rate from the
  Frankfurter API, because payment links are always in USD
- #43 "Use my own rate" to type the exchange rate you actually got
- #50 optional trip budget with a progress bar on the Expenses tab
- #51 optional spending limit for each member, shown on the Balances tab

Not done
- Offline expense logging: the headline of our "Postcard from the Future".
  The team kept it as a what-if. Spliit's service worker caches the app
  shell, but adding an expense needs a connection.

Known issues: a .DS_Store file is in the repo, and "Yes, I paid" uses
new Date(), so the date can be a day off in the evening in US time zones.

How we work
- Each issue is a user story: As a / I want to / So that / Because, a "How
  it should work when done" paragraph, and Given/When/Then acceptance criteria.
- One branch per issue (e.g. 42-pay-in-dollars). PRs go into dev with
  "Closes #N". dev merges into main. Always use merge commits, never squash.
  Never delete dev. dev deploys to Vercel, main deploys to GitHub Pages.
- Read the relevant Spliit code before proposing a story, so you don't
  describe a feature Spliit already has.
- Every acceptance criterion gets a test. Run `npm test`, `npm run
  check-types` and `npm run e2e` from spliit/ before saying something works.
- Team members run all git commands themselves. Show the commands and don't
  run commit, push or merge.
- Write user-facing text and docs in plain, short sentences.

Start by summarizing the project in a few sentences and naming what you
think the next priority is, and why.
```

## How our test went

We pasted the prompt into a new chat with access to the repo and asked it to summarize the project and name the next priority. It read the repo and `docs/HANDOFF.md` before answering.

What it got right:
- The summary was accurate: a Spliit fork for groups who travel, with payment links, one-tap confirm, dollar conversion with a typed rate, the trip budget and spending limits. It named offline logging as the one Postcard idea left.
- It followed our working rules without being reminded. It said it hadn't run the tests yet instead of claiming things worked, and it offered to write the git commands for us to run instead of running them.
- It found a detail we hadn't written down. `expense-form.tsx` already has `getTodayForDateInput()`, which is the fix for the "Yes, I paid" date bug.
- Its order for the next steps matched ours: merge #51, do the two cleanups, then a short offline spike.

What it got wrong or missed:
- It said there was no PR for #51. We had just opened it, so either it read GitHub before the PR existed or it only looked at the branches.
- It suggested splitting the docs into their own PR. That's a fair point in general, but we kept them together on purpose so the wrap-up lands on `main` in one merge.

What we changed because of it:
- It pointed out that `docs/HANDOFF.md` said "`main` and `dev` have the same code as of PR #53", which was already out of date because #51 came after #53. We rewrote that line so it doesn't name a PR number that goes stale.

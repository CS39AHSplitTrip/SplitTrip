# SplitTrip

SplitTrip is a web app for splitting shared trip expenses. Friends log what they paid, the app works out the fewest transfers needed to settle up, and each transfer opens Venmo, PayPal or Cash App with the amount already filled in.

Live app: https://splittrip-mauve.vercel.app

SplitTrip is built on [Spliit](https://github.com/spliit-app/spliit), a free and open-source expense-splitting app (MIT License). All of the app code lives in the `spliit/` folder. The `index.html`, `style.css` and `script.js` files at the root are the landing page published on GitHub Pages.

## Product vision

| | |
|---|---|
| For | groups of friends who travel or spend money together |
| Who | struggle to keep track of who paid for what, and then have to chase each other to actually pay it back |
| SplitTrip | is a shared-expense web app built on the open-source app Spliit |
| That | lets every member log payments in seconds, shows the fewest transfers needed to settle up, and opens Venmo, PayPal or Cash App with the amount already filled in |
| Unlike | Splitwise, which requires an account, and free open-source apps like Spliit and SplitPro, which stop at showing who owes whom |
| Our product | lets anyone join by link with no sign-up and turns every "you owe" into a one-tap payment, so the group actually settles up |

## How to run it

You need [Node.js 24+](https://nodejs.org/) and [Docker Desktop](https://www.docker.com/products/docker-desktop/). Docker runs the Postgres database. Start Docker Desktop, then run:

```sh
cd spliit
npm run local
```

Open http://localhost:3000. Run the same command every time, including after you pull new changes. It creates whatever is missing (the database container, `.env`, packages, new migrations) and then starts the app.

- If port 3000 is taken, run `PORT=3001 npm run local` or add `PORT=3001` to `spliit/.env`.
- `Ctrl+C` stops the app. The database keeps running in Docker until you run `docker stop spliit-db`.
- On Windows, run it from Git Bash or WSL.

Checks, all from `spliit/`:

```sh
npm test               # Jest unit tests
npm run check-types    # TypeScript
npm run e2e            # Playwright end-to-end tests (uses its own Docker database)
npm run prettier       # format the code
```

## Deployment

- The `dev` branch deploys the app to Vercel (the live link above). Vercel applies new database migrations when it builds.
- The `main` branch publishes the landing page to GitHub Pages.
- Feature branches merge into `dev`, and `dev` merges into `main`. See [docs/WORKING-AGREEMENT.md](docs/WORKING-AGREEMENT.md).

## What works

What SplitTrip adds to Spliit:

- Payment usernames (#27). Each member saves their Venmo username, PayPal.me name and Cash App cashtag in the group settings.
- Pay buttons (#28). Each settle-up transfer has "Pay with Venmo", "Pay with PayPal" and "Pay with Cash App" buttons for the apps the person being paid has saved, with the amount filled in.
- One-tap confirm (#29). After you come back from the payment app, SplitTrip asks "Did you pay...?" and one tap records the payment, with no form.
- Paying from a non-USD group (#42). Payment apps only take dollars, so groups in other currencies show the dollar amount next to each transfer, using today's rate from the [Frankfurter API](https://frankfurter.dev). The rate reads whichever way gives a number of 1 or more, for example "1 EUR = 1.12 USD" but "1 USD = 17.25 MXN".
- Your own exchange rate (#43). "Use my own rate" lets you type the rate you actually got. It also opens on its own when Frankfurter has no rate for the currency.
- Trip budget (#50). A group can set an optional budget. The Expenses tab then shows "Spent $640.00 of $1,000.00", in yellow at 80% and red when the group goes over.
- Spending limit for each member (#51). Each member can have an optional limit. The Balances tab shows "Spent $210.00 of $300.00" for them, counting their share of each expense, not what they paid. When an expense pushes someone over, a note says so after saving.
- Landing page (#32) and one-command local setup (#33).

From Spliit, unchanged: groups you join by link with no account, adding and editing expenses, uneven splits (by shares, percentage or amount), balances, the fewest-transfers settle-up list, "Mark as paid", recurring expenses, multi-currency expenses, stats and the activity log.

## What's not built or switched off

- Offline expense logging, the headline of our Postcard from the Future, is not built. Spliit's service worker caches the app's files and shows an offline page, but adding an expense still needs a connection. See [docs/HANDOFF.md](docs/HANDOFF.md).
- Pay buttons always send dollars, because Venmo and Cash App only work in USD. There is no payment app for other currencies.
- A typed exchange rate is kept only until the page reloads. It isn't saved to the database.
- Expense photos, receipt scanning and automatic categories come from Spliit but are off by default. They need S3 storage or an OpenAI API key, set in `spliit/.env` (see `spliit/.env.example`).
- There are no user accounts. Anyone with a group's link can see and edit it, the same as in Spliit.

## Project docs

- [docs/WORKING-AGREEMENT.md](docs/WORKING-AGREEMENT.md): how the team worked with its genAI teammate
- [docs/HANDOFF.md](docs/HANDOFF.md): known issues, open questions and what to do next
- [docs/ONBOARDING-PROMPT.md](docs/ONBOARDING-PROMPT.md): a prompt that brings a new AI chat up to speed on the project

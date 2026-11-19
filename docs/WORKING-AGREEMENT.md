# Working agreement

How our team worked with its genAI teammate on SplitTrip, and how that compares with the way we used AI in our Architecture Investigation.

## What we planned in the Architecture Investigation

In the Architecture Investigation, the team studied the legacy KidsTown site (a Perl CGI app) and recommended how to rebuild it. Our approach then:

- We used three tools side by side: Microsoft Copilot, Gemini and Claude.
- The AI's job was to read the legacy code and explain it: how `kt.cgi` routed requests through `kt.db`, and where the content lived.
- The team made the recommendation itself, a static site with JSON content on GitHub Pages, and wrote down the alternative we rejected (a single-page app) and why.
- We ended with one question to answer before anyone wrote code: did any game depend on server-side randomness or scoring?

## How we actually worked on SplitTrip

The AI read the code before we decided anything. Before writing a story, we had the AI read the parts of Spliit the story touches, so the story describes what's new and doesn't repeat what Spliit already does. We started doing this after our README listed "Mark as paid" as a SplitTrip feature. That claim came from an AI draft, but Spliit already had the feature. Now any claim about a feature gets checked against the code before it goes in a README or story.

The AI drafted the stories, and the team decided what went in them. Each issue follows the same template: "As a / I want to / So that / Because", a "How it should work when done" paragraph, and Given/When/Then acceptance criteria with real example amounts. The AI drafted these from our ideas, and the team chose which stories to build and in what order. The trip budget epic (#49) came from a classmate's feedback on our Postcard.

The AI wrote code on a branch, and people ran git. Each story gets its own branch named after the issue (for example `42-pay-in-dollars`). The AI wrote the code and tests on that branch and ran the type check, unit tests and e2e tests. Team members made every commit, push and merge themselves. The AI never pushed.

Every acceptance criterion gets a test. Each story's PR adds unit tests for the logic and Playwright e2e tests for the acceptance criteria. For example, #54 has e2e tests covering every acceptance criterion in #51.

People tested in the browser before merging. The AI's tests passing wasn't enough. A team member tried each feature in the running app with real-looking data. That's how we found that "1 MXN = 0.058 USD" was hard to read, and we changed it to "1 USD = 17.25 MXN" before merging.

Pull requests follow one format. Each PR goes into `dev` with "Closes #N" and four sections: What this does, How it works, Tests, and How to test it. The AI drafted the description and the author edited it.

We used the AI as a second check on PRs. Before merging, we asked the AI to check whether a PR conflicted with `dev` and to run the tests on the merged result. One check caught a PR aimed at `main` instead of `dev`.

Our branch rules came out of mistakes:
- Always use a merge commit, never squash. One squash merge left `main` and `dev` with 14 conflicts that weren't real.
- Never delete `dev`. It was deleted once by accident and had to be restored.
- Stories that depend on each other get stacked branches. For example, #43 was branched off #42, and its PR was opened only after #42 merged.

Our code changes are labeled. Every change to Spliit's code has a `// SplitTrip:` comment with the issue number, so anyone can find what we added.

We used the AI for product ideas too. In Widening the Lens, an "Edge Explorer" conversation with the AI pushed us to think about trips with no signal, other currencies and no payment app. Other currencies became Epic 6, and offline became our seed.

## What changed and why

- We moved from three tools to one main assistant working inside the editor. In the investigation we compared answers across tools because we only needed explanations. On SplitTrip, the AI had to read the whole repo, edit files and run the tests, so a tool working directly in the project was more useful than copying code between chats.
- The AI's job grew from explaining code to writing it, so we added rules about who does what. Writing code is riskier than explaining it. People keep control of git, test every feature by hand, and check the AI's claims against the code.
- "One question before implementation" grew into acceptance criteria. The investigation ended with one open question. On SplitTrip, every story lists the exact cases it has to handle before any code is written, and each case becomes a test.
- One gap we didn't close: some PRs were merged by their own author without another teammate reviewing them, because the AI's check felt like enough. A new team should require one teammate's approval before merging into `dev`.

# ScamBait: Devpost draft

**Tagline:** An app that scams you on purpose, so real scammers can't.

**Tracks to submit to**
- Sponsored (all three can win): T. Rowe Price NextGen Finance, Capital One Best Use of Nessie, MLH Best Use of Gemini API. ElevenLabs is a strong alternate for the third slot if you'd rather.
- Technica (only one can win): Best Education Hack, Best Accessibility Solution, Best Gamification Hack. Swap in Best UI/UX if the judges' reactions at Expo say the design is the hook.

---

## Inspiration

Americans reported losing a record $15.9 billion to fraud in 2025, and nearly half of it, $7.9 billion, went to fake investments. Text messages were the most common way scammers made first contact.

Every one of us has someone in our life who almost fell for one: a grandparent who got the "I'm in jail, don't tell Mom" call, a friend who "invested" in a crypto group chat, a parent who got a perfect copy of their bank's text. The advice they got afterward was always the same list of tips. Tips don't work, because scams don't feel like scams while they're happening. They feel urgent, official and personal.

So we built the opposite of a tip sheet: a place where you get scammed, safely, by scams written for you.

## What it does

You pick who you are today: Rosa, 71, a retired cafeteria manager who reads best in Spanish; Priya, 19, a first-gen college student learning to invest from videos; Linh, 34, an ER nurse who sends money home; or Devon, 58, just laid off and rolling over his 401(k). Scammers choose targets on purpose, so each person gets different scams.

Then your phone starts buzzing. Over one in-game day you get six messages:

- **Scams written by Gemini for that person**, covering all three areas of next-generation finance: a fake ETF with "guaranteed" monthly income, a fake tokenized real-estate fund asking you to connect your wallet, and an AI trading bot or an AI voice-cloned family emergency call.
- **Real messages mixed in**, so the game trains judgment instead of paranoia. Reporting everything costs points, just like it costs you in real life when you ignore your actual bank.

For each one you can **report it**, **trust it**, or **reply**. Replies go to Gemini playing the scammer, who escalates pressure and deflects every attempt to verify, exactly like the real thing. A live pressure meter shows it happening.

Halfway through, **the phone rings**. An ElevenLabs voice plays the caller with live captions. Hang up, talk back, or do what they say.

**Trust a scam and the money really leaves.** Each player gets a real Capital One Nessie sandbox checking account, and paying a scammer is executed as a peer-to-peer transfer to a "scammer" account. The balance drops, the transaction appears in the account history, and then the message lights up: every red flag is swiped with a highlighter and explained in plain language, along with how to check safely next time.

The **debrief** shows which persuasion tactics worked on you (rush, fake authority, too good to be true, odd payment methods, secrecy, friendly faces, fear of missing out, tech jargon, lookalike senders), a personal coaching note from Gemini, three habits to keep, and where to report fraud for real.

With Nessie connected, you can also **play as your own bank customer**: Gemini reads your actual recent purchases and uses them in the scams, showing how leaked transaction data makes targeted fraud more convincing.

## How we built it

- **Frontend:** React 19, Vite and Tailwind CSS 4. One phone UI with an inbox, message view, chat thread and incoming-call screen.
- **Backend:** Node and Express, one process serving the API and the built site, deployed on Vultr.
- **Google Gemini (gemini-3.8-flash):** three jobs. It writes each day's inbox as structured JSON from a schema (sender, channel, body, scam type, tactics, red flags with exact quotes, the legit signs on real messages, what the scam would take, and how to verify). It plays the scammer in live chat with escalating pressure. It writes the personalized debrief.
- **ElevenLabs (eleven_flash_v2_5):** the phone call, voicemail and read-aloud, in the player's language.
- **Capital One Nessie:** creates a customer and checking account per player, records everyday purchases, and turns every scam payment into a real P2P transfer.

The part we're proudest of technically is that **Gemini's output is verified, not trusted.** Every red-flag quote must appear character for character in its message, or it's dropped. A scam with no verifiable red flags is thrown out. If Gemini forgets the phone call, we inject one. If a model or a request field is rejected, the server falls back to simpler requests and other models, and if Gemini is unavailable entirely, hand-written scenario packs take over. Even if the server dies mid-demo, the browser plays on with the same offline logic.

## Responsible design

- **Everything is fictional.** Prompts forbid real companies, apps, coins and URLs; banks are made up; phone numbers use the 555-01XX range; links are plain text and can't be clicked.
- **Victim-side only.** Gemini writes what a target would see, never instructions for running a scam. Legitimate senders never roleplay.
- **Accurate, not alarmist.** Explanations state the general rule (the SEC never approves investments, banks never ask you to move money to a "safe account", no court takes gift cards) at a 6th-grade reading level.
- **Privacy.** Chat text is only used to generate the scammer's next reply. Nessie is a sandbox, so no real money or accounts are ever touched.
- **Accessibility as a first-class feature.** Scammers target older adults, people with disabilities and non-native speakers hardest, so those are the people we designed for: Atkinson Hyperlegible type (designed by the Braille Institute for low-vision readers), text up to 150%, high contrast and reduced motion modes, read-aloud for every message, live captions on every call, full keyboard and screen-reader support, and scams generated in 10 languages, because scammers target communities in their own language.

## Challenges we ran into

- Getting an LLM to produce red-flag quotes that exactly match its own text. We solved it with a schema, an explicit rule, and a normalizer that matches across curly quotes and whitespace before dropping anything that still doesn't match.
- Making the scammer chat realistic without making it a how-to. The model plays the sender's side only, uses only the fictional details already in the message, and ends the conversation after repeated refusals.
- Balancing difficulty. An inbox that is all scams is solved by reporting everything, which teaches nothing. Mixing in real messages that model good institutional behavior, and costing points for false alarms, is what makes it a game about judgment.

## Accomplishments that we're proud of

- The moment the call comes in, mid-game, in a voice that sounds like family.
- The highlighter reveal: seeing exactly which words fooled you lands harder than any list of tips.
- A demo that cannot break: every integration has an offline fallback.

## What we learned

- The persuasion tactics behind a fake ETF, a fake tokenized fund and an AI voice call are the same handful. Teaching the tactics generalizes better than teaching the scams.
- Building for the most targeted users first made the product better for everyone.

## What's next

- Weekly "scam of the week" drills based on real FTC and FINRA alerts.
- A family mode where you send a custom ScamBait day to a parent, and get notified if they fall for it.
- Partnering with banks and brokerages to offer it during account opening, when new investors are most vulnerable.

## Built with

react, vite, tailwindcss, node.js, express, google-gemini, elevenlabs, capital-one-nessie, vultr

## Sources

- FTC: [Congressional testimony on the agency's anti-fraud work (March 2026)](https://www.ftc.gov/news-events/news/press-releases/2026/03/ftc-testifies-joint-economic-committee-agencys-efforts-combat-fraud)
- Money Talks News: [Americans lost a record $15.9 billion to scams in 2025, FTC says](https://www.moneytalksnews.com/americans-lost-a-record-billion-to-scams-in-ftc-says/)

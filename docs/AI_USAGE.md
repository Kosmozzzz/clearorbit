# AI usage log — ClearOrbit

Infomatrix (criterion 09, Responsible AI) and MoldSEF ask that every AI tool, model and prompt be cited, and that AI output be checked by people. This log covers the whole project.

## Tool and model

| | |
|---|---|
| Tool | Claude Code (desktop app), by Anthropic |
| Model | Claude Opus 5.5 (`claude-opus-5-5`) |
| Used for | Scaffolding the app, writing code and tests, drafting page text in three languages, drafting this documentation |
| Not used for | Images (every visual is drawn in code), choosing the hypotheses' outcomes, or producing benchmark numbers (they come only from running `npm run benchmark`) |

## Prompts

1. *(20 Nov 2026)* — The project guidelines (MoldSEF & Infomatrix track, rubric, roadmap, templates) were pasted, with the instruction: build a project on the UN theme "Outer space" (https://www.un.org/en/global-issues/outer-space), looking like the UN feature "The Race to Save Space", using the same stack as our earlier projects (React + TypeScript + Vite + Tailwind, React Router, localStorage, Vercel, GitHub).

_Add every later prompt here with its date, in the team's own words._

## What the AI produced, and how it was checked

| Output | How it was checked |
|---|---|
| Orbital mechanics (circular orbits, Hohmann, plane change, rocket equation) | Unit tests against textbook values: 7.67 km/s and 92.4 min at 400 km; LEO→GEO ≈ 3.9 km/s; position stays on its circle, velocity ⟂ radius |
| Three screening methods | Tested on a planted head-on encounter, on far-apart objects, and on random catalogues where all three must agree pair by pair. **A real bug was caught this way:** the first grid packed cell indices into a number that lost precision, so objects were paired with themselves (extra events = N). Fixed before the benchmark; recorded in the pre-registration |
| Atmospheric lifetime model | Density table compared with Vallado (2013) Table 8-4; tests that lifetime grows with altitude, falls with solar activity, and that the "compliant altitude" really meets the rule |
| Kessler cascade toy | First version saturated in under 10 s (unrealistic); measured in Node and changed so only fragment-on-intact hits create debris; a test now checks the chain is neither instant nor absent |
| Statistics | Student-t critical values checked against a table; geometric mean used for speed-up ratios |
| Statistics on the site | Each one traced to its source (UN feature, ESA, NASA ODQN); counts below 10 cm marked as estimates; illustrative models marked "Model, not a forecast" |
| Romanian and Russian text | An automated test checks that every key, list length and placeholder matches English. **Native speakers on the team must still read every page** |

## Human responsibilities (to be completed by the team)

- [x] Read the site in English (team, 20 Nov 2026) and Russian (a native speaker, 20 Nov 2026) — approved
- [ ] Read the Romanian pages
- [ ] Re-derive at least one formula per tool by hand and record it in the logbook
- [x] Launch price set to USD 7,000/kg (SpaceX rideshare list price, 2026); cloud price USD 0.05/CPU-hour checked against AWS EC2 on-demand (≈ 0.036–0.053 per vCPU-hour) — 20 Nov 2026
- [ ] Re-run `npm run benchmark` on your own laptop and log the numbers
- [ ] Be able to explain every algorithm in the Q&A without notes

## Privacy

No accounts, analytics or cookies. The only stored data is the visitor's own settings, quiz score and pledge, in their browser's `localStorage`.

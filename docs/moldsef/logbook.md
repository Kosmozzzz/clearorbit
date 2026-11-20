# Laboratory Logbook (Jurnalul de evidență — Anexa 3)

Keep this updated every week and print it for the stand. Write each entry in your own words, on the day.

| Entry # & Date | Sprint goal / hypothesis tested | Tech & AI | Research, UI & Econ | Quantitative results / bugs / observations | Next step |
|---|---|---|---|---|---|
| #1 2026-11-20 | Problem definition; first working build | Set up the React + TypeScript + Vite project, the orbit mechanics, the three screening methods and 37 tests | Read the UN feature *The Race to Save Space*, ESA *Space debris by the numbers*, Kessler (1978), Hoots (1984), Vallado (2013) | Pilot on seed 1: the grid produced N extra "events" — objects paired with themselves. Cause: cell key packed into a number beyond 2^53 lost precision. Fixed with a 16-bit-per-axis key; afterwards all three methods agree exactly | Write the pre-registration before the real run |
| #2 2026-11-20 | Pre-registered benchmark (H1–H4) | Ran `npm run benchmark`: 100 scenarios × 3 methods | Wrote PREREGISTRATION.md (hypotheses, seeds 1001–1025, analysis) before the run | Grid −99.85 % checks; 6.09× [6.06–6.11] faster at N = 2,000; recall 1.00 in all 300 runs; apogee filter only −76 %. Grid not faster at N = 250 (0.97×) | Check the economics; draft the abstract |
| #3 YYYY-MM-DD | | | | | |
| #4 YYYY-MM-DD | | | | | |

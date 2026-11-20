# 🛰️ ClearOrbit — the race to save space

**Earth's orbit is filling up.** More than 40,000 tracked pieces of debris, over a million smaller fragments, and launches that went from about 150 satellites a year to 2,470 in 2022. ClearOrbit turns the UN's call to keep outer space safe and sustainable into four hands-on tools — and a pre-registered experiment on the algorithm that has to keep up with it all.

Built on the UN global issue **[Outer space](https://www.un.org/en/global-issues/outer-space)** and the UN feature **[The Race to Save Space](https://www.un.org/en/content/feature/theracetosavespace/)**. Entry for **MoldSEF 2027** (III. Information Technology) and **Infomatrix 2027** (Software Development) by **Cosmin Marandici** (“Orizont” Theoretical Lyceum, Durlești branch), supervised by **Azamat Jayush**.

### 🔴 Live app → [clearorbit-beryl.vercel.app](https://clearorbit-beryl.vercel.app)

### 📦 Source code → [github.com/Kosmozzzz/clearorbit](https://github.com/Kosmozzzz/clearorbit)

---

## 1. What it does

| Page | What you can do |
|---|---|
| **Home** | The Space Age timeline (1957 → 2022), the launch explosion as an animated chart, how satellites power daily life and four SDGs, and a live 3D Earth drawn from the same synthetic catalogue the research uses |
| **The problem** | Debris by size (ESA), an impact-energy calculator (a 30 g bolt at 10 km/s = 2.6 cars crashing), an interactive **Kessler cascade** you trigger with a click, the 2007/2009/2021 events, a 100-year population model with three policies, threats to nations, the space economy |
| **The way forward** | The four solutions from the UN feature, each with a real example and *the catch* |
| **01 Deorbit planner** | Natural orbital lifetime from altitude, mass, area and solar activity; check against the 25-year (UN/IADC) and 5-year (FCC 2022) rules; Δv and propellant to comply by lowering the orbit or by controlled re-entry |
| **02 Clean-up mission** | Pick derelict targets in your own order; compare Δv and propellant with the greedy route and the best of every permutation |
| **03 Collision screener** | Generate up to 3,000 objects, run brute force, the apogee–perigee filter and the spatial hash grid side by side (in a Web Worker), see the close approaches on a rotating globe |
| **04 Space law** | The five UN treaties, the 2007/2019/2024 instruments, a 6-question quiz (best score saved) and a 5-point personal pledge (shown in the sidebar) |
| **Research** | The pre-registered experiment, all results read straight from `research/results/benchmark.json`, the scaling sweep and the economics |

Everything works without an account. Settings, the quiz score and the pledge are saved only in the visitor's browser (`localStorage`, validated on load). Available in **English, Romanian and Russian**.

## 2. The research (MoldSEF block)

**Question.** Conjunction screening checks every pair of objects for close approaches. Pairs grow with the square of the catalogue — 40,000 objects make about 800 million pairs. Which method keeps this tractable without missing a single approach, now that mega-constellations crowd one shell?

**Hypothesis.** *If conjunction screening sorts objects into a spatial hash grid at each time step, then at 2,000 objects it will make at least 99 % fewer pair checks and run at least 4× faster than brute force, while finding exactly the same close approaches.*

**Design** ([research/PREREGISTRATION.md](research/PREREGISTRATION.md), written before the run; its SHA-256 is stored in the results):
- 3 methods: brute force (reference), apogee–perigee filter (Hoots et al., 1984), spatial hash grid (proposed)
- 4 catalogue sizes × 25 seeds = **100 scenarios, 300 runs**; synthetic LEO catalogue shaped like the real one (45 % constellation shell at 550 km, 15 % sun-synchronous, 25 % debris at 700–1,000 km, 15 % other)
- 10 km alert distance, 90-minute window, 20 s step; method order rotated; warm-up before timing

**Results** (Intel i7-9700K, Node 24):

| N | Grid: fewer checks | Grid speed-up (95 % CI) | Apogee filter: fewer checks | Missed approaches |
|---|---|---|---|---|
| 250 | 99.84 % | 0.97× [0.91–1.05] | 75.6 % | 0 |
| 500 | 99.85 % | 1.75× [1.73–1.77] | 76.4 % | 0 |
| 1,000 | 99.86 % | 3.28× [3.27–3.29] | 76.4 % | 0 |
| 2,000 | 99.85 % | **6.09× [6.06–6.11]** | 76.4 % | 0 |

All four hypotheses (H1–H4) were supported. Scaling sweep (exploratory): at 16,000 objects the grid takes 4.4 s per window against 69 s for the apogee filter; brute force would need about 160 s.

**Honest findings:** the grid is *not* faster for small catalogues (250 objects) — building the boxes costs as much as checking every pair. The classical filter is stuck at ~76 % because half the objects share one shell: filters designed for the scattered-debris era lose their power in the mega-constellation era.

**Economics** (continuous screening, measured 4.62 ns per brute-force check, USD 0.05 per CPU-hour):

| | Today (≈ 40,000 objects) | Future (≈ 1,000,000) |
|---|---|---|
| Brute force | 4.4 CPU-h/day · ≈ USD 81/yr | 2,775 CPU-h/day (116 cores 24/7) · ≈ USD 50,600/yr |
| Grid | 0.05 CPU-h/day · ≈ USD 1/yr | 2.1 CPU-h/day · ≈ USD 38/yr |

The point is less the dollars today than **feasibility**: with the grid, a school laptop can screen a million-object sky; brute force would need a server room.

Reproduce: `npm run benchmark` (≈ 4 minutes).

## 3. Software & hardware

| | |
|---|---|
| Language | TypeScript 6 |
| UI | React 19, React Router 7, Tailwind CSS 4, Lenis (smooth scroll) |
| Build / test / lint | Vite 8, Vitest 5, oxlint |
| Graphics | Canvas 2D (Earth, orbits, cascade) and hand-written SVG charts — no chart or 3D library |
| Heavy work | Web Worker (the screener never freezes the page) |
| Storage | Browser `localStorage`, re-validated on every load; no server, no database, no cookies |
| Hosting | Vercel (static, SPA rewrite in `vercel.json`) |
| Hardware | Any laptop or phone with a modern browser |

## 4. Project structure

```
src/
  utils/screening/   orbit mechanics, synthetic catalogue, the three screening methods (+ tests)
  utils/             deorbit, removal routes, cascade model + toy simulation, impact, economics, storage (+ tests)
  workers/           screening Web Worker
  components/        Earth scene, Kessler simulation, orbit view, charts, layout
  pages/             one file per page
  i18n/              en / ro / ru + a test that keeps the three in step
research/            pre-registration, benchmark script, stats, raw results
docs/                AI usage log, MoldSEF abstract and lab logbook
```

## 5. Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 37 tests
npm run lint
npm run build
npm run benchmark  # re-runs the experiment and rewrites research/results/benchmark.json
```

Deploy: push to GitHub, import the repo in Vercel (framework preset **Vite**), no environment variables needed.

## 6. Sources

- UN DGC & UNOOSA, *The Race to Save Space* (2025); United Nations, *Global issues: Outer space*
- ESA Space Debris Office, *Space debris by the numbers* (2025) and *Space Environment Report* (2024)
- NASA Orbital Debris Program Office, *Orbital Debris Quarterly News*
- UNOOSA, *Space Debris Mitigation Guidelines* (2007) and *Guidelines for the Long-term Sustainability of Outer Space Activities* (2019)
- Kessler, D. J. & Cour-Palais, B. G. (1978). Collision frequency of artificial satellites: the creation of a debris belt. *J. Geophys. Res.* 83(A6), 2637–2646
- Hoots, F. R., Crawford, L. L. & Roehrich, R. L. (1984). An analytic method to determine future close approaches between satellites. *Celestial Mechanics* 33, 143–158
- Vallado, D. A. (2013). *Fundamentals of Astrodynamics and Applications*, 4th ed. (exponential atmosphere table)

**To check before the competition:** prices checked on 20 Nov 2026 — launch USD 7,000/kg is the SpaceX rideshare list price (USD 350,000 for 50 kg, USD 7,000 per extra kg); USD 0.05 per CPU-hour is a round figure inside the AWS EC2 on-demand range for compute-optimised Linux instances (≈ USD 0.036–0.053 per vCPU-hour, us-east-1 / us-west-1).

## 7. Responsible AI

An AI coding assistant (Claude, by Anthropic) helped write code and text. Every formula was checked against its source, every number on the site names its source, all calculations are covered by tests, and no AI-generated images are used. See [docs/AI_USAGE.md](docs/AI_USAGE.md).

## Licence

[MIT](LICENSE). No third-party images: every visual is drawn in code.

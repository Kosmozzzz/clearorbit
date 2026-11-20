**THEMATIC CATEGORY:** III. Information Technology
**PROJECT TITLE:** ClearOrbit — Scalable Conjunction Screening with Spatial Hashing for the Mega-Constellation Era, and an Interactive Platform for Space Sustainability
**AUTHORS:** [First Name LAST NAME 1], [First Name LAST NAME 2]
**GRADE:** [Grade]
**INSTITUTION:** [High School]

### 1. AIM OF THE RESEARCH & SCIENTIFIC HYPOTHESIS

More than 40,500 objects larger than 10 cm orbit the Earth (ESA, 2025), and yearly launches grew from about 150 to 2,470 between 2012 and 2022 (UN, 2025). Operators must check every pair of objects for close approaches every day, and the number of pairs grows with the square of the catalogue. This research hypothesises that **sorting objects into a spatial hash grid at each time step will reduce pair distance checks by at least 99 % and screening time by at least 4× at 2,000 objects compared with brute force, while finding exactly the same close approaches**, and that the classical apogee–perigee filter (Hoots et al., 1984) loses most of its power when half the catalogue shares one constellation shell (< 90 % reduction).

### 2. TOPICALITY, SCIENTIFIC VALUE & ECONOMIC APPLICABILITY

Applications already filed could put more than a million satellites in orbit (UN, 2025). A single collision, such as Iridium 33–Kosmos 2251 in 2009, created about 2,000 trackable fragments, and the Kessler cascade could make orbits unusable. Screening that scales is a precondition for safe operations. Using the measured cost of 4.62 ns per pair check, brute-force screening of 1,000,000 objects would need about 2,775 CPU-hours per day (116 cores running continuously, ≈ USD 50,600 per year at USD 0.05 per CPU-hour), against about 2.1 CPU-hours per day (≈ USD 38 per year) for the grid — a **99.9 % reduction** that puts whole-sky screening within reach of a single laptop, a university or a small national agency. The platform also quantifies two other costs: propellant to comply with the 25-year and 5-year disposal rules, and propellant saved by ordering a multi-target debris-removal route (greedy and exhaustive search versus a naive order).

### 3. METHODOLOGY, ARCHITECTURE & EQUIPMENT USED

A synthetic low-Earth-orbit catalogue generator (seeded, reproducible) models the real population: 45 % constellation shell at 545–555 km / 53° in 72 planes, 15 % sun-synchronous, 25 % debris at 700–1,000 km, 15 % other. Objects move on circular two-body orbits. All three methods share one definition of an event (20 s sampling over 5,400 s; candidate gate = threshold + maximum closing speed × step; straight-line closest approach within the step; 10 km threshold), so results can be compared pair by pair. Method A checks all pairs; B removes pairs whose orbital shells never come within the threshold; C hashes positions into cubic cells as wide as the gate and checks only same and neighbouring cells (13-cell half-neighbourhood). Design: 4 catalogue sizes (250–2,000) × 25 seeds = 100 scenarios, 300 runs, pre-registered before running (SHA-256 of the plan stored with the results). Speed-ups are reported as geometric means with 95 % t-intervals. Software: TypeScript, React 19, Vite, Vitest (37 automated tests), Web Workers; hosted on Vercel. Hardware: Intel i7-9700K laptop. No personal data is collected; AI assistance is logged and every output was verified by tests.

### 4. EXPERIMENTAL DATA ANALYSIS & BENCHMARK RESULTS

The grid removed **99.84–99.86 %** of pair checks at every size. Its speed-up grew with the catalogue: 0.97× [0.91–1.05] at 250 objects, 1.75× at 500, 3.28× at 1,000 and **6.09× [6.06–6.11] at 2,000**. Recall and precision were **1.00 in all 300 runs** for both fast methods. The apogee–perigee filter reduced checks by only 75.6–76.4 % (2.2–2.6× faster). In an exploratory sweep, at 16,000 objects the grid needed 4.4 s per window against 69 s for the filter and an estimated 160 s for brute force. All four hypotheses were supported. (Charts: Visual Annex, Figures 1–3.)

### 5. CONCLUSIONS

- Spatial hashing finds every close approach that brute force finds while doing 0.15 % of the work; its advantage grows with the catalogue, as hypothesised.
- For small catalogues (≈ 250 objects) the grid brings no speed gain — the method pays off where it is needed, in crowded skies.
- Classical shell filters lose their power in the mega-constellation era; screening must be spatial, not only orbital. The MVP runs all three methods live in any browser.

### 6. BIBLIOGRAPHY

[1] United Nations DGC & UNOOSA (2025). *The Race to Save Space*. United Nations.
[2] ESA Space Debris Office (2025). *Space debris by the numbers*. European Space Agency.
[3] Kessler, D. J., Cour-Palais, B. G. (1978). Collision frequency of artificial satellites: the creation of a debris belt. *Journal of Geophysical Research*, 83(A6), 2637–2646.
[4] Hoots, F. R., Crawford, L. L., Roehrich, R. L. (1984). An analytic method to determine future close approaches between satellites. *Celestial Mechanics*, 33, 143–158.
[5] Vallado, D. A. (2013). *Fundamentals of Astrodynamics and Applications* (4th ed.). Microcosm Press.
[6] UNOOSA (2019). *Guidelines for the Long-term Sustainability of Outer Space Activities*. United Nations.

> Format for submission: Times New Roman 12 pt, max 2 A4 pages, < 1 MB; charts go in the separate Visual Annex (< 1 MB).

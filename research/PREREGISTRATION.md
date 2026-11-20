# Pre-registration — conjunction screening benchmark

Written on **20 November 2026**, before the benchmark in `research/benchmark.ts` was run on its seeds. The benchmark stores the SHA-256 of this file in `research/results/benchmark.json`, so any later edit to the hypotheses would show.

## Question

Every day, satellite operators must check every pair of tracked objects for close approaches ("conjunctions"). The number of pairs grows with the square of the catalogue: 40,000 objects make about 800 million pairs. As mega-constellations grow, **which screening method keeps this tractable without missing a single close approach?**

## Methods compared

All three use the same definition of an event (sampling every 20 s over 5,400 s, a candidate gate of threshold + maximum relative speed × step, straight-line closest approach inside each step, a 10 km threshold), so their results can be compared pair by pair.

| | Method | Idea |
|---|---|---|
| A | Brute force | Every pair at every time step. The reference. |
| B | Apogee–perigee filter (Hoots et al., 1984) | Drop, once, every pair whose orbital shells never come within the threshold. |
| C | Spatial hash grid | At every step, put objects in cubic cells as wide as the gate; only measure pairs in the same or neighbouring cells. |

## Hypotheses

- **H1 (work).** At N ≥ 1,000 objects, the grid (C) makes **at least 99 % fewer pair distance checks** than brute force (A) — mean over seeds.
- **H2 (time).** At N = 2,000, the grid is **at least 4× faster** than brute force: the lower bound of the 95 % confidence interval of the geometric-mean speed-up is above 4.
- **H3 (no misses).** Both B and C find **exactly** the same set of conjunction pairs as A in all 100 scenarios (recall = precision = 1).
- **H4 (crowding).** Because a mega-constellation puts thousands of objects in the same few-kilometre shell, the apogee–perigee filter (B) removes **less than 90 %** of the pair checks at every N, so it is far weaker than its reputation from the pre-constellation era.

## Design

- Catalogue sizes N = 250, 500, 1,000, 2,000; 25 seeds each (1001–1025) → **100 scenarios**, each run by all three methods.
- Synthetic catalogue (`src/utils/screening/population.ts`): 45 % constellation shell (545–555 km, 53°, 72 planes), 15 % sun-synchronous (480–620 km), 25 % debris (700–1,000 km), 15 % other LEO (350–1,200 km). Circular two-body orbits.
- Method order rotates with the seed. One warm-up run before timing.
- Speed-up averaged as a geometric mean with a 95 % t-interval on the logs. Check reduction as an arithmetic mean with a 95 % t-interval.
- An extra scaling sweep (seed 2001, N up to 16,000, B and C only) is **exploratory**, not a test of a hypothesis.

## Pilot

One pilot run on seed 1 (N = 250, 1,000, 2,000) was made while writing the code; it found and fixed a bug in the grid's cell key (precision loss in packing three indices into one number, which paired objects with themselves). After the fix the pilot showed identical event sets and a 5.5× speed-up at N = 2,000. The seeds above were not used in the pilot.

## Known limitations (stated in advance)

- Circular orbits and two-body motion only; real screening uses full ephemerides (SGP4 or better) and covariance.
- Straight-line motion inside a 20 s step slightly misestimates miss distances (orbital curvature over 150 km of arc is about 1.6 km); the definition is shared by all methods, so the comparison is fair, but absolute miss distances are approximate.
- Timings depend on the machine and the JavaScript engine; pair-check counts do not.

// Builds the A0 poster (poster.html) from research/results/benchmark.json.
// Run from the project root:  node docs/moldsef/poster/build.mjs
// Then print to PDF:          see docs/moldsef/poster/README.md
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../..')
const bench = JSON.parse(fs.readFileSync(path.join(root, 'research/results/benchmark.json'), 'utf8'))
const qr = (n) => fs.readFileSync(path.join(here, `img/${n}.svg`), 'utf8')

// ---------- data ----------
const S = bench.summary
const big = S.find((s) => s.n === 2000)
// Same definition as the Research page: median brute-force time at N = 2,000 per pair check.
const nsPerCheck = (big.methods.brute.msMedian * 1e6) / big.methods.brute.pairChecksMean
const runs = bench.runs.length
const fastRuns = bench.runs.filter((r) => r.method !== 'brute')
const allRecall = fastRuns.every((r) => r.recall === 1 && r.precision === 1)
const gridRed = S.map((s) => s.methods.grid.checkReduction.mean * 100)
const apoRed = S.map((s) => s.methods.apogee.checkReduction.mean * 100)
const sp = (m, n) => S.find((s) => s.n === n).methods[m].speedup

const scaling = bench.scaling
const last = scaling[scaling.length - 1]
const prev = scaling[scaling.length - 2]
const gridExp = Math.log(last.grid.ms / prev.grid.ms) / Math.log(last.n / prev.n)
const WINDOWS = 16
const USD_CPU_H = 0.05
const cost = (n) => {
  const bruteH = ((n * (n - 1)) / 2) * 270 * nsPerCheck * 1e-9 * WINDOWS / 3600
  const gridH = (last.grid.ms * (n / last.n) ** gridExp) / 1000 * WINDOWS / 3600
  return { bruteH, gridH, bruteUsd: bruteH * 365 * USD_CPU_H, gridUsd: gridH * 365 * USD_CPU_H }
}
const c40 = cost(40000)
const c1m = cost(1_000_000)

const f = (x, d = 0) => x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })

// ---------- palette ----------
const C = {
  ink: '#070a18', text: '#151a2e', mute: '#5b6178', line: '#d9dce8',
  flare: '#ff6a2b', ember: '#e2492b', orbit: '#0a93b5', nebula: '#6d4aff', brute: '#8a90a6', safe: '#13a36b',
}

// ---------- charts ----------
function speedupChart() {
  const W = 760, H = 300, L = 70, R = 20, T = 30, B = 52
  const max = 7
  const y = (v) => T + (H - T - B) * (1 - v / max)
  const ns = S.map((s) => s.n)
  const gw = (W - L - R) / ns.length
  let g = ''
  for (let v = 0; v <= max; v++) {
    g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${C.line}" stroke-width="1"/>`
    g += `<text x="${L - 12}" y="${y(v) + 6}" text-anchor="end" class="ax">${v}×</text>`
  }
  g += `<line x1="${L}" x2="${W - R}" y1="${y(4)}" y2="${y(4)}" stroke="${C.ember}" stroke-width="2.5" stroke-dasharray="8 6"/>`
  g += `<text x="${L + 8}" y="${y(4) - 10}" text-anchor="start" class="ax" fill="${C.ember}" style="fill:${C.ember};font-weight:700">H2 target: 4×</text>`
  g += `<line x1="${L}" x2="${W - R}" y1="${y(1)}" y2="${y(1)}" stroke="${C.mute}" stroke-width="2"/>`
  ns.forEach((n, i) => {
    const cx = L + gw * i + gw / 2
    ;[['apogee', C.nebula, -1], ['grid', C.flare, 1]].forEach(([m, col, side]) => {
      const s = sp(m, n)
      const bw = gw * 0.32
      const x = cx + (side < 0 ? -bw - 4 : 4)
      g += `<rect x="${x}" y="${y(s.mean)}" width="${bw}" height="${y(0) - y(s.mean)}" rx="4" fill="${col}"/>`
      g += `<line x1="${x + bw / 2}" x2="${x + bw / 2}" y1="${y(s.high)}" y2="${y(s.low)}" stroke="${C.ink}" stroke-width="2.5"/>`
      g += `<text x="${x + bw / 2}" y="${y(s.high) - 10}" text-anchor="middle" class="val">${s.mean.toFixed(2)}×</text>`
    })
    g += `<text x="${cx}" y="${H - B + 30}" text-anchor="middle" class="ax">N = ${f(n)}</text>`
  })
  return `<svg viewBox="0 0 ${W} ${H}" class="chart">${g}</svg>`
}

function scalingChart() {
  const W = 760, H = 300, L = 90, R = 215, T = 20, B = 60
  const xs = scaling.map((s) => s.n)
  const lx = (n) => L + (W - L - R) * (Math.log10(n) - Math.log10(1000)) / (Math.log10(16000) - Math.log10(1000))
  const lo = -1, hi = 3 // 0.1 s .. 1000 s
  const ly = (sec) => T + (H - T - B) * (1 - (Math.log10(sec) - lo) / (hi - lo))
  let g = ''
  for (let e = lo; e <= hi; e++) {
    const v = 10 ** e
    g += `<line x1="${L}" x2="${W - R}" y1="${ly(v)}" y2="${ly(v)}" stroke="${C.line}"/>`
    g += `<text x="${L - 12}" y="${ly(v) + 6}" text-anchor="end" class="ax">${v >= 1 ? f(v) : v} s</text>`
  }
  xs.forEach((n) => (g += `<text x="${lx(n)}" y="${H - B + 34}" text-anchor="middle" class="ax">${n >= 1000 ? n / 1000 + 'k' : n}</text>`))
  g += `<text x="${(L + W - R) / 2}" y="${H - 8}" text-anchor="middle" class="ax">objects in the catalogue (log scale)</text>`
  const series = [
    ['Brute (est.)', C.brute, scaling.map((s) => (s.bruteChecks * nsPerCheck) / 1e9), '10 8'],
    ['Apogee filter', C.nebula, scaling.map((s) => s.apogee.ms / 1000), ''],
    ['Grid', C.flare, scaling.map((s) => s.grid.ms / 1000), ''],
  ]
  series.forEach(([name, col, vals, dash]) => {
    const pts = vals.map((v, i) => `${lx(xs[i])},${ly(v)}`).join(' ')
    g += `<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="5" stroke-dasharray="${dash}" stroke-linejoin="round"/>`
    vals.forEach((v, i) => (g += `<circle cx="${lx(xs[i])}" cy="${ly(v)}" r="7" fill="${col}"/>`))
    const v = vals[vals.length - 1]
    g += `<text x="${lx(xs[xs.length - 1]) + 16}" y="${ly(v) + 7}" text-anchor="start" class="val" style="fill:${col}">${name} ${v < 10 ? v.toFixed(1) : f(v)} s</text>`
  })
  return `<svg viewBox="0 0 ${W} ${H}" class="chart">${g}</svg>`
}

function checksChart() {
  const W = 760, H = 250, L = 250, R = 150
  const rows = [
    ['Brute force', big.methods.brute.pairChecksMean, C.brute],
    ['Apogee–perigee', big.methods.apogee.pairChecksMean, C.nebula],
    ['Spatial hash grid', big.methods.grid.pairChecksMean, C.flare],
  ]
  const max = rows[0][1]
  let g = ''
  rows.forEach(([name, v, col], i) => {
    const y = 20 + i * 76
    const w = Math.max(6, (W - L - R) * (v / max))
    g += `<text x="${L - 16}" y="${y + 36}" text-anchor="end" class="lab">${name}</text>`
    g += `<rect x="${L}" y="${y + 6}" width="${w}" height="46" rx="6" fill="${col}"/>`
    g += `<text x="${L + w + 14}" y="${y + 38}" class="val">${(v / 1e6).toFixed(v < 1e6 ? 2 : 0)} M</text>`
  })
  return `<svg viewBox="0 0 ${W} ${H}" class="chart">${g}</svg>`
}

function costChart() {
  const W = 760, H = 150, L = 200, R = 230
  const rows = [['Brute force', c1m.bruteH, C.brute], ['Spatial hash grid', c1m.gridH, C.flare]]
  let g = ''
  rows.forEach(([name, v, col], i) => {
    const y = 6 + i * 72
    const w = Math.max(8, (W - L - R) * (v / c1m.bruteH))
    g += `<text x="${L - 16}" y="${y + 42}" text-anchor="end" class="lab">${name}</text>`
    g += `<rect x="${L}" y="${y + 8}" width="${w}" height="50" rx="6" fill="${col}"/>`
    g += `<text x="${L + w + 14}" y="${y + 42}" class="val">${v < 10 ? v.toFixed(1) : f(v)} CPU-h / day</text>`
  })
  return `<svg viewBox="0 0 ${W} ${H}" class="chart">${g}</svg>`
}

// ---------- method diagrams ----------
function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647) }
function methodBrute() {
  const r = rng(7), pts = Array.from({ length: 11 }, () => [20 + r() * 260, 20 + r() * 160])
  let g = ''
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++)
    g += `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[j][0]}" y2="${pts[j][1]}" stroke="${C.brute}" stroke-width="1.2" opacity=".7"/>`
  pts.forEach(([x, y]) => (g += `<circle cx="${x}" cy="${y}" r="6" fill="${C.ink}"/>`))
  return `<svg viewBox="0 0 300 200" class="diag">${g}</svg>`
}
function methodApogee() {
  let g = ''
  const cx = 150, cy = 100
  ;[[34, C.mute], [58, C.nebula], [61, C.nebula], [64, C.nebula], [88, C.mute]].forEach(([rr, col], i) =>
    (g += `<ellipse cx="${cx}" cy="${cy}" rx="${rr * 1.5}" ry="${rr}" fill="none" stroke="${col}" stroke-width="${i >= 1 && i <= 3 ? 3 : 2}" ${i === 0 || i === 4 ? 'stroke-dasharray="6 5"' : ''}/>`))
  g += `<circle cx="${cx}" cy="${cy}" r="20" fill="${C.orbit}"/>`
  return `<svg viewBox="0 0 300 200" class="diag">${g}</svg>`
}
function methodGrid() {
  let g = ''
  const s = 40, ox = 30, oy = 10
  for (let i = 0; i <= 6; i++) g += `<line x1="${ox + i * s}" y1="${oy}" x2="${ox + i * s}" y2="${oy + 4 * s}" stroke="${C.line}" stroke-width="2"/>`
  for (let j = 0; j <= 4; j++) g += `<line x1="${ox}" y1="${oy + j * s}" x2="${ox + 6 * s}" y2="${oy + j * s}" stroke="${C.line}" stroke-width="2"/>`
  g += `<rect x="${ox + 2 * s}" y="${oy + s}" width="${3 * s}" height="${3 * s}" fill="${C.flare}" opacity=".16" stroke="${C.flare}" stroke-width="3"/>`
  const r = rng(11)
  const pts = Array.from({ length: 16 }, () => [ox + 6 + r() * (6 * s - 12), oy + 6 + r() * (4 * s - 12)])
  const me = [ox + 3.5 * s, oy + 2.5 * s]
  pts.forEach(([x, y]) => {
    const near = x > ox + 2 * s && x < ox + 5 * s && y > oy + s && y < oy + 4 * s
    if (near) g += `<line x1="${me[0]}" y1="${me[1]}" x2="${x}" y2="${y}" stroke="${C.flare}" stroke-width="2"/>`
    g += `<circle cx="${x}" cy="${y}" r="6" fill="${near ? C.flare : C.ink}"/>`
  })
  g += `<circle cx="${me[0]}" cy="${me[1]}" r="9" fill="${C.ember}" stroke="#fff" stroke-width="3"/>`
  return `<svg viewBox="0 0 300 200" class="diag">${g}</svg>`
}

function launchChart() {
  const bars = [['1957–2012', 150], ['2013', 210], ['2020', 1200], ['2022', 2470]]
  const W = 520, H = 230, B = 44, T = 36
  const bw = 90, gap = (W - bars.length * bw) / (bars.length + 1)
  let g = ''
  bars.forEach(([l, v], i) => {
    const h = (H - B - T) * (v / 2470)
    const x = gap + i * (bw + gap)
    g += `<rect x="${x}" y="${H - B - h}" width="${bw}" height="${h}" rx="6" fill="${i === 3 ? C.flare : '#ffb38f'}"/>`
    g += `<text x="${x + bw / 2}" y="${H - B - h - 12}" text-anchor="middle" class="val">${f(v)}</text>`
    g += `<text x="${x + bw / 2}" y="${H - 14}" text-anchor="middle" class="ax">${l}</text>`
  })
  return `<svg viewBox="0 0 ${W} ${H}" class="chart">${g}</svg>`
}

function orbitArt() {
  let g = ''
  const r = rng(3)
  for (let i = 0; i < 260; i++) {
    const a = r() * Math.PI * 2, rad = 150 + r() * 95, tilt = r() < 0.45 ? 0.36 : 0.2 + r() * 0.6
    const x = 300 + Math.cos(a) * rad * 1.15, y = 260 + Math.sin(a) * rad * tilt * 1.6
    const col = r() < 0.25 ? C.flare : r() < 0.6 ? '#67e3ff' : '#c9d4ff'
    g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.6 + r() * 2.4).toFixed(1)}" fill="${col}" opacity="${(0.55 + r() * 0.45).toFixed(2)}"/>`
  }
  g = `<defs><radialGradient id="e" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#7cc8ff"/><stop offset=".45" stop-color="#1f5fd6"/><stop offset="1" stop-color="#07123a"/></radialGradient>
  <radialGradient id="h" r="50%"><stop offset=".7" stop-color="#67e3ff" stop-opacity=".25"/><stop offset="1" stop-color="#67e3ff" stop-opacity="0"/></radialGradient></defs>
  <circle cx="300" cy="260" r="175" fill="url(#h)"/>
  <ellipse cx="300" cy="260" rx="270" ry="80" fill="none" stroke="#67e3ff" stroke-opacity=".35" stroke-width="2"/>
  <ellipse cx="300" cy="260" rx="250" ry="150" fill="none" stroke="${C.flare}" stroke-opacity=".35" stroke-width="2" transform="rotate(-24 300 260)"/>
  <circle cx="300" cy="260" r="130" fill="url(#e)"/>` + g
  return `<svg viewBox="0 0 600 520" class="art">${g}</svg>`
}

// ---------- screenshot crops (source images are 1440 px wide) ----------
const shot = (file, x, y, w, h, cap) => `<figure class="shot"><div class="crop" style="aspect-ratio:${w}/${h}"><img src="img/${file}" style="width:${(1440 / w) * 100}%;margin-left:${(-x / w) * 100}%;margin-top:${(-y / w) * 100}%"></div><figcaption>${cap}</figcaption></figure>`

// ---------- page ----------
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>ClearOrbit — A0 poster</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>
@page { size: 841mm 1189mm; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
html, body { width: 841mm; background: #f4f5fa; color: ${C.text}; font-family: Manrope, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact }
body { font-size: 20pt; line-height: 1.34 }
h1, h2, h3, .num { font-family: 'Space Grotesk', sans-serif; letter-spacing: -.01em }
.mono { font-family: 'JetBrains Mono', monospace }
.page { width: 841mm; min-height: 1189mm; display: flex; flex-direction: column }

header { flex-shrink: 0; background: ${C.ink}; color: #eef1ff; padding: 18mm 28mm 14mm; display: grid; grid-template-columns: 1fr 175mm; gap: 12mm; position: relative; overflow: hidden }
header .eyebrow { font-family: 'JetBrains Mono'; font-size: 15pt; letter-spacing: .22em; text-transform: uppercase; color: ${C.flare} }
header h1 { font-size: 118pt; line-height: .92; margin-top: 5mm; font-weight: 700 }
header h1 span { background: linear-gradient(90deg, #ffd2b8, ${C.flare}); -webkit-background-clip: text; color: transparent }
header .sub { font-size: 30pt; line-height: 1.18; margin-top: 5mm; font-weight: 600; color: #fff; max-width: 470mm }
header .who { margin-top: 7mm; display: flex; gap: 16mm; font-size: 19pt; color: #c3c9e6 }
header .who b { display: block; color: #fff; font-size: 24pt; font-weight: 700 }
header .art { position: absolute; right: -18mm; top: -6mm; width: 250mm; opacity: .95 }
header .qrs { position: relative; align-self: end; display: flex; gap: 8mm; justify-content: flex-end }
.qr { background: #fff; border-radius: 4mm; padding: 4mm; width: 70mm; text-align: center; color: ${C.ink} }
.qr svg { width: 100%; height: auto; display: block }
.qr p { font-family: 'JetBrains Mono'; font-size: 12.5pt; margin-top: 2.5mm; font-weight: 700 }

main { flex: 1; padding: 11mm 28mm 0; display: flex; flex-direction: column; gap: 9mm }
.row { display: grid; gap: 9mm }
.card { background: #fff; border: 1px solid ${C.line}; border-radius: 6mm; padding: 7mm 9mm; }
.card.dark { background: ${C.ink}; color: #eef1ff; border: none }
h2 { font-size: 33pt; font-weight: 700; line-height: 1.05; display: flex; align-items: baseline; gap: 4mm; margin-bottom: 4mm }
h2 .n { font-family: 'JetBrains Mono'; font-size: 17pt; color: ${C.flare}; font-weight: 700 }
h3 { font-size: 23pt; font-weight: 700; margin-bottom: 2mm }
p + p { margin-top: 3mm }
.mute { color: ${C.mute} }
.small { font-size: 16pt; line-height: 1.35 }
.src { font-size: 13pt; color: ${C.mute}; margin-top: 3mm }

.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; margin: 4mm 0 }
.stat { border-left: 2.2mm solid ${C.flare}; padding: 1mm 0 1mm 4mm }
.stat .num { font-size: 44pt; font-weight: 700; line-height: 1 }
.stat p { font-size: 15.5pt; color: ${C.mute}; margin-top: 1.5mm; line-height: 1.25 }

.hyp { background: linear-gradient(135deg, #fff1ea, #ffe3d6); border: 1.2mm solid ${C.flare}; border-radius: 5mm; padding: 7mm 8mm; font-size: 23pt; line-height: 1.3; font-weight: 600 }
.hyp b { color: ${C.ember} }
ul.h { list-style: none; margin-top: 5mm; display: grid; gap: 3mm }
ul.h li { display: grid; grid-template-columns: 17mm 1fr; font-size: 17.5pt; line-height: 1.3 }
ul.h li b.k { font-family: 'JetBrains Mono'; color: ${C.flare} }

.methods { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7mm }
.method { border-radius: 5mm; background: #f7f8fc; border: 1px solid ${C.line}; padding: 6mm }
.method .tag { font-family: 'JetBrains Mono'; font-size: 13pt; letter-spacing: .12em; text-transform: uppercase; color: ${C.mute} }
.method.win { background: #fff4ee; border: .8mm solid ${C.flare} }
.method.win .tag { color: ${C.ember} }
.diag { width: 100%; height: 36mm; margin: 1mm 0 }
.diag .dg { font-family: Manrope; font-size: 13px; fill: ${C.mute}; font-weight: 600 }
.facts { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4mm; margin-top: 5mm }
.fact { background: ${C.ink}; color: #fff; border-radius: 4mm; padding: 4mm 5mm }
.fact .num { font-size: 28pt; font-weight: 700; color: ${C.flare}; line-height: 1.05 }
.fact p { font-size: 14pt; color: #c3c9e6; line-height: 1.25 }

.hero { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5mm; margin-bottom: 5mm }
.hero div { background: ${C.ink}; color: #fff; border-radius: 5mm; padding: 5mm 6mm }
.hero .num { font-size: 52pt; font-weight: 700; line-height: 1; color: ${C.flare} }
.hero .num.ok { color: #3ee08f }
.hero p { font-size: 16.5pt; color: #c3c9e6; margin-top: 2mm; line-height: 1.28 }
.chart { width: 100%; height: auto; display: block }
.chart .ax { font-family: 'JetBrains Mono'; font-size: 17px; fill: ${C.mute} }
.chart .val { font-family: 'Space Grotesk'; font-size: 19px; font-weight: 700; fill: ${C.text} }
.chart .lab { font-family: Manrope; font-size: 20px; font-weight: 700; fill: ${C.text} }
.legend { display: flex; gap: 7mm; font-size: 15pt; margin: 1mm 0 2mm; flex-wrap: wrap }
.legend i { display: inline-block; width: 6mm; height: 6mm; border-radius: 1.5mm; vertical-align: -0.8mm; margin-right: 2mm }
.figt { font-size: 18pt; font-weight: 700; margin-bottom: 1mm }
table { width: 100%; border-collapse: collapse; font-size: 16pt }
th, td { text-align: left; padding: 2.2mm 2mm; border-bottom: 1px solid ${C.line} }
th { font-family: 'JetBrains Mono'; font-size: 12.5pt; text-transform: uppercase; letter-spacing: .08em; color: ${C.mute}; font-weight: 700 }
td.ok { color: ${C.safe}; font-weight: 800 }

.shots { display: grid; grid-template-columns: 1.15fr 1.05fr .9fr 1.15fr; gap: 5mm; align-items: start }
.refsbar { display: flex; flex-wrap: wrap; gap: 1.5mm 7mm; font-size: 13.5pt; color: #3a4060; padding: 0 2mm }
.refsbar b { font-family: 'Space Grotesk'; color: ${C.text} }
.shot .crop { overflow: hidden; border-radius: 3.5mm; background: #03040b; border: 1px solid #1d2240 }
.shot img { display: block }
.shot figcaption { font-size: 14.5pt; margin-top: 2mm; line-height: 1.25 }
.shot figcaption b { color: ${C.ember} }

ul.dots { list-style: none; display: grid; gap: 3mm }
ul.dots li { padding-left: 7mm; position: relative; font-size: 18.5pt; line-height: 1.32 }
ul.dots li::before { content: ''; position: absolute; left: 0; top: 3.2mm; width: 3.2mm; height: 3.2mm; border-radius: 50%; background: ${C.flare} }
.card.dark ul.dots li { color: #dfe4ff }
ol.refs { padding-left: 7mm; font-size: 13.5pt; line-height: 1.3; display: grid; gap: 1.6mm; color: #3a4060 }
footer { padding: 8mm 28mm 10mm; display: flex; justify-content: space-between; font-family: 'JetBrains Mono'; font-size: 13pt; color: ${C.mute} }
</style></head>
<body><div class="page">

<header>
  ${orbitArt()}
  <div style="position:relative">
    <p class="eyebrow">MoldSEF 2027 · III. Information Technology &nbsp;|&nbsp; Infomatrix · Software</p>
    <h1>Clear<span>Orbit</span></h1>
    <p class="sub">Scalable collision screening for the mega-constellation era — and an interactive platform for keeping outer space usable</p>
    <div class="who">
      <p><b>Cosmin Marandici</b>Author · grade 12 C</p>
      <p><b>Liceul Teoretic „Orizont”</b>filiala Durlești, Chișinău</p>
      <p><b>Azamat Jayush</b>Supervisor</p>
    </div>
  </div>
  <div class="qrs">
    <div class="qr">${qr('site')}<p>LIVE APP</p></div>
    <div class="qr">${qr('repo')}<p>SOURCE CODE</p></div>
  </div>
</header>

<main>
  <div class="row" style="grid-template-columns: 1.1fr 1fr">
    <section class="card">
      <h2><span class="n">01</span>The problem: orbit is filling up</h2>
      <p>Satellites run our phones, maps, weather forecasts and banks. Their orbits are crowded with dead satellites and fragments moving at <b>7–8 km/s</b> — a 30 g bolt hits like 2.6 cars crashing.</p>
      <div class="stats">
        <div class="stat"><p class="num">40,500</p><p>objects &gt; 10 cm, tracked by radar</p></div>
        <div class="stat"><p class="num">1.1 M</p><p>objects of 1–10 cm, mostly untracked</p></div>
        <div class="stat"><p class="num">130 M</p><p>fragments of 1 mm – 1 cm</p></div>
      </div>
      <div style="display:grid;grid-template-columns:0.9fr 1.1fr;gap:6mm;align-items:center">
        <div><p class="figt">Satellites launched per year</p>${launchChart()}</div>
        <p class="small">Every collision makes more debris, which makes more collisions — the <b>Kessler cascade</b>. Operators must check every pair of objects for close approaches every day, and pairs grow with the <b>square</b> of the catalogue: 40,000 objects ≈ 800 million pairs. Filed applications could put <b>over a million</b> satellites in orbit.</p>
      </div>
      <p class="src">Sources: ESA Space Debris Office (2025); UN DGC &amp; UNOOSA, <i>The Race to Save Space</i> (2025).</p>
    </section>
    <section class="card">
      <h2><span class="n">02</span>Question &amp; hypothesis</h2>
      <p>Can screening keep up with a million-object sky — <b>without missing a single close approach</b> — now that mega-constellations crowd one orbital shell?</p>
      <div class="hyp" style="margin-top:5mm">If objects are sorted into a <b>spatial hash grid</b> at each time step, then at 2,000 objects screening will make <b>≥ 99 % fewer</b> pair checks and run <b>≥ 4× faster</b> than brute force, while finding <b>exactly the same</b> close approaches.</div>
      <ul class="h">
        <li><b class="k">H1</b><span>≥ 99 % fewer pair checks at N ≥ 1,000.</span></li>
        <li><b class="k">H2</b><span>At N = 2,000, lower 95 % CI bound of the speed-up &gt; 4×.</span></li>
        <li><b class="k">H3</b><span>Recall = precision = 1 in all 100 scenarios.</span></li>
        <li><b class="k">H4</b><span>The classical apogee–perigee filter removes &lt; 90 % of checks.</span></li>
      </ul>
      <p class="small mute" style="margin-top:4mm">Pre-registered and hashed (SHA-256 <span class="mono">${bench.preregistrationSha256.slice(0, 12)}…</span>) <b>before</b> the run.</p>
    </section>
  </div>

  <section class="card">
    <h2><span class="n">03</span>Method: three ways to find close approaches</h2>
    <div class="methods">
      <div class="method"><p class="tag">A · reference</p><h3>Brute force</h3>${methodBrute()}<p class="small">Checks every pair at every 20 s step. Always right; work grows as N².</p></div>
      <div class="method"><p class="tag">B · classical (Hoots, 1984)</p><h3>Apogee–perigee filter</h3>${methodApogee()}<p class="small">Drops pairs whose altitude bands never overlap — weak when thousands share one shell.</p></div>
      <div class="method win"><p class="tag">C · proposed</p><h3>Spatial hash grid</h3>${methodGrid()}<p class="small">Hashes positions into cubes as wide as the alert gate; compares only the own and 13 neighbouring cells.</p></div>
    </div>
    <div class="facts">
      <div class="fact"><p class="num">100</p><p>scenarios: 4 sizes (250–2,000) × 25 seeds</p></div>
      <div class="fact"><p class="num">${runs}</p><p>timed runs, order rotated, warm-up first</p></div>
      <div class="fact"><p class="num">10 km</p><p>alert distance, 90-min window</p></div>
      <div class="fact"><p class="num">45 %</p><p>objects in one 550 km constellation shell</p></div>
      <div class="fact"><p class="num">37</p><p>automated tests, one shared event definition</p></div>
    </div>
  </section>

  <section class="card">
    <h2><span class="n">04</span>Results — all four hypotheses supported</h2>
    <div class="hero">
      <div><p class="num">${Math.min(...gridRed).toFixed(2)} %</p><p>fewer pair checks with the grid, at every size (H1 ✓)</p></div>
      <div><p class="num">${sp('grid', 2000).mean.toFixed(2)}×</p><p>faster at 2,000 objects, 95 % CI ${sp('grid', 2000).low.toFixed(2)}–${sp('grid', 2000).high.toFixed(2)} (H2 ✓)</p></div>
      <div><p class="num ok">0 missed</p><p>recall = precision = 1.00 in all ${fastRuns.length} fast runs (H3 ✓)</p></div>
      <div><p class="num" style="color:#a48bff">${Math.max(...apoRed).toFixed(0)} %</p><p>is all the classical filter removes in a crowded sky (H4 ✓)</p></div>
    </div>
    <div class="row" style="grid-template-columns: 1fr 1fr">
      <div>
        <p class="figt">Fig. 1 — Speed-up over brute force (geometric mean, 95 % CI)</p>
        <div class="legend"><span><i style="background:${C.nebula}"></i>Apogee–perigee filter</span><span><i style="background:${C.flare}"></i>Spatial hash grid</span></div>
        ${speedupChart()}
        <p class="small mute">Honest finding: at 250 objects the grid is <b>not</b> faster (${sp('grid', 250).mean.toFixed(2)}×) — building the cells costs as much as checking every pair. Its advantage grows with the catalogue.</p>
      </div>
      <div>
        <p class="figt">Fig. 2 — Time per 90-min window as the sky fills up (log–log)</p>
        <div class="legend"><span><i style="background:${C.brute}"></i>Brute force (estimated)</span><span><i style="background:${C.nebula}"></i>Apogee filter</span><span><i style="background:${C.flare}"></i>Grid</span></div>
        ${scalingChart()}
        <p class="small mute">Exploratory sweep to 16,000 objects; all methods agreed on every event. At 16,000 the grid is ≈ 37× faster than brute force.</p>
      </div>
    </div>
  </section>

  <div class="row" style="grid-template-columns: 1.15fr 1fr">
    <section class="card">
      <h2><span class="n">05</span>Economic impact</h2>
      <p class="small">Continuous screening, 16 windows a day; measured ${nsPerCheck.toFixed(2)} ns per check; USD 0.05 per CPU-hour (AWS EC2 on-demand range, 2026).</p>
      <p class="figt" style="margin-top:3mm">A future sky of 1,000,000 objects</p>
      ${costChart()}
      <table>
        <tr><th></th><th>Today · 40,000</th><th>Future · 1,000,000</th></tr>
        <tr><td>Brute force</td><td>${c40.bruteH.toFixed(1)} CPU-h/day · USD ${f(c40.bruteUsd)}/yr</td><td>${f(c1m.bruteH)} CPU-h/day · USD ${f(c1m.bruteUsd / 1000, 1)}k/yr</td></tr>
        <tr><td>Grid</td><td>${c40.gridH.toFixed(2)} CPU-h/day · USD ${f(c40.gridUsd)}/yr</td><td>${c1m.gridH.toFixed(1)} CPU-h/day · USD ${f(c1m.gridUsd)}/yr</td></tr>
      </table>
      <p class="small" style="margin-top:3mm"><b>${((1 - c1m.gridH / c1m.bruteH) * 100).toFixed(1)} % less compute.</b> Brute force needs <b>${Math.round(c1m.bruteH / 24)} cores running non-stop</b>; the grid fits on one school laptop.</p>
    </section>
    <div style="display:grid;gap:11mm;grid-template-rows:auto 1fr">
      <section class="card dark">
        <h2 style="color:#fff"><span class="n">07</span>Conclusions</h2>
        <ul class="dots">
          <li>Spatial hashing finds <b>every</b> close approach brute force finds, doing 0.15 % of the work.</li>
          <li>Its advantage <b>grows</b> with the catalogue: 1.75× → 3.28× → 6.09×, ≈ 37× at 16,000.</li>
          <li>1980s shell filters lose their power in crowded skies: screening must be <b>spatial</b>.</li>
        </ul>
      </section>
      <section class="card">
        <h2><span class="n">08</span>Responsible AI</h2>
        <p class="small">An AI coding assistant (Claude Opus 5.5, Anthropic) helped write code and text. Every formula is checked against its source and covered by <b>37 automated tests</b>, which caught a real bug before the benchmark. Results come only from running <span class="mono">npm run benchmark</span>. No AI images; every prompt is logged in <span class="mono">docs/AI_USAGE.md</span>.</p>
      </section>
    </div>
  </div>

  <section class="card">
    <h2><span class="n">06</span>The platform: four tools, one per UN solution <span class="small mute" style="font-family:Manrope;font-weight:500;margin-left:auto">React · TypeScript · Vite · EN / RO / RU · no tracking · Vercel</span></h2>
    <div class="shots">
      ${shot('deorbit.png', 39, 555, 1097, 700, '<b>01 Deorbit planner</b> — lifetime, 25 / 5-year rules, propellant')}
      ${shot('cleanup.png', 39, 588, 1097, 700, '<b>02 Clean-up mission</b> — your route vs greedy vs optimal')}
      ${shot('traffic.png', 520, 588, 616, 460, '<b>03 Collision screener</b> — all 3 methods live, 3,000 objects')}
      ${shot('home.png', 0, 1010, 1176, 830, '<b>Home</b> — Space Age story; <b>04 Space law</b> quiz &amp; pledge')}
    </div>
  </section>

  <section class="refsbar">
    <b>References</b>
    <span>[1] UN DGC &amp; UNOOSA (2025). <i>The Race to Save Space</i>.</span>
    <span>[2] ESA Space Debris Office (2025). <i>Space debris by the numbers</i>.</span>
    <span>[3] Kessler &amp; Cour-Palais (1978). <i>J. Geophys. Res.</i> 83(A6).</span>
    <span>[4] Hoots, Crawford &amp; Roehrich (1984). <i>Celestial Mechanics</i> 33.</span>
    <span>[5] Vallado (2013). <i>Fundamentals of Astrodynamics</i>, 4th ed.</span>
    <span>[6] UNOOSA (2019). <i>Long-term Sustainability Guidelines</i>.</span>
  </section>
</main>

<footer><span>clearorbit-beryl.vercel.app · github.com/Kosmozzzz/clearorbit</span><span>Benchmark: ${bench.machine.cpu.replace(/\s+/g, ' ').replace('(R)', '').replace('(TM)', '')}, Node ${bench.machine.node} · ${bench.createdAt.slice(0, 10)}</span></footer>
</div></body></html>`

fs.writeFileSync(path.join(here, 'poster.html'), html)
console.log('poster.html written', { nsPerCheck: nsPerCheck.toFixed(3), c1m, c40, gridExp: gridExp.toFixed(3) })

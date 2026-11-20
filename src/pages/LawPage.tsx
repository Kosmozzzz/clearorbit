import { useState } from 'react'
import { Section, SectionHead } from '../components/controls'
import { fill } from '../utils/text'
import { PageHeader } from '../components/PageHeader'
import { Pill } from '../components/Pill'
import { Reveal } from '../components/Reveal'
import { useOrbit } from '../context/orbit'
import { useLanguage } from '../i18n/LanguageContext'
import { PLEDGE_IDS } from '../utils/storage'

function Quiz() {
  const { t } = useLanguage()
  const q = t.law.quiz
  const { state, update } = useOrbit()
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const item = q.items[index]
  const total = q.items.length

  function choose(i: number) {
    if (picked !== null) return
    setPicked(i)
    if (i === item.answer) setScore((s) => s + 1)
  }

  function next() {
    if (index + 1 < total) {
      setIndex(index + 1)
      setPicked(null)
      return
    }
    const percent = Math.round((score / total) * 100)
    update('quiz', { best: Math.max(state.quiz.best, percent), answered: state.quiz.answered + 1 })
    setFinished(true)
  }

  function restart() {
    setIndex(0)
    setPicked(null)
    setScore(0)
    setFinished(false)
  }

  return (
    <div className="card p-6 sm:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="eyebrow">{q.title}</p>
        {state.quiz.answered > 0 && <p className="mono text-xs text-ice/55">{fill(q.best, { b: state.quiz.best })}</p>}
      </div>
      {finished ? (
        <div className="mt-8" role="status">
          <p className="display text-gradient text-[clamp(2.4rem,6vw,4rem)]">
            {score} / {total}
          </p>
          <p className="mt-4 text-lg text-ice/85">{fill(q.score, { s: score, n: total })}</p>
          <div className="mt-8">
            <Pill onClick={restart}>{q.again}</Pill>
          </div>
        </div>
      ) : (
        <>
          <p className="mono mt-6 text-xs text-ice/50">{fill(q.question, { i: index + 1, n: total })}</p>
          <p className="statement mt-3 text-[clamp(1.3rem,2.6vw,1.9rem)] text-white">{item.q}</p>
          <div className="mt-8 grid gap-3">
            {item.options.map((opt, i) => {
              const isAnswer = i === item.answer
              const state = picked === null ? 'idle' : isAnswer ? 'right' : picked === i ? 'wrong' : 'idle'
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => choose(i)}
                  disabled={picked !== null}
                  className={`rounded-2xl border px-5 py-4 text-left transition-colors ${
                    state === 'right' ? 'border-safe bg-safe/10 text-white' : state === 'wrong' ? 'border-danger bg-danger/10 text-white' : 'border-line text-ice/80 enabled:hover:border-ice/40 enabled:hover:text-white'
                  }`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
          {picked !== null && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4" role="status">
              <p className="max-w-xl text-ice/75">{item.why}</p>
              <Pill onClick={next}>{index + 1 < total ? q.next : q.finish}</Pill>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Pledge() {
  const { t } = useLanguage()
  const p = t.law.pledge
  const { state, update } = useOrbit()
  function toggle(id: string) {
    update('pledge', state.pledge.includes(id) ? state.pledge.filter((x) => x !== id) : [...state.pledge, id])
  }
  return (
    <div id="pledge" className="card scroll-mt-28 p-6 sm:p-10">
      <p className="eyebrow">{p.title}</p>
      <p className="mt-4 max-w-2xl text-lg text-ice/80">{p.body}</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {PLEDGE_IDS.map((id) => {
          const on = state.pledge.includes(id)
          return (
            <li key={id}>
              <button type="button" onClick={() => toggle(id)} aria-pressed={on} className={`flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-colors ${on ? 'border-flare bg-flare/10' : 'border-line hover:border-ice/40'}`}>
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border ${on ? 'border-flare bg-flare text-ink' : 'border-ice/30'}`} aria-hidden="true">
                  {on && '✓'}
                </span>
                <span className="text-ice/90">{p.items[id]}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mono mt-6 text-sm text-ember" role="status">
        {fill(p.count, { n: state.pledge.length })}
      </p>
    </div>
  )
}

export function LawPage() {
  const { t } = useLanguage()
  const l = t.law
  return (
    <>
      <PageHeader eyebrow={l.eyebrow} title={l.title} sub={l.sub} />
      <Section>
        <SectionHead title={l.treatiesTitle} />
        <ol className="relative mt-12 space-y-4 border-l border-line pl-6 sm:pl-10">
          {l.treaties.map((tr, i) => (
            <Reveal key={tr.year} delay={i * 60}>
              <li className="relative">
                <span className="absolute -left-[1.85rem] top-2 h-3 w-3 rounded-full bg-flare shadow-[0_0_14px_#ff7a3d] sm:-left-[2.85rem]" />
                <div className="card grid gap-3 p-6 sm:grid-cols-[6rem_1fr] sm:gap-8">
                  <p className="display text-3xl text-ember">{tr.year}</p>
                  <div>
                    <p className="text-lg font-semibold text-white">{tr.name}</p>
                    <p className="mt-2 leading-relaxed text-ice/70">{tr.body}</p>
                  </div>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>
      <Section className="border-t border-line">
        <SectionHead title={l.guidelinesTitle} />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {l.guidelines.map((g, i) => (
            <Reveal key={g.year} delay={i * 80} className="card p-7">
              <p className="display text-3xl text-orbit">{g.year}</p>
              <p className="mt-4 text-lg font-semibold text-white">{g.name}</p>
              <p className="mt-2 leading-relaxed text-ice/70">{g.body}</p>
            </Reveal>
          ))}
        </div>
      </Section>
      <Section className="border-t border-line">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Quiz />
          <Pledge />
        </div>
      </Section>
    </>
  )
}

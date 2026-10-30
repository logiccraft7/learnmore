import { useEffect, useMemo, useRef, useState } from 'react'
import { CONCEPTS, VOICES, concept } from '../learning/concepts'
import { dueConcepts, isDue, isUnlocked, level, type Learning } from '../learning/mastery'
import { formatAnswer, isCorrect } from '../learning/parse'
import { buildProblems, planSession, type SessionMode } from '../learning/session'
import type { ConceptId, Problem, VoiceId } from '../learning/types'
import { hintFor, voiceLevels, voiceLine } from '../learning/voices'
import { useGame } from '../state/game'
import { usePalace } from '../state/palace'
import { useWorld } from '../state/world'

/** The problem on screen, for test scripts. */
export const palaceDebug: { current: Problem | null } = { current: null }

/** Stable empty value: a selector returning a fresh {} would re-render forever. */
const NO_LEARNING: Learning = {}

const VOICE_ORDER: VoiceId[] = ['logician', 'economist', 'empath', 'skeptic']
const LETTERS = ['A', 'B', 'C', 'D']

function Stars({ n }: { n: number }) {
  return (
    <span className="stars" aria-label={`${n} of 5 stars`}>
      {'★'.repeat(n)}
      <span className="dim">{'★'.repeat(5 - n)}</span>
    </span>
  )
}

function untilLabel(ms: number): string {
  const h = ms / 3_600_000
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`
  if (h < 24) return `${Math.round(h)} h`
  return `${Math.round(h / 24)} d`
}

function Board({ learning, onStart }: { learning: Learning; onStart(mode: SessionMode): void }) {
  const now = Date.now()
  const due = dueConcepts(learning, now)
  const levels = voiceLevels(learning)
  return (
    <div className="mp-board">
      <div className="mp-actions">
        <button className="primary" disabled={!due.length} onClick={() => onStart({ kind: 'review' })}>
          Review due ({due.length})
        </button>
        <button className="secondary" onClick={() => onStart({ kind: 'weakest' })}>
          Train weakest
        </button>
        <span className="small">Or pick a card to drill one idea.</span>
      </div>
      <div className="mp-voices">
        {VOICE_ORDER.map((v) => (
          <section key={v} className="mp-voice" style={{ ['--voice' as string]: VOICES[v].color }}>
            <header>
              <h3>{VOICES[v].name}</h3>
              <span className="small">{VOICES[v].title}</span>
              <span className="mp-vlevel">Level {levels[v]}</span>
            </header>
            {CONCEPTS.filter((c) => c.voice === v).map((c) => {
              const m = learning[c.id]
              const open = isUnlocked(c.id, learning)
              const status = !open
                ? `Needs ${c.prereqs.filter((p) => level(learning[p]) < 1).map((p) => concept(p).name).join(', ')}`
                : !m || m.attempts === 0
                  ? 'New'
                  : isDue(m, now)
                    ? 'Due now'
                    : `Review in ${untilLabel(m.dueAt - now)}`
              return (
                <button
                  key={c.id}
                  className={`mp-card ${open ? '' : 'locked'} ${open && isDue(m, now) ? 'due' : ''}`}
                  disabled={!open}
                  onClick={() => onStart({ kind: 'drill', concept: c.id })}
                  title={c.blurb}
                >
                  <span className="mp-name">{c.name}</span>
                  <Stars n={level(m)} />
                  <span className="mp-status">{status}</span>
                  <span className="mp-blurb">{c.blurb}</span>
                </button>
              )
            })}
          </section>
        ))}
      </div>
    </div>
  )
}

type Result = { problem: Problem; correct: boolean; hinted: boolean; delta: number; given: string }

function Session({ problems, title, onDone }: { problems: Problem[]; title: string; onDone(results: Result[]): void }) {
  const learning = useWorld((s) => s.game?.learning ?? NO_LEARNING)
  const recordAnswer = useWorld((s) => s.recordAnswer)
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [hinted, setHinted] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const p = problems[index]
  palaceDebug.current = p
  const voice = concept(p.concept).voice
  const hint = useMemo(() => (hinted ? hintFor(p, learning) : null), [hinted, p, learning])

  useEffect(() => {
    inputRef.current?.focus()
  }, [index])

  const submit = (given: string) => {
    if (result || !given.trim()) return
    const correct = isCorrect(p, given)
    const delta = recordAnswer(p.concept, p.difficulty, correct, hinted)
    const r = { problem: p, correct, hinted, delta, given }
    setResult(r)
    setResults((all) => [...all, r])
  }
  const next = () => {
    if (index + 1 >= problems.length) return onDone(results)
    setIndex(index + 1)
    setInput('')
    setHinted(false)
    setResult(null)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement
      if (e.key === 'Enter') {
        e.preventDefault()
        if (result) next()
        else submit(input)
      } else if (!result && (e.key === 'h' || e.key === 'H') && (!typing || p.kind === 'number')) {
        e.preventDefault()
        setHinted(true)
      } else if (!result && p.kind === 'choice') {
        const k = e.key.toUpperCase()
        const idx = LETTERS.indexOf(k) >= 0 ? LETTERS.indexOf(k) : Number(k) - 1
        if (idx >= 0 && idx < (p.choices?.length ?? 0)) submit(LETTERS[idx])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="mp-session" style={{ ['--voice' as string]: VOICES[voice].color }}>
      <div className="mp-progress">
        <span>{title}</span>
        <span>
          {index + 1} / {problems.length}
        </span>
        <div className="mp-bar">
          <div style={{ width: `${((index + (result ? 1 : 0)) / problems.length) * 100}%` }} />
        </div>
      </div>
      <div className="mp-problem">
        <div className="mp-tag">
          {concept(p.concept).name} · {VOICES[voice].name} · difficulty {'●'.repeat(p.difficulty)}
          <span className="dim">{'●'.repeat(5 - p.difficulty)}</span>
        </div>
        <p className="mp-prompt">{p.prompt}</p>
        {p.kind === 'choice' ? (
          <div className="mp-choices">
            {p.choices!.map((c, i) => (
              <button
                key={c}
                className={`mp-choice ${result && i === p.answer ? 'right' : ''} ${result && !result.correct && LETTERS[i] === result.given ? 'wrong' : ''}`}
                disabled={!!result}
                onClick={() => submit(LETTERS[i])}
              >
                <kbd>{LETTERS[i]}</kbd> {c}
              </button>
            ))}
          </div>
        ) : (
          <div className="mp-answer">
            <input
              id="mp-input"
              ref={inputRef}
              value={input}
              disabled={!!result}
              onChange={(e) => setInput(e.target.value)}
              placeholder={p.unit === 'money' ? 'e.g. 1.25 or $1.25' : p.unit === 'percent' ? 'e.g. 12.5%' : 'your answer'}
              autoComplete="off"
              aria-label="Your answer"
            />
            <button className="primary" disabled={!!result} onClick={() => submit(input)}>
              Answer <kbd>Enter</kbd>
            </button>
          </div>
        )}
        {!result && (
          <button className="mp-hint-btn" onClick={() => setHinted(true)} disabled={hinted}>
            {hinted ? 'Hint used (half credit)' : <>Ask {VOICES[voice].name} <kbd>H</kbd></>}
          </button>
        )}
        {hint && (
          <div className="mp-hint">
            <b>{VOICES[hint.voice].name}:</b>
            {hint.lines.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
        )}
        {result && (
          <div className={`mp-feedback ${result.correct ? 'ok' : 'bad'}`}>
            <div className="mp-verdict">
              {result.correct ? '✔ Correct' : '✘ Not quite'}
              <span className="mp-delta">
                {result.delta >= 0 ? '+' : ''}
                {result.delta} rating
              </span>
            </div>
            {!result.correct && <p className="mp-right">Answer: {formatAnswer(p)}</p>}
            <ol className="mp-worked">
              {p.worked.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ol>
            <p className="mp-voice-line">
              <b>{VOICES[voice].name}:</b> {voiceLine(voice, result.correct, p.seed)}
            </p>
            <button className="primary" onClick={next} autoFocus>
              {index + 1 >= problems.length ? 'Finish' : 'Next'} <kbd>Enter</kbd>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Summary({ results, onBack }: { results: Result[]; onBack(): void }) {
  const learning = useWorld((s) => s.game?.learning ?? NO_LEARNING)
  const right = results.filter((r) => r.correct).length
  const byConcept = new Map<ConceptId, number>()
  for (const r of results) byConcept.set(r.problem.concept, (byConcept.get(r.problem.concept) ?? 0) + r.delta)
  const nextDue = Math.min(...[...byConcept.keys()].map((id) => learning[id]?.dueAt ?? Infinity))
  return (
    <div className="mp-summary">
      <h3>
        {right} of {results.length} right
      </h3>
      <ul>
        {[...byConcept].map(([id, delta]) => (
          <li key={id}>
            <span>{concept(id).name}</span>
            <Stars n={level(learning[id])} />
            <span className={delta >= 0 ? 'up' : 'down'}>
              {delta >= 0 ? '+' : ''}
              {delta}
            </span>
          </li>
        ))}
      </ul>
      {Number.isFinite(nextDue) && <p className="small">Next review: in {untilLabel(Math.max(0, nextDue - Date.now()))}. Coming back then is what makes it stick.</p>}
      <button className="primary" onClick={onBack} autoFocus>
        Back to the board
      </button>
    </div>
  )
}

export function MindPalace() {
  const phase = useGame((s) => s.phase)
  const setPhase = useGame((s) => s.setPhase)
  const request = usePalace((s) => s.request)
  const learning = useWorld((s) => s.game?.learning ?? NO_LEARNING)
  const [view, setView] = useState<{ kind: 'board' } | { kind: 'session'; problems: Problem[]; title: string; fromRequest: boolean } | { kind: 'summary'; results: Result[]; fromRequest: boolean }>({ kind: 'board' })

  // Opening the palace starts wherever the request says.
  useEffect(() => {
    if (phase !== 'palace') {
      palaceDebug.current = null
      return
    }
    const g = useWorld.getState().game
    if (!g) return
    if (request.kind === 'problems') setView({ kind: 'session', problems: request.problems, title: request.title, fromRequest: true })
    else if (request.kind === 'session') startSession(request.mode, g.learning, true)
    else setView({ kind: 'board' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, request])

  function startSession(mode: SessionMode, l: Learning, fromRequest = false) {
    const plan = planSession(mode, l, Date.now())
    const problems = buildProblems(plan, l, Date.now() >>> 0)
    const title = mode.kind === 'review' ? 'Review' : mode.kind === 'weakest' ? 'Training' : `Drill: ${concept(mode.concept).name}`
    setView({ kind: 'session', problems, title, fromRequest })
  }

  if (phase !== 'palace') return null
  const close = () => setPhase('playing')
  return (
    <div className="overlay panel-overlay">
      <div className="mind-palace" role="dialog" aria-label="Mind Palace">
        <header className="mp-head">
          <div>
            <div className="eyebrow">Your office · 2nd floor</div>
            <h2>The Mind Palace</h2>
          </div>
          <span className="small">Time stands still in here.</span>
          <button className="secondary mp-close" onClick={close}>
            Back to the street <kbd>Esc</kbd>
          </button>
        </header>
        {view.kind === 'board' && <Board learning={learning} onStart={(m) => startSession(m, learning)} />}
        {view.kind === 'session' && (
          <Session
            key={view.problems.map((p) => p.seed).join()}
            problems={view.problems}
            title={view.title}
            onDone={(results) => setView({ kind: 'summary', results, fromRequest: view.fromRequest })}
          />
        )}
        {view.kind === 'summary' && <Summary results={view.results} onBack={() => (view.fromRequest && request.kind === 'problems' ? close() : setView({ kind: 'board' }))} />}
      </div>
    </div>
  )
}

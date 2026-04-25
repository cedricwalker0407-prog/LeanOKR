import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Anthropic from '@anthropic-ai/sdk'

const TOTAL_STEPS = 5

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

function AiButton({ onClick, loading, disabled, children, loadingLabel }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl text-sm font-medium transition-all cursor-pointer disabled:cursor-default"
    >
      {loading ? <><Spinner />{loadingLabel}</> : children}
    </button>
  )
}

export default function Builder() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  const [focus, setFocus] = useState('')

  const [objective, setObjective] = useState('')
  const [aiObjective, setAiObjective] = useState('')
  const [aiObjectiveLoading, setAiObjectiveLoading] = useState(false)
  const [aiObjectiveError, setAiObjectiveError] = useState('')

  const [keyResults, setKeyResults] = useState(['', '', ''])
  const [aiKRFeedback, setAiKRFeedback] = useState('')
  const [aiKRLoading, setAiKRLoading] = useState(false)
  const [aiKRError, setAiKRError] = useState('')

  const [dailyAction, setDailyAction] = useState('')
  const [dailyPerson, setDailyPerson] = useState('')
  const [dailyDeadline, setDailyDeadline] = useState('')

  const [copied, setCopied] = useState(false)

  const canProceed = () => {
    switch (step) {
      case 1: return focus.trim().length > 0
      case 2: return objective.trim().length > 0
      case 3: return keyResults[0].trim().length > 0 && keyResults[1].trim().length > 0
      case 4: return dailyAction.trim() && dailyPerson.trim() && dailyDeadline.trim()
      default: return true
    }
  }

  const getClient = () =>
    new Anthropic({ apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY, dangerouslyAllowBrowser: true })

  const improveObjective = async () => {
    setAiObjectiveLoading(true)
    setAiObjectiveError('')
    setAiObjective('')
    try {
      const msg = await getClient().messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: `Du bist OKR-Experte. Der Nutzer hat folgendes Objective formuliert: "${objective}". Verbessere es zu einem klaren, inspirierenden Objective das einen erreichbaren Zustand beschreibt, keine Aktivität. Gib nur das verbesserte Objective zurück, keine Erklärung.`,
        }],
      })
      setAiObjective(msg.content[0].text.trim())
    } catch {
      setAiObjectiveError('KI-Anfrage fehlgeschlagen. Prüfe deinen API-Key in der .env-Datei.')
    } finally {
      setAiObjectiveLoading(false)
    }
  }

  const checkKeyResults = async () => {
    setAiKRLoading(true)
    setAiKRError('')
    setAiKRFeedback('')
    try {
      const krList = keyResults
        .map((kr, i) => kr.trim() ? `KR${i + 1}: ${kr}` : null)
        .filter(Boolean)
        .join('\n')
      const msg = await getClient().messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `Du bist OKR-Experte. Prüfe diese Key Results:\n${krList}\n\nSind sie messbar und konkret? Gib für jeden KR entweder 'gut' oder einen konkreten Verbesserungsvorschlag zurück. Antworte als kurze Liste.`,
        }],
      })
      setAiKRFeedback(msg.content[0].text.trim())
    } catch {
      setAiKRError('KI-Anfrage fehlgeschlagen. Prüfe deinen API-Key in der .env-Datei.')
    } finally {
      setAiKRLoading(false)
    }
  }

  const updateKR = (index, value) =>
    setKeyResults(prev => { const next = [...prev]; next[index] = value; return next })

  const copyToClipboard = async () => {
    const lines = [
      `OKR – ${new Date().toLocaleDateString('de-DE')}`,
      '',
      'OBJECTIVE',
      objective,
      '',
      'KEY RESULTS',
      ...keyResults.filter(kr => kr.trim()).map((kr, i) => `${i + 1}. ${kr}`),
      '',
      'ALLTAGSANKER',
      `Aktion: ${dailyAction}`,
      `Verantwortlich: ${dailyPerson}`,
      `Bis: ${dailyDeadline}`,
    ]
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const saveAndNavigate = () => {
    localStorage.setItem('lean-okr-current', JSON.stringify({
      createdAt: new Date().toISOString(),
      focus,
      objective,
      keyResults: keyResults.filter(kr => kr.trim()),
      dailyAnchor: { action: dailyAction, person: dailyPerson, deadline: dailyDeadline },
    }))
    navigate('/monitor')
  }

  const reset = () => {
    setStep(1); setFocus(''); setObjective(''); setAiObjective(''); setAiObjectiveError('')
    setKeyResults(['', '', '']); setAiKRFeedback(''); setAiKRError('')
    setDailyAction(''); setDailyPerson(''); setDailyDeadline(''); setCopied(false)
  }

  const inputClass = 'w-full bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-3 text-white placeholder-gray-600 transition-colors'

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Startseite
        </button>
        <span className="text-white font-semibold text-sm">OKR-Builder</span>
        <span className="text-gray-500 text-sm">Schritt {step} von {TOTAL_STEPS}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-0.5 bg-gray-800 shrink-0">
        <div className="h-0.5 bg-indigo-500 transition-all duration-500" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 overflow-y-auto">
        <div className="max-w-2xl w-full">

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div>
              <div className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-4">
                Schritt 1 – Fokus setzen
              </div>
              <h2 className="text-3xl font-bold text-white mb-6 leading-snug">
                Was soll sich in eurer Abteilung in den nächsten 3 Monaten wirklich verändern – wenn ihr nur eine Sache nennen dürftet?
              </h2>
              <textarea
                value={focus}
                onChange={e => setFocus(e.target.value)}
                placeholder="Eure Antwort..."
                rows={4}
                className={`${inputClass} resize-none text-lg`}
              />
              <p className="mt-3 text-gray-500 text-sm leading-relaxed">
                Denkt an Wirkung, nicht an Aktivitäten. Nicht "wir führen X ein", sondern "wir erreichen Y".
              </p>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div>
              <div className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-4">
                Schritt 2 – Objective formulieren
              </div>
              <h2 className="text-3xl font-bold text-white mb-6 leading-snug">
                Formuliert euer Ziel als inspirierenden Satz. Es soll motivieren, nicht verwalten.
              </h2>
              <textarea
                value={objective}
                onChange={e => setObjective(e.target.value)}
                placeholder="Unser Objective..."
                rows={4}
                className={`${inputClass} resize-none text-lg`}
              />
              <p className="mt-3 text-gray-500 text-sm leading-relaxed">
                Ein gutes Objective klingt ehrgeizig aber erreichbar. Beispiel: "Wir werden zur ersten Anlaufstelle für unsere Kunden bei Frage X."
              </p>

              <AiButton
                onClick={improveObjective}
                loading={aiObjectiveLoading}
                disabled={!objective.trim()}
                loadingLabel="KI arbeitet..."
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Mit KI verbessern
              </AiButton>

              {aiObjectiveError && <p className="mt-3 text-red-400 text-sm">{aiObjectiveError}</p>}

              {aiObjective && (
                <div className="mt-4 bg-indigo-950 border border-indigo-700 rounded-xl p-4">
                  <div className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-2">KI-Vorschlag</div>
                  <p className="text-white text-base leading-relaxed mb-3">{aiObjective}</p>
                  <button
                    onClick={() => { setObjective(aiObjective); setAiObjective('') }}
                    className="text-sm text-indigo-300 hover:text-white font-medium transition-colors cursor-pointer"
                  >
                    Vorschlag übernehmen →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <div>
              <div className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-4">
                Schritt 3 – Key Results definieren
              </div>
              <h2 className="text-3xl font-bold text-white mb-6 leading-snug">
                Woran würdet ihr konkret merken, dass ihr das Ziel erreicht habt? Was könnt ihr messen oder beobachten?
              </h2>
              <div className="space-y-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-indigo-400 font-semibold text-sm w-8 shrink-0">KR {i + 1}</span>
                    <input
                      type="text"
                      value={keyResults[i]}
                      onChange={e => updateKR(i, e.target.value)}
                      placeholder={i === 2 ? 'Optionales drittes Key Result...' : `Key Result ${i + 1}...`}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                Key Results sind Messgrössen, keine Aufgaben. Nicht "wir machen X", sondern "X steigt von A auf B".
              </p>

              <AiButton
                onClick={checkKeyResults}
                loading={aiKRLoading}
                disabled={!keyResults[0].trim()}
                loadingLabel="KI prüft..."
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mit KI prüfen
              </AiButton>

              {aiKRError && <p className="mt-3 text-red-400 text-sm">{aiKRError}</p>}

              {aiKRFeedback && (
                <div className="mt-4 bg-gray-900 border border-gray-700 rounded-xl p-4">
                  <div className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">KI-Feedback</div>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{aiKRFeedback}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4 ── */}
          {step === 4 && (
            <div>
              <div className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-4">
                Schritt 4 – Alltagsanker
              </div>
              <h2 className="text-3xl font-bold text-white mb-6 leading-snug">
                Was bedeutet dieses OKR konkret für diese Woche?
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Konkrete Aktion</label>
                  <input
                    type="text"
                    value={dailyAction}
                    onChange={e => setDailyAction(e.target.value)}
                    placeholder="Was wird diese Woche konkret getan?"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Verantwortliche Person</label>
                  <input
                    type="text"
                    value={dailyPerson}
                    onChange={e => setDailyPerson(e.target.value)}
                    placeholder="Wer ist dafür verantwortlich?"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Bis wann</label>
                  <input
                    type="text"
                    value={dailyDeadline}
                    onChange={e => setDailyDeadline(e.target.value)}
                    placeholder="z.B. Freitag, 25. April"
                    className={inputClass}
                  />
                </div>
              </div>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                Ohne diesen Schritt bleibt OKR abstrakt. Eine Aktion, eine Person, ein Datum.
              </p>
            </div>
          )}

          {/* ── Step 5 – Summary ── */}
          {step === 5 && (
            <div>
              <div className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-4">
                Schritt 5 – Zusammenfassung
              </div>
              <h2 className="text-3xl font-bold text-white mb-8 leading-snug">
                Euer OKR auf einen Blick
              </h2>

              <div className="space-y-4 mb-8">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-2">Objective</div>
                  <p className="text-white text-base leading-relaxed">{objective}</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">Key Results</div>
                  <div className="space-y-2.5">
                    {keyResults.filter(kr => kr.trim()).map((kr, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-indigo-400 font-semibold text-sm shrink-0 mt-0.5">KR {i + 1}</span>
                        <p className="text-gray-300 text-sm leading-relaxed">{kr}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">Alltagsanker</div>
                  <div className="space-y-1.5">
                    <p className="text-sm"><span className="text-gray-500">Aktion:</span> <span className="text-gray-300">{dailyAction}</span></p>
                    <p className="text-sm"><span className="text-gray-500">Verantwortlich:</span> <span className="text-gray-300">{dailyPerson}</span></p>
                    <p className="text-sm"><span className="text-gray-500">Bis:</span> <span className="text-gray-300">{dailyDeadline}</span></p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Kopiert!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Als Text kopieren
                    </>
                  )}
                </button>

                <button
                  onClick={saveAndNavigate}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Zum Zielemonitor
                </button>

                <button
                  onClick={reset}
                  className="flex items-center justify-center gap-2 px-5 py-3 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Neu starten
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Navigation footer */}
      {step < 5 && (
        <div className="border-t border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 px-5 py-2.5 text-gray-400 hover:text-white disabled:text-gray-700 text-sm font-medium transition-colors cursor-pointer disabled:cursor-default"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Zurück
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 === step ? 'w-6 bg-indigo-500' : i + 1 < step ? 'w-1.5 bg-indigo-700' : 'w-1.5 bg-gray-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl text-sm font-medium transition-all cursor-pointer disabled:cursor-default"
          >
            Weiter
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-3">
          <span className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">
            Focus. Align. Deliver.
          </span>
        </div>

        <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
          Lean <span className="text-indigo-400">OKR</span>
        </h1>

        <p className="text-gray-400 text-lg mb-12 leading-relaxed">
          Definiere klare Ziele, messe deinen Fortschritt und halte dein Team auf Kurs – einfach, fokussiert, wirkungsvoll.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/builder')}
            className="group relative flex flex-col items-start p-6 bg-indigo-600 hover:bg-indigo-500 rounded-2xl transition-all duration-200 text-left cursor-pointer"
          >
            <div className="w-10 h-10 bg-indigo-500 group-hover:bg-indigo-400 rounded-xl flex items-center justify-center mb-4 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-semibold mb-1">OKR-Builder</h2>
            <p className="text-indigo-200 text-sm">Erstelle neue Ziele Schritt für Schritt mit KI-Unterstützung.</p>
            <svg className="absolute bottom-5 right-5 w-5 h-5 text-indigo-300 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => navigate('/monitor')}
            className="group relative flex flex-col items-start p-6 bg-gray-800 hover:bg-gray-700 rounded-2xl transition-all duration-200 text-left cursor-pointer"
          >
            <div className="w-10 h-10 bg-gray-700 group-hover:bg-gray-600 rounded-xl flex items-center justify-center mb-4 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-semibold mb-1">Zielemonitor</h2>
            <p className="text-gray-400 text-sm">Verfolge den Fortschritt deiner OKRs auf einen Blick.</p>
            <svg className="absolute bottom-5 right-5 w-5 h-5 text-gray-500 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

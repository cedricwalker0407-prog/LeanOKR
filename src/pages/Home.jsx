import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const HOME_CSS = `
  .okr-home {
    min-height:100vh;background:var(--color-background,#0a0a0a);color:#fff;
    font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;
    font-feature-settings:"ss01","cv11";overflow-x:hidden;position:relative;
  }

  .okr-home .bg-grid {
    position:fixed;inset:0;z-index:0;pointer-events:none;
    background-image:
      linear-gradient(to right,rgba(255,255,255,0.025) 1px,transparent 1px),
      linear-gradient(to bottom,rgba(255,255,255,0.025) 1px,transparent 1px);
    background-size:80px 80px;
    mask-image:radial-gradient(ellipse 1100px 700px at 50% 45%,#000 30%,transparent 80%);
    -webkit-mask-image:radial-gradient(ellipse 1100px 700px at 50% 45%,#000 30%,transparent 80%);
  }
  .okr-home .bg-glow {
    position:fixed;inset:0;z-index:0;pointer-events:none;
    background:
      radial-gradient(ellipse 800px 500px at 30% 115%,rgba(10,84,115,0.28),transparent 60%),
      radial-gradient(ellipse 700px 450px at 85% 0%,rgba(243,146,0,0.08),transparent 60%);
  }

  .okr-home .topbar {
    position:relative;z-index:2;
    display:flex;align-items:center;justify-content:space-between;
    padding:28px 48px;
  }
  .okr-home .brand {
    display:flex;align-items:center;gap:12px;
    font-weight:600;letter-spacing:-0.01em;font-size:15px;
  }
  .okr-home .brand-mark {
    width:22px;height:22px;position:relative;
    display:flex;align-items:center;justify-content:center;
  }
  .okr-home .brand-mark::before {
    content:"";position:absolute;inset:0;border:1.5px solid var(--color-secondary,#0E6E95);border-radius:50%;opacity:0.75;
  }
  .okr-home .brand-mark::after {
    content:"";width:7px;height:7px;background:var(--color-accent,#F39200);border-radius:50%;
    box-shadow:0 0 12px var(--color-accent,#F39200);
  }
  .okr-home .hnav {
    display:flex;align-items:center;gap:32px;font-size:13px;
    color:rgba(255,255,255,0.62);letter-spacing:0.01em;
  }
  .okr-home .hnav a {
    color:inherit;text-decoration:none;transition:color .2s;
  }
  .okr-home .hnav a:hover { color:#fff; }
  .okr-home .pill {
    display:inline-flex;align-items:center;gap:8px;
    padding:8px 14px;border:1px solid rgba(255,255,255,0.14);border-radius:999px;
    font-family:'JetBrains Mono',monospace;font-size:11px;
    color:rgba(255,255,255,0.62);letter-spacing:0.04em;
  }
  .okr-home .pill .dot {
    width:6px;height:6px;border-radius:50%;
    background:var(--color-secondary,#0E6E95);box-shadow:0 0 10px var(--color-secondary,#0E6E95);
  }

  .okr-home main {
    position:relative;z-index:2;
    max-width:1280px;margin:0 auto;
    padding:48px 48px 80px;
  }

  .okr-home .eyebrow {
    display:inline-flex;align-items:center;gap:10px;
    font-family:'JetBrains Mono',monospace;font-size:11px;
    color:var(--color-accent,#F39200);letter-spacing:0.18em;text-transform:uppercase;
    padding:6px 12px;border:1px solid rgba(14,110,149,0.45);border-radius:999px;
    background:rgba(10,84,115,0.22);margin-bottom:28px;
  }
  .okr-home .eyebrow .tick {
    width:5px;height:5px;background:var(--color-accent,#F39200);border-radius:50%;box-shadow:0 0 10px var(--color-accent,#F39200);
  }

  .okr-home h1 {
    font-size:clamp(64px,9vw,128px);line-height:0.92;
    letter-spacing:-0.045em;font-weight:500;margin-bottom:24px;
  }
  .okr-home h1 .italic { font-style:italic;font-weight:300;color:var(--color-accent,#F39200); }
  .okr-home h1 .small {
    display:block;font-size:0.42em;font-weight:400;
    color:rgba(255,255,255,0.62);letter-spacing:-0.02em;
    margin-top:16px;font-style:italic;
  }

  .okr-home .sub {
    font-size:20px;color:rgba(255,255,255,0.62);max-width:520px;
    line-height:1.5;letter-spacing:-0.005em;margin-bottom:72px;
  }
  .okr-home .sub strong { color:#fff;font-weight:500; }

  /* Cards */
  .okr-home .cards {
    display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:72px;
  }

  .okr-home .card {
    position:relative;padding:40px;
    border:1px solid rgba(255,255,255,0.14);border-radius:20px;
    background:linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0));
    cursor:pointer;
    transition:transform .4s cubic-bezier(.2,.7,.2,1),border-color .3s,background .3s,box-shadow .4s;
    overflow:hidden;min-height:420px;
    display:flex;flex-direction:column;
    text-align:left;color:#fff;
    font-family:inherit;outline:none;
  }
  .okr-home .card::before {
    content:"";position:absolute;inset:-1px;border-radius:inherit;pointer-events:none;
    background:radial-gradient(400px 200px at var(--mx,50%) var(--my,0%),var(--accent-20,rgba(243,146,0,0.20)),transparent 60%);
    opacity:0;transition:opacity .4s;
  }
  .okr-home .card::after {
    content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
    border:1px solid transparent;transition:border-color .3s;
  }
  .okr-home .card:hover {
    transform:translateY(-4px);
    background:linear-gradient(180deg,var(--accent-04,rgba(243,146,0,0.04)),rgba(255,255,255,0));
    box-shadow:0 0 0 1px var(--accent-35,rgba(243,146,0,0.35)),0 30px 80px -30px var(--accent-45,rgba(243,146,0,0.45)),0 0 120px -20px var(--accent-25,rgba(243,146,0,0.25));
    border-color:transparent;
  }
  .okr-home .card:hover::before { opacity:1; }
  .okr-home .card:hover::after { border-color:var(--accent-35,rgba(243,146,0,0.35)); }

  .okr-home .card-head {
    display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:40px;
  }
  .okr-home .card-num {
    font-family:'JetBrains Mono',monospace;font-size:11px;
    color:rgba(255,255,255,0.38);letter-spacing:0.12em;
  }
  .okr-home .card:hover .card-num { color:var(--color-accent,#F39200); }
  .okr-home .card-arrow {
    width:44px;height:44px;border-radius:50%;
    border:1px solid rgba(255,255,255,0.14);
    display:flex;align-items:center;justify-content:center;
    transition:all .3s;color:rgba(255,255,255,0.62);flex-shrink:0;
  }
  .okr-home .card:hover .card-arrow {
    border-color:var(--color-accent,#F39200);background:var(--color-accent,#F39200);color:#0a0a0a;transform:rotate(-45deg);
  }

  .okr-home .card-visual {
    flex:1;margin:0 -40px 36px;position:relative;
    min-height:160px;display:flex;align-items:center;justify-content:center;overflow:hidden;
  }

  /* Builder visual */
  .okr-home .builder-vis {
    width:100%;padding:0 40px;display:flex;flex-direction:column;gap:10px;
  }
  .okr-home .q {
    display:flex;align-items:center;gap:14px;
    padding:14px 18px;border:1px solid rgba(255,255,255,0.08);border-radius:10px;
    background:rgba(255,255,255,0.015);font-size:13px;color:rgba(255,255,255,0.62);
    transition:all .4s;
  }
  .okr-home .q .idx {
    font-family:'JetBrains Mono',monospace;font-size:10px;
    color:rgba(255,255,255,0.38);min-width:22px;
  }
  .okr-home .q .bar {
    flex:1;height:2px;background:rgba(255,255,255,0.08);border-radius:2px;position:relative;overflow:hidden;
  }
  .okr-home .q .bar i {
    position:absolute;left:0;top:0;height:100%;background:rgba(255,255,255,0.38);border-radius:2px;
  }
  .okr-home .q.done .bar i { width:100%;background:var(--color-secondary,#0E6E95); }
  .okr-home .q.done {
    color:#fff;border-color:var(--secondary-line,rgba(14,110,149,0.45));background:var(--secondary-bg,rgba(10,84,115,0.22));
  }
  .okr-home .q.done .idx { color:var(--color-secondary,#0E6E95); }
  .okr-home .q.active { border-color:rgba(255,255,255,0.14);color:#fff; }
  .okr-home .q.active .bar i { width:60%;background:#fff; }
  .okr-home .card:hover .q.active .bar i { background:var(--color-accent,#F39200);animation:okr-fill 1.4s ease-out forwards; }
  @keyframes okr-fill { from{width:60%} to{width:100%} }

  /* Orbit visual */
  .okr-home .orbit {
    position:relative;width:280px;height:280px;
  }
  .okr-home .orbit svg { width:100%;height:100%;overflow:visible; }
  .okr-home .ring { fill:none;stroke:rgba(255,255,255,0.08);stroke-width:1; }
  .okr-home .ring.active { stroke:var(--secondary-line,rgba(14,110,149,0.45)); }
  .okr-home .orbit-core {
    position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    width:48px;height:48px;border-radius:50%;
    background:radial-gradient(circle at 30% 30%,#ffc46a,var(--color-accent,#F39200) 55%,#7a4a06);
    box-shadow:0 0 40px var(--accent-55,rgba(243,146,0,0.55)),inset 0 0 20px rgba(255,255,255,0.2);
  }
  .okr-home .planet {
    position:absolute;width:10px;height:10px;border-radius:50%;
    background:#fff;top:50%;left:50%;margin:-5px;
    box-shadow:0 0 12px rgba(255,255,255,0.4);
  }
  .okr-home .planet.gold { background:var(--color-accent,#F39200);box-shadow:0 0 14px var(--color-accent,#F39200); }
  .okr-home .planet.teal { background:#0E6E95;box-shadow:0 0 14px #0E6E95; }
  .okr-home .planet.dim { background:#A6A6A6;opacity:0.6;box-shadow:none;width:8px;height:8px;margin:-4px; }
  .okr-home .orbit-rot,.okr-home .orbit-rot-rev {
    position:absolute;inset:0;transform-origin:center;
  }
  .okr-home .card:hover .orbit-rot { animation:okr-spin 24s linear infinite; }
  .okr-home .card:hover .orbit-rot-rev { animation:okr-spin 40s linear infinite reverse; }
  @keyframes okr-spin { to{transform:rotate(360deg)} }

  .okr-home .card h2 {
    font-size:32px;font-weight:500;letter-spacing:-0.025em;line-height:1.1;margin-bottom:12px;
  }
  .okr-home .card p {
    font-size:15px;color:rgba(255,255,255,0.62);line-height:1.5;letter-spacing:-0.005em;max-width:380px;
  }

  .okr-home .card-foot {
    display:flex;align-items:center;gap:14px;
    margin-top:28px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);
    font-family:'JetBrains Mono',monospace;font-size:11px;
    color:rgba(255,255,255,0.38);letter-spacing:0.06em;
  }
  .okr-home .card-foot .sep {
    width:3px;height:3px;border-radius:50%;background:currentColor;opacity:0.5;
  }

  /* Footer */
  .okr-home footer {
    position:relative;z-index:2;
    display:flex;justify-content:space-between;align-items:center;
    padding:28px 48px;border-top:1px solid rgba(255,255,255,0.08);
    font-family:'JetBrains Mono',monospace;font-size:11px;
    color:rgba(255,255,255,0.38);letter-spacing:0.08em;
  }
  .okr-home .kbd { display:inline-flex;align-items:center;gap:6px; }
  .okr-home .k {
    padding:3px 7px;border:1px solid rgba(255,255,255,0.14);border-radius:4px;
    color:rgba(255,255,255,0.62);
  }

  @media (max-width:860px) {
    .okr-home .cards { grid-template-columns:1fr; }
    .okr-home .topbar,.okr-home main,.okr-home footer { padding-left:24px;padding-right:24px; }
    .okr-home .hnav { display:none; }
    .okr-home main { padding-top:24px;padding-bottom:48px; }
    .okr-home .card { min-height:unset;padding:28px; }
    .okr-home .card-visual { margin:0 -28px 24px; }
    .okr-home .sub { margin-bottom:48px; }
  }

  /* ── Settings ── */
  .okr-home .home-settings-wrap { position:relative; }
  .okr-home .home-settings-panel {
    position:absolute;top:calc(100% + 12px);right:0;
    width:280px;max-height:480px;overflow-y:auto;
    padding:18px;border-radius:14px;
    background:linear-gradient(180deg,rgba(20,20,20,.97),rgba(12,12,12,.97));
    border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(18px);
    box-shadow:0 20px 60px -20px rgba(0,0,0,.7);
    opacity:0;transform:translateY(10px) scale(.96);pointer-events:none;
    transition:all .25s cubic-bezier(.2,.7,.2,1);z-index:100;
    scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent;
  }
  .okr-home .home-settings-panel.open { opacity:1;transform:translateY(0) scale(1);pointer-events:auto; }
  .okr-home .home-fab {
    display:inline-flex;align-items:center;justify-content:center;
    width:36px;height:36px;border-radius:10px;
    border:1px solid rgba(255,255,255,.14);background:transparent;
    color:rgba(255,255,255,.50);cursor:pointer;transition:all .2s;flex-shrink:0;
  }
  .okr-home .home-fab:hover,.okr-home .home-fab.open {
    color:var(--color-accent,#F39200);border-color:var(--color-accent,#F39200);
    background:var(--accent-08,rgba(243,146,0,.08));
  }
  .okr-home .home-fab svg { width:15px;height:15px;transition:transform .4s; }
  .okr-home .home-fab.open svg { transform:rotate(90deg); }
  .okr-home .h-color-row { display:flex;align-items:center;justify-content:space-between;padding:5px 0;font-size:12px;color:rgba(255,255,255,.6);gap:8px; }
  .okr-home .h-color-label { flex:1;min-width:0; }
  .okr-home .h-color-controls { display:flex;align-items:center;gap:6px;flex-shrink:0; }
  .okr-home .h-color-input { width:28px;height:22px;border-radius:5px;border:1px solid rgba(255,255,255,.2);cursor:pointer;padding:0;background:none;overflow:hidden; }
  .okr-home .h-color-input::-webkit-color-swatch-wrapper { padding:0; }
  .okr-home .h-color-input::-webkit-color-swatch { border:none;border-radius:3px; }
  .okr-home .h-hex-input { width:80px;padding:3px 7px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:5px;color:rgba(255,255,255,.7);font-family:'JetBrains Mono',monospace;font-size:11px;outline:none;letter-spacing:0.04em; }
  .okr-home .h-hex-input:focus { border-color:rgba(255,255,255,.3);color:#fff; }
  .okr-home .h-text-input { width:100%;padding:7px 10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.14);border-radius:6px;color:#fff;font-family:Inter,system-ui,sans-serif;font-size:13px;outline:none;box-sizing:border-box; }
  .okr-home .h-reset-btn { width:100%;padding:9px;margin-top:4px;border-radius:8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.14);color:rgba(255,255,255,.50);font-family:inherit;font-size:12px;cursor:pointer;transition:all .2s; }
  .okr-home .h-reset-btn:hover { background:rgba(255,255,255,.07);color:rgba(255,255,255,.8); }
`

const DEFAULT_HOME_SETTINGS = {
  accentColor:    '#F5A623',
  secondaryColor: '#4A90E2',
  bgColor:        '#0a0a0a',
  companyName:    '',
  logoDataUrl:    '',
}

function deriveHomeVars(aHex, sHex, bgHex) {
  const rgba = (h, a) => {
    const r = parseInt(h.slice(1,3),16), g = parseInt(h.slice(3,5),16), b = parseInt(h.slice(5,7),16)
    return `rgba(${r},${g},${b},${a})`
  }
  return {
    '--color-accent':    aHex,
    '--accent-04':       rgba(aHex,0.04),
    '--accent-08':       rgba(aHex,0.08),
    '--accent-20':       rgba(aHex,0.20),
    '--accent-25':       rgba(aHex,0.25),
    '--accent-35':       rgba(aHex,0.35),
    '--accent-45':       rgba(aHex,0.45),
    '--accent-55':       rgba(aHex,0.55),
    '--color-secondary': sHex,
    '--secondary-line':  rgba(sHex,0.45),
    '--secondary-bg':    rgba(sHex,0.22),
    '--color-background': bgHex,
  }
}

function HomeColorPicker({ label, value, onChange }) {
  const [hex, setHex] = useState(value)
  useEffect(() => { setHex(value) }, [value])
  function commit(raw) {
    const v = raw.trim()
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(v)
    else setHex(value)
  }
  return (
    <div className="h-color-row">
      <span className="h-color-label">{label}</span>
      <div className="h-color-controls">
        <input type="color" className="h-color-input" value={value}
          onChange={e => { onChange(e.target.value); setHex(e.target.value) }} />
        <input type="text" className="h-hex-input" value={hex}
          onChange={e => setHex(e.target.value)}
          onBlur={() => commit(hex)}
          onKeyDown={e => { if (e.key === 'Enter') { commit(hex); e.target.blur() } }}
          maxLength={7} />
      </div>
    </div>
  )
}

function GearIcoHome() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const card1Ref = useRef(null)
  const card2Ref = useRef(null)

  const [homeSettings, setHomeSettings] = useState(DEFAULT_HOME_SETTINGS)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    try {
      const s = localStorage.getItem('lean-okr-builder-settings')
      if (s) setHomeSettings(prev => ({ ...DEFAULT_HOME_SETTINGS, ...JSON.parse(s) }))
    } catch {}
  }, [])

  const updateHomeSetting = (patch) => {
    setHomeSettings(prev => {
      const next = { ...prev, ...patch }
      localStorage.setItem('lean-okr-builder-settings', JSON.stringify(next))
      return next
    })
  }

  const resetHomeSettings = () => {
    setHomeSettings(DEFAULT_HOME_SETTINGS)
    localStorage.setItem('lean-okr-builder-settings', JSON.stringify(DEFAULT_HOME_SETTINGS))
  }

  const validHex = (v, fb) => /^#[0-9A-Fa-f]{6}$/.test(v) ? v : fb
  const cssVars = deriveHomeVars(
    validHex(homeSettings.accentColor,    '#F5A623'),
    validHex(homeSettings.secondaryColor, '#4A90E2'),
    validHex(homeSettings.bgColor,        '#0a0a0a')
  )

  useEffect(() => {
    const cards = [card1Ref.current, card2Ref.current].filter(Boolean)
    const cleanups = cards.map(card => {
      const fn = e => {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%')
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%')
      }
      card.addEventListener('mousemove', fn)
      return () => card.removeEventListener('mousemove', fn)
    })

    const onKey = e => {
      if (e.key === '1') navigate('/builder')
      if (e.key === '2') navigate('/monitor')
    }
    window.addEventListener('keydown', onKey)

    return () => {
      cleanups.forEach(fn => fn())
      window.removeEventListener('keydown', onKey)
    }
  }, [navigate])

  const ArrowIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <path d="M7 17L17 7M17 7H8M17 7V16"/>
    </svg>
  )

  return (
    <div className="okr-home" style={cssVars} onClick={() => setSettingsOpen(false)}>
      <style>{HOME_CSS}</style>
      <div className="bg-grid" />
      <div className="bg-glow" />

      {/* Top bar */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" />
          <span>{homeSettings.companyName || 'Lean OKR'}</span>
        </div>
        <nav className="hnav">
          <a href="#">Methode</a>
          <a href="#">Workshops</a>
          <a href="#">Referenzen</a>
          <span className="pill"><span className="dot" />v2.4 · live</span>
        </nav>
      </header>

      {/* Main */}
      <main>
        <span className="eyebrow"><span className="tick" />Für Berater · Mittelstand · OKR</span>

        <h1>
          Lean <span className="italic">OKR</span>.
          <span className="small">Weniger Overhead. Mehr Wirkung.</span>
        </h1>

        <p className="sub">
          Zwei Werkzeuge, ein Ziel: <strong>klare Ziele</strong> für mittelständische Teams —
          vom ersten Workshop bis zum wöchentlichen Check-in.
        </p>

        <section className="cards">
          {/* Card 1: Builder */}
          <button ref={card1Ref} className="card" onClick={() => navigate('/builder')}>
            <div className="card-head">
              <span className="card-num">01 / WORKSHOP</span>
              <span className="card-arrow"><ArrowIcon /></span>
            </div>

            <div className="card-visual">
              <div className="builder-vis">
                <div className="q done">
                  <span className="idx">01</span>
                  <span>Was ist euer Nordstern?</span>
                  <span className="bar"><i /></span>
                </div>
                <div className="q done">
                  <span className="idx">02</span>
                  <span>Wer ist das Team?</span>
                  <span className="bar"><i /></span>
                </div>
                <div className="q active">
                  <span className="idx">03</span>
                  <span>Welches Ergebnis zählt?</span>
                  <span className="bar"><i /></span>
                </div>
                <div className="q">
                  <span className="idx">04</span>
                  <span>Wie messt ihr Fortschritt?</span>
                  <span className="bar"><i /></span>
                </div>
              </div>
            </div>

            <h2>OKR-Builder starten</h2>
            <p>Führe dein Team Schritt für Schritt zu klaren Zielen.</p>

            <div className="card-foot">
              <span>GEFÜHRTE FRAGELOOP</span>
              <span className="sep" />
              <span>~ 45 MIN</span>
              <span className="sep" />
              <span>TEAM · 3–12</span>
            </div>
          </button>

          {/* Card 2: Monitor */}
          <button ref={card2Ref} className="card" onClick={() => navigate('/monitor')}>
            <div className="card-head">
              <span className="card-num">02 / MEETING</span>
              <span className="card-arrow"><ArrowIcon /></span>
            </div>

            <div className="card-visual">
              <div className="orbit">
                <svg viewBox="-140 -140 280 280">
                  <circle className="ring" cx="0" cy="0" r="60" />
                  <circle className="ring active" cx="0" cy="0" r="95" />
                  <circle className="ring" cx="0" cy="0" r="130" />
                </svg>
                <div className="orbit-core" />
                <div className="orbit-rot">
                  <div className="planet gold" style={{ transform: 'translate(60px,0)' }} />
                  <div className="planet teal" style={{ transform: 'translate(-42px,42px)' }} />
                </div>
                <div className="orbit-rot-rev">
                  <div className="planet" style={{ transform: 'translate(67px,-67px)' }} />
                  <div className="planet gold" style={{ transform: 'translate(-95px,0)' }} />
                  <div className="planet dim" style={{ transform: 'translate(40px,86px)' }} />
                </div>
                <div className="orbit-rot">
                  <div className="planet dim" style={{ transform: 'translate(-120px,-50px)' }} />
                  <div className="planet teal" style={{ transform: 'translate(110px,70px)' }} />
                </div>
              </div>
            </div>

            <h2>Zielemonitor öffnen</h2>
            <p>Zeige den Fortschritt deiner OKRs in Echtzeit.</p>

            <div className="card-foot">
              <span>ORBITAL-SYSTEM</span>
              <span className="sep" />
              <span>LIVE-SYNC</span>
              <span className="sep" />
              <span>BEAMER-READY</span>
            </div>
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer>
        <span>© 2026 LEAN OKR · BUILT FOR CONSULTANTS</span>
        <span className="kbd">DRÜCKE <span className="k">1</span> ODER <span className="k">2</span> UM ZU STARTEN</span>
      </footer>

      {/* ── Settings Panel — fixed außerhalb ── */}
      <div
        style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}
        onClick={e => e.stopPropagation()}
      >
        {settingsOpen && (
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 12px)', right: 0,
            width: 300, maxHeight: '80vh', overflowY: 'auto',
            padding: 18, borderRadius: 14,
            background: 'linear-gradient(180deg,rgba(20,20,20,.98),rgba(12,12,12,.98))',
            border: '1px solid rgba(255,255,255,.14)',
            backdropFilter: 'blur(18px)',
            boxShadow: '0 20px 60px -20px rgba(0,0,0,.8)',
            fontFamily: 'Inter,system-ui,sans-serif',
          }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.16em', color: 'rgba(255,255,255,.38)', textTransform: 'uppercase', marginBottom: 16 }}>
              Einstellungen
            </div>

            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.16em', color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', marginBottom: 8 }}>
              Farben
            </div>
            <HomeColorPicker label="Akzentfarbe" value={homeSettings.accentColor}
              onChange={v => updateHomeSetting({ accentColor: v })} />
            <HomeColorPicker label="Sekundärfarbe" value={homeSettings.secondaryColor}
              onChange={v => updateHomeSetting({ secondaryColor: v })} />
            <HomeColorPicker label="Hintergrundfarbe" value={homeSettings.bgColor}
              onChange={v => updateHomeSetting({ bgColor: v })} />

            <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', margin: '12px 0' }} />

            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.16em', color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', marginBottom: 8 }}>
              Unternehmen
            </div>
            <div style={{ marginBottom: 4 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 5 }}>Name (ersetzt „Lean OKR")</label>
              <input
                type="text"
                className="h-text-input"
                value={homeSettings.companyName}
                placeholder="z.B. Acme GmbH"
                onChange={e => updateHomeSetting({ companyName: e.target.value })}
              />
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', margin: '12px 0' }} />
            <button className="h-reset-btn" onClick={resetHomeSettings}>
              Auf Standardwerte zurücksetzen
            </button>
          </div>
        )}
        <button
          className={`home-fab ${settingsOpen ? 'open' : ''}`}
          onClick={() => setSettingsOpen(o => !o)}
          title="Einstellungen"
        >
          <GearIcoHome />
        </button>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Data / Constants ─────────────────────────────────────────────────────────

const DEMO_OKR = {
  objective: 'Wir werden zur ersten Anlaufstelle für unsere Kunden',
  keyResults: [
    'Kundenzufriedenheit steigt von 72% auf 85%',
    'Reaktionszeit sinkt von 48h auf 24h',
    '10 von 12 Projekten laufen ohne Eskalation',
  ],
}

const PLANET_CONFIGS = [
  { radius: 240, speed:  0.018, phase: 0.2 },
  { radius: 360, speed: -0.012, phase: 2.6 },
  { radius: 470, speed:  0.008, phase: 4.4 },
]

const DEFAULT_PLANET_COLORS = ['#4A90E2', '#E85D75', '#7ED321']

const DEFAULT_SETTINGS = {
  companyName:  '',
  accentColor:  '#F39200',
  planetColors: ['#4A90E2', '#E85D75', '#7ED321'],
  fontColor:    '#ffffff',
  logoDataUrl:  '',
}

const MAX_DESIGN_RADIUS = 470
const RING_C = 2 * Math.PI * 54   // SVG ring: viewBox 120×120, r=54
const SUN_SIZE = 172

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(p) {
  return p > 66 ? '#7ED321' : p > 33 ? '#F5A623' : '#E85D75'
}
function statusLabel(p) {
  return p > 66 ? 'ON TRACK' : p > 33 ? 'AT RISK' : 'BEHIND'
}
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - y) / 86400000) + 1) / 7)
}
function quarterInfo(date) {
  const q = Math.floor(date.getMonth() / 3)
  const start = new Date(date.getFullYear(), q * 3, 1)
  const end   = new Date(date.getFullYear(), q * 3 + 3, 0)
  const day   = Math.ceil((date - start) / 86400000) + 1
  const total = Math.ceil((end   - start) / 86400000) + 1
  return { day, total, q: q + 1 }
}
function deriveColors(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lv = (v, f) => Math.min(255, Math.round(v + (255 - v) * f))
  const dv = (v, f) => Math.round(v * (1 - f))
  const toH = (rv, gv, bv) => '#' + [rv, gv, bv].map(v => v.toString(16).padStart(2, '0')).join('')
  return {
    base: hex,
    hi:   toH(lv(r, .45), lv(g, .45), lv(b, .45)),
    sh:   toH(dv(r, .6),  dv(g, .6),  dv(b, .6)),
    glow: `rgba(${r},${g},${b},0.45)`,
  }
}

// ─── Injected CSS ─────────────────────────────────────────────────────────────

const MONITOR_CSS = `
  @keyframes okrSunBreath {
    0%,100% { box-shadow: 0 0 40px rgba(243,146,0,.55), 0 0 110px rgba(243,146,0,.40), 0 0 220px rgba(243,146,0,.22), inset -10px -14px 40px rgba(100,40,0,.35), inset 6px 8px 30px rgba(255,255,255,.15); }
    50%      { box-shadow: 0 0 50px rgba(243,146,0,.65), 0 0 140px rgba(243,146,0,.48), 0 0 260px rgba(243,146,0,.28), inset -10px -14px 40px rgba(100,40,0,.35), inset 6px 8px 30px rgba(255,255,255,.15); }
  }
  @keyframes okrCorona  { to { transform: rotate( 360deg); } }
  @keyframes okrCoronaR { to { transform: rotate(-360deg); } }
  @keyframes okrPulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }

  .okr-corona-1 {
    position:absolute;inset:-8px;border-radius:50%;
    border:1px solid rgba(243,146,0,.25);
    animation:okrCorona 18s linear infinite;
    pointer-events:none;
  }
  .okr-corona-2 {
    position:absolute;inset:-16px;border-radius:50%;
    border:1px dashed rgba(243,146,0,.15);
    animation:okrCoronaR 40s linear infinite;
    pointer-events:none;
  }

  .okr-planet-label {
    position:absolute;
    top:50%;left:calc(100% + 22px);
    transform:translateY(-50%);
    width:260px;padding:14px 16px;
    background:linear-gradient(180deg,rgba(20,20,20,.85),rgba(12,12,12,.85));
    border:1px solid rgba(255,255,255,.14);border-radius:12px;
    backdrop-filter:blur(10px);
    pointer-events:none;
    white-space:normal;
  }
  .okr-planet-label.flip {
    left:auto;right:calc(100% + 22px);
    text-align:right;
  }
  .okr-planet-label.flip .okr-kr-row { justify-content:flex-end; }
  .okr-planet-label.flip .okr-stat-row { flex-direction:row-reverse; }

  .okr-settings-panel {
    position:absolute;bottom:calc(100% + 12px);right:0;
    width:300px;
    max-height:min(600px,80vh);
    overflow-y:auto;
    padding:18px;border-radius:14px;
    background:linear-gradient(180deg,rgba(20,20,20,.96),rgba(12,12,12,.96));
    border:1px solid rgba(255,255,255,.14);
    backdrop-filter:blur(18px);
    box-shadow:0 20px 60px -20px rgba(0,0,0,.6);
    opacity:0;transform:translateY(10px) scale(.96);pointer-events:none;
    transition:all .25s cubic-bezier(.2,.7,.2,1);
    scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent;
  }
  .okr-settings-panel.open {
    opacity:1;transform:translateY(0) scale(1);pointer-events:auto;
  }

  .okr-sw-toggle {
    position:relative;width:32px;height:18px;border-radius:999px;
    background:rgba(255,255,255,.14);cursor:pointer;transition:background .2s;flex-shrink:0;
  }
  .okr-sw-toggle::after {
    content:"";position:absolute;top:2px;left:2px;
    width:14px;height:14px;border-radius:50%;background:#fff;transition:left .2s;
  }
  .okr-sw-toggle.on { background:var(--okr-gold,#F39200); }
  .okr-sw-toggle.on::after { left:16px; }

  .okr-fab:hover { color:#F39200!important;border-color:#F39200!important;background:rgba(243,146,0,.08)!important; }
  .okr-fab svg { transition:transform .4s; }
  .okr-fab.open svg { transform:rotate(90deg); }

  .okr-color-row {
    display:flex;align-items:center;justify-content:space-between;
    padding:5px 0;font-size:12px;color:rgba(255,255,255,.6);gap:8px;
  }
  .okr-color-row-label { flex:1;min-width:0; }
  .okr-color-controls { display:flex;align-items:center;gap:6px;flex-shrink:0; }
  .okr-color-input {
    width:28px;height:22px;border-radius:5px;
    border:1px solid rgba(255,255,255,.2);
    cursor:pointer;padding:0;background:none;overflow:hidden;flex-shrink:0;
  }
  .okr-color-input::-webkit-color-swatch-wrapper { padding:0; }
  .okr-color-input::-webkit-color-swatch { border:none;border-radius:3px; }
  .okr-hex-input {
    width:80px;padding:3px 7px;
    background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);
    border-radius:5px;color:rgba(255,255,255,.7);
    font-family:'JetBrains Mono',monospace;font-size:11px;
    outline:none;letter-spacing:0.04em;
  }
  .okr-hex-input:focus { border-color:rgba(255,255,255,.3);color:#fff; }
`

// ─── Sub-components ───────────────────────────────────────────────────────────

function Sun({ color, objective, avgProg, overallSl, mono, quarter, year }) {
  const gc = color || '#F39200'
  return (
    <div style={{ position: 'relative', width: SUN_SIZE, height: SUN_SIZE }}>
      {/* Sphere */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        background: `radial-gradient(circle at 32% 32%, #ffe2a6 0%, #ffc773 22%, ${gc} 55%, #c36a00 90%)`,
        boxShadow: `0 0 40px ${gc}8c, 0 0 110px ${gc}66, 0 0 220px ${gc}38, inset -10px -14px 40px rgba(100,40,0,.35), inset 6px 8px 30px rgba(255,255,255,.15)`,
        animation: 'okrSunBreath 6s ease-in-out infinite',
      }} />
      {/* Text overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px', textAlign: 'center', zIndex: 2, gap: 5,
      }}>
        <div style={{
          fontFamily: mono, fontSize: 7.5, letterSpacing: '0.18em',
          color: 'rgba(255,255,255,.72)', textTransform: 'uppercase',
          textShadow: '0 1px 3px rgba(0,0,0,.6)',
        }}>
          Q{quarter} · {year}
        </div>
        <div style={{
          fontSize: 10.5, fontWeight: 700, lineHeight: 1.3, color: '#fff',
          textShadow: '0 1px 4px rgba(0,0,0,.6)',
          overflow: 'hidden',
          display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
        }}>
          {objective}
        </div>
        <div style={{
          fontFamily: mono, fontSize: 7.5, color: 'rgba(255,255,255,.62)',
          letterSpacing: '0.08em', textShadow: '0 1px 3px rgba(0,0,0,.6)',
        }}>
          {avgProg}% · {overallSl}
        </div>
      </div>
      <div className="okr-corona-1" />
      <div className="okr-corona-2" />
    </div>
  )
}

function PlanetRing({ progress }) {
  const color = statusColor(progress)
  const offset = RING_C * (1 - progress / 100)
  return (
    <div style={{ position: 'absolute', inset: -14, pointerEvents: 'none' }}>
      <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="3" />
        <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dashoffset .6s ease, stroke .4s ease' }}
        />
      </svg>
    </div>
  )
}

function Planet({ config, progress, krText, index, isActive, planetRef, labelRef, onClick, onProgressChange }) {
  const sc = statusColor(progress)
  const sl = statusLabel(progress)
  return (
    <div
      ref={planetRef}
      style={{
        position: 'absolute', top: 0, left: 0,
        width: 78, height: 78,
        transform: 'translate(-50%,-50%)',
        cursor: 'pointer', zIndex: 15,
      }}
      onClick={onClick}
    >
      <div style={{
        width: 78, height: 78, borderRadius: '50%', position: 'relative',
        background: `radial-gradient(circle at 30% 28%, ${config.hi}, ${config.base} 55%, ${config.sh} 95%)`,
        boxShadow: `0 0 34px ${config.glow}, inset -4px -6px 14px rgba(0,0,0,.4)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <PlanetRing progress={progress} />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 15, fontWeight: 500, color: '#fff',
          letterSpacing: '-0.02em', textShadow: '0 1px 2px rgba(0,0,0,.5)',
          position: 'relative', zIndex: 1,
        }}>
          {progress}<i style={{ fontStyle: 'normal', fontSize: 9, color: 'rgba(255,255,255,.75)', marginLeft: 1, verticalAlign: 'top' }}>%</i>
        </span>
      </div>

      {isActive && (
        <div
          className="okr-planet-label"
          ref={labelRef}
          style={{ '--c': config.base, pointerEvents: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="okr-kr-row" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            color: config.base, letterSpacing: '0.14em', marginBottom: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.base, boxShadow: `0 0 8px ${config.base}`, flexShrink: 0 }} />
            KEY RESULT 0{index + 1}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.35, color: '#fff', marginBottom: 10 }}>
            {krText}
          </div>
          <input
            type="range" min="0" max="100" value={progress}
            onChange={e => onProgressChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: config.base, cursor: 'pointer', marginBottom: 6 }}
          />
          <div className="okr-stat-row" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            color: 'rgba(255,255,255,.38)', letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            <span>FORTSCHRITT · <b style={{ color: '#fff', fontWeight: 500 }}>{progress}%</b></span>
            <span style={{ color: sc, fontWeight: 500 }}>{sl}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function ColorPicker({ label, value, onChange }) {
  const [hex, setHex] = useState(value)
  useEffect(() => { setHex(value) }, [value])

  function commit(raw) {
    const v = raw.trim()
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(v)
    else setHex(value)
  }

  return (
    <div className="okr-color-row">
      <span className="okr-color-row-label">{label}</span>
      <div className="okr-color-controls">
        <input type="color" className="okr-color-input" value={value}
          onChange={e => { onChange(e.target.value); setHex(e.target.value) }} />
        <input type="text" className="okr-hex-input" value={hex}
          onChange={e => setHex(e.target.value)}
          onBlur={() => commit(hex)}
          onKeyDown={e => { if (e.key === 'Enter') { commit(hex); e.target.blur() } }}
          maxLength={7}
        />
      </div>
    </div>
  )
}

function SettingsPanel({ settings, open, onToggle, onChange, onReset, animRunning, onAnimToggle, starsOn, onStarsToggle }) {
  const mono = "'JetBrains Mono',monospace"
  const logoInputRef = useRef(null)

  function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onChange('logoDataUrl', ev.target.result)
    reader.readAsDataURL(file)
  }

  const inputStyle = {
    width: '100%', padding: '7px 10px',
    background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.14)',
    borderRadius: 6, color: '#fff', fontFamily: 'Inter,system-ui,sans-serif',
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
  }
  const sectionLabel = {
    fontFamily: mono, fontSize: 9, letterSpacing: '0.16em',
    color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', marginBottom: 8,
  }
  const divider = { borderTop: '1px solid rgba(255,255,255,.08)', margin: '12px 0' }

  return (
    <div style={{ position: 'fixed', bottom: 36, right: 36, zIndex: 60 }} onClick={e => e.stopPropagation()}>
      <div className={`okr-settings-panel ${open ? 'open' : ''}`}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.16em', color: 'rgba(255,255,255,.38)', textTransform: 'uppercase', marginBottom: 16 }}>
          Einstellungen
        </div>

        {/* ── Unternehmen ── */}
        <div style={sectionLabel}>Unternehmen</div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 5 }}>Name</label>
          <input type="text" value={settings.companyName} placeholder="z.B. Acme GmbH"
            onChange={e => onChange('companyName', e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 2 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 5 }}>Logo (PNG / JPG)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {settings.logoDataUrl && (
              <img src={settings.logoDataUrl} alt="Logo"
                style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6, background: 'rgba(255,255,255,.06)', flexShrink: 0 }} />
            )}
            <button onClick={() => logoInputRef.current?.click()} style={{
              flex: 1, padding: '6px 10px', fontSize: 12,
              background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.14)',
              borderRadius: 6, color: 'rgba(255,255,255,.6)', cursor: 'pointer',
            }}>
              {settings.logoDataUrl ? 'Ändern' : 'Hochladen'}
            </button>
            {settings.logoDataUrl && (
              <button onClick={() => onChange('logoDataUrl', '')} style={{
                padding: '6px 9px', fontSize: 12,
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.14)',
                borderRadius: 6, color: 'rgba(255,255,255,.38)', cursor: 'pointer',
              }}>✕</button>
            )}
            <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleLogoUpload} style={{ display: 'none' }} />
          </div>
        </div>

        <div style={divider} />

        {/* ── Farben ── */}
        <div style={sectionLabel}>Farben</div>
        <ColorPicker label="Akzentfarbe (Sonne)" value={settings.accentColor}
          onChange={v => onChange('accentColor', v)} />
        <ColorPicker label="Schriftfarbe" value={settings.fontColor}
          onChange={v => onChange('fontColor', v)} />

        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>Planetenfarben</div>
          {['Planet 1', 'Planet 2', 'Planet 3'].map((label, i) => (
            <ColorPicker key={i} label={label}
              value={settings.planetColors?.[i] || DEFAULT_PLANET_COLORS[i]}
              onChange={v => {
                const next = [...(settings.planetColors || DEFAULT_PLANET_COLORS)]
                next[i] = v
                onChange('planetColors', next)
              }} />
          ))}
        </div>

        <div style={divider} />

        {/* ── Anzeige ── */}
        <div style={sectionLabel}>Anzeige</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: 'rgba(255,255,255,.6)' }}>
          <span>Planeten-Animation</span>
          <div className={`okr-sw-toggle ${animRunning ? 'on' : ''}`} onClick={onAnimToggle} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: 'rgba(255,255,255,.6)' }}>
          <span>Sterne anzeigen</span>
          <div className={`okr-sw-toggle ${starsOn ? 'on' : ''}`} onClick={onStarsToggle} />
        </div>

        <div style={divider} />

        {/* ── Reset ── */}
        <button onClick={onReset} style={{
          width: '100%', padding: '8px 0', fontSize: 12,
          background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 8, color: 'rgba(255,255,255,.38)', cursor: 'pointer',
          fontFamily: 'inherit', letterSpacing: '0.04em',
        }}>
          Auf Standardwerte zurücksetzen
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className={`okr-fab ${open ? 'open' : ''}`}
          onClick={onToggle}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,.14)',
            background: 'rgba(255,255,255,.04)', backdropFilter: 'blur(10px)',
            color: 'rgba(255,255,255,.6)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Monitor() {
  const navigate = useNavigate()
  const today = new Date()
  const kw = isoWeek(today)
  const qi = quarterInfo(today)

  const [okrData,      setOkrData]      = useState(DEMO_OKR)
  const [isDemo,       setIsDemo]       = useState(true)
  const [progress,     setProgress]     = useState([0, 0, 0])
  const [selectedKR,   setSelectedKR]   = useState(null)
  const [settings,     setSettings]     = useState(DEFAULT_SETTINGS)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [animRunning,  setAnimRunning]  = useState(true)
  const [starsOn,      setStarsOn]      = useState(true)

  const animRunningRef = useRef(true)
  const starsFarRef    = useRef(null)
  const starsNearRef   = useRef(null)
  const systemRef      = useRef(null)
  const orbitSvgRef    = useRef(null)
  const planetDivRefs  = useRef([])
  const labelRefs      = useRef([])

  // ── Load localStorage ──────────────────────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem('lean-okr-current')
    const data = raw ? JSON.parse(raw) : null
    if (data?.keyResults?.length) {
      setOkrData(data)
      setIsDemo(false)
      const savedP = localStorage.getItem('lean-okr-progress')
      if (savedP) {
        const p = JSON.parse(savedP)
        setProgress(p.length === data.keyResults.length ? p : data.keyResults.map(() => 0))
      } else {
        setProgress(data.keyResults.map(() => 0))
      }
    }
    const savedS = localStorage.getItem('lean-okr-settings')
    if (savedS) {
      try {
        const s = JSON.parse(savedS)
        if (s.primaryColor && !s.accentColor) s.accentColor = s.primaryColor
        setSettings({ ...DEFAULT_SETTINGS, ...s })
      } catch {}
    }
  }, [])

  // ── Starfield canvases ─────────────────────────────────────────────────────
  useEffect(() => {
    function buildStars(canvasEl, count, { minR = 0.3, maxR = 1.2, twinkle = false } = {}) {
      const ctx = canvasEl.getContext('2d')
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      let stars = [], rafId

      function resize() {
        canvasEl.width  = window.innerWidth  * dpr
        canvasEl.height = window.innerHeight * dpr
        canvasEl.style.width  = window.innerWidth  + 'px'
        canvasEl.style.height = window.innerHeight + 'px'
        stars = Array.from({ length: count }, () => ({
          x:  Math.random() * canvasEl.width,
          y:  Math.random() * canvasEl.height,
          r:  (minR + Math.random() * (maxR - minR)) * dpr,
          a:  0.3  + Math.random() * 0.7,
          tw: Math.random() * Math.PI * 2,
        }))
      }

      function draw(t) {
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
        for (const s of stars) {
          const a = twinkle ? s.a * (0.6 + 0.4 * Math.sin(t * 0.0008 + s.tw)) : s.a
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,255,255,${a})`
          ctx.fill()
          if (s.r > 0.9 * dpr) {
            ctx.beginPath()
            ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255,255,255,${a * 0.08})`
            ctx.fill()
          }
        }
        rafId = requestAnimationFrame(draw)
      }

      resize()
      window.addEventListener('resize', resize)
      rafId = requestAnimationFrame(draw)
      return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize) }
    }

    if (!starsFarRef.current || !starsNearRef.current) return
    const c1 = buildStars(starsFarRef.current,  220, { minR: 0.2, maxR: 0.7 })
    const c2 = buildStars(starsNearRef.current,   90, { minR: 0.6, maxR: 1.4, twinkle: true })
    return () => { c1(); c2() }
  }, [])

  // ── Orbital rAF loop ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!okrData) return
    const system = systemRef.current
    const svg    = orbitSvgRef.current
    if (!system || !svg) return

    const LABEL_PAD   = 260 + 22 + 40
    const PLANET_HALF = 40

    function getLayout() {
      const w  = system.clientWidth
      const h  = system.clientHeight
      const cx = w / 2, cy = h / 2
      const ax = w / 2 - LABEL_PAD
      const ay = h / 2 - PLANET_HALF - 24
      const scale = Math.max(0.35, Math.min(ax / MAX_DESIGN_RADIUS, ay / MAX_DESIGN_RADIUS, 1))
      return { cx, cy, scale, w, h }
    }

    function drawOrbits({ cx, cy, scale, w, h }) {
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
      const n = okrData.keyResults.length
      svg.innerHTML = PLANET_CONFIGS.slice(0, n).map((c, i) => {
        const r = c.radius * scale
        const dash = i === 1 ? '1 5' : '2 7'
        const stroke = i === 1 ? 'rgba(243,146,0,.18)' : 'rgba(255,255,255,.10)'
        return `<circle fill="none" stroke="${stroke}" stroke-width="1" stroke-dasharray="${dash}" cx="${cx}" cy="${cy}" r="${r}"/>`
      }).join('')
    }

    let layout = getLayout()
    drawOrbits(layout)

    function onResize() { layout = getLayout(); drawOrbits(layout) }
    window.addEventListener('resize', onResize)

    let t = 0, lastTime = performance.now(), rafId

    function tick(now) {
      const dt = Math.min(50, now - lastTime)
      lastTime = now
      if (animRunningRef.current) t += dt * 0.001

      const { cx, cy, scale } = layout
      const n = okrData.keyResults.length

      for (let i = 0; i < n; i++) {
        const el    = planetDivRefs.current[i]
        const label = labelRefs.current[i]
        if (!el) continue
        const cfg   = PLANET_CONFIGS[i]
        const angle = cfg.phase + t * cfg.speed
        const r     = cfg.radius * scale
        const x     = cx + Math.cos(angle) * r
        const y     = cy + Math.sin(angle) * r
        el.style.left = x + 'px'
        el.style.top  = y + 'px'
        if (label) {
          if (x > cx + 20) label.classList.add('flip')
          else              label.classList.remove('flip')
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', onResize) }
  }, [okrData])

  // ── Sync animRunning ref ───────────────────────────────────────────────────
  useEffect(() => { animRunningRef.current = animRunning }, [animRunning])

  // ── Stars opacity toggle ───────────────────────────────────────────────────
  useEffect(() => {
    if (starsFarRef.current)  starsFarRef.current.style.opacity  = starsOn ? '1'   : '0'
    if (starsNearRef.current) starsNearRef.current.style.opacity = starsOn ? '1'   : '0.15'
  }, [starsOn])

  const updateProgress = (index, value) => {
    setProgress(prev => {
      const next = [...prev]; next[index] = value
      if (!isDemo) localStorage.setItem('lean-okr-progress', JSON.stringify(next))
      return next
    })
  }

  const updateSettings = (key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      localStorage.setItem('lean-okr-settings', JSON.stringify(next))
      return next
    })
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.setItem('lean-okr-settings', JSON.stringify(DEFAULT_SETTINGS))
  }

  const { objective, keyResults } = okrData
  const sunColor  = /^#[0-9A-Fa-f]{6}$/.test(settings.accentColor) ? settings.accentColor : '#F39200'
  const fontColor = /^#[0-9A-Fa-f]{6}$/.test(settings.fontColor)   ? settings.fontColor   : '#ffffff'
  const avgProg   = Math.round(keyResults.reduce((s, _, i) => s + (progress[i] || 0), 0) / keyResults.length)
  const overallSl = statusLabel(avgProg)
  const mono      = "'JetBrains Mono',monospace"
  const initial   = (settings.companyName || 'L').charAt(0).toUpperCase()

  const planetConfigs = PLANET_CONFIGS.map((cfg, i) => ({
    ...cfg,
    ...deriveColors(settings.planetColors?.[i] || DEFAULT_PLANET_COLORS[i]),
  }))

  return (
    <div
      onClick={() => setSelectedKR(null)}
      style={{
        position: 'fixed', inset: 0,
        background: '#0a0a0a', overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: fontColor,
        '--okr-gold': sunColor,
      }}
    >
      <style>{MONITOR_CSS}</style>

      {/* Nebula */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 60% 50% at 30% 40%, rgba(10,84,115,.28), transparent 60%),
          radial-gradient(ellipse 45% 40% at 75% 65%, rgba(243,146,0,.08), transparent 60%),
          radial-gradient(ellipse 80% 60% at 50% 100%, rgba(10,84,115,.15), transparent 70%)
        `,
      }} />

      {/* Starfield canvases */}
      <canvas ref={starsFarRef}  style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }} />
      <canvas ref={starsNearRef} style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }} />

      {/* ── Top-left brand badge ──────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 36, left: 36, zIndex: 40,
        display: 'flex', alignItems: 'center', gap: 18,
        padding: '14px 22px 14px 14px', borderRadius: 18,
        background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.08)',
        backdropFilter: 'blur(14px)',
      }}>
        {settings.logoDataUrl ? (
          <img src={settings.logoDataUrl} alt="Logo" style={{
            width: 56, height: 56, objectFit: 'contain', borderRadius: 12,
            background: 'rgba(255,255,255,.06)', flexShrink: 0,
          }} />
        ) : (
          <div style={{
            width: 56, height: 56, borderRadius: 14, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg,#0E6E95,#0A5473)',
            border: '1px solid rgba(255,255,255,.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', flexShrink: 0,
          }}>
            <span style={{ position: 'relative', zIndex: 1 }}>{initial}</span>
            <div style={{ position: 'absolute', inset: 'auto -6px -6px auto', width: 24, height: 24, background: sunColor, borderRadius: '50%', filter: 'blur(2px)', opacity: 0.9 }} />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {settings.companyName || 'Lean OKR'}
          </span>
          <span style={{ fontFamily: mono, fontSize: 13, color: 'rgba(255,255,255,.38)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 4 }}>
            Q{qi.q} · {today.getFullYear()} · Zielemonitor
          </span>
        </div>
      </div>

      {/* ── Top-right meta ────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 36, right: 36, zIndex: 40,
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,.38)',
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', border: '1px solid rgba(255,255,255,.14)', borderRadius: 999,
          background: 'rgba(255,255,255,.02)', color: 'rgba(255,255,255,.62)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sunColor, boxShadow: `0 0 10px ${sunColor}`, animation: 'okrPulse 2s infinite' }} />
          LIVE · SYNC
        </span>
        <span>KW {kw}</span>
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,.38)', opacity: .5 }} />
        <span>TAG {qi.day} / {qi.total}</span>
      </div>

      {/* ── Demo badge ────────────────────────────────────────────────────── */}
      {isDemo && (
        <div style={{
          position: 'fixed', top: 36, left: '50%', transform: 'translateX(-50%)', zIndex: 40,
          background: `${sunColor}1a`, border: `1px solid ${sunColor}40`,
          borderRadius: 8, padding: '4px 14px',
          color: `${sunColor}cc`, fontSize: 12, fontWeight: 500,
          fontFamily: mono, letterSpacing: '0.06em', whiteSpace: 'nowrap',
        }}>
          DEMO · OKR-Builder starten für echte Daten
        </div>
      )}

      {/* ── Orbital stage ─────────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div ref={systemRef} style={{ position: 'relative', width: 'min(1400px,96vw)', height: 'min(960px,92vh)' }}>

          {/* Orbit rings SVG */}
          <svg ref={orbitSvgRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 6 }} />

          {/* Sun — centered, objective text inside */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            zIndex: 20, pointerEvents: 'none',
          }}>
            <Sun
              color={sunColor}
              objective={objective}
              avgProg={avgProg}
              overallSl={overallSl}
              mono={mono}
              quarter={qi.q}
              year={today.getFullYear()}
            />
          </div>

          {/* Planets — positioned by rAF loop */}
          {keyResults.map((kr, i) => (
            <Planet
              key={i}
              index={i}
              config={planetConfigs[i]}
              progress={progress[i] ?? 0}
              krText={kr}
              isActive={selectedKR === i}
              planetRef={el => { planetDivRefs.current[i] = el }}
              labelRef={el  => { labelRefs.current[i]     = el }}
              onClick={e => { e.stopPropagation(); setSelectedKR(prev => prev === i ? null : i) }}
              onProgressChange={v => updateProgress(i, v)}
            />
          ))}
        </div>
      </div>

      {/* ── Back button ───────────────────────────────────────────────────── */}
      <button onClick={() => navigate('/')} style={{
        position: 'fixed', bottom: 36, left: 36, zIndex: 40,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 10,
        background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.1)',
        color: 'rgba(255,255,255,.4)', fontSize: 13, cursor: 'pointer',
        fontFamily: 'inherit',
      }}>
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Zurück
      </button>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 36, left: '50%', transform: 'translateX(-50%)', zIndex: 40,
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '10px 18px', border: '1px solid rgba(255,255,255,.08)', borderRadius: 999,
        background: 'rgba(255,255,255,.02)', backdropFilter: 'blur(10px)',
        fontFamily: mono, fontSize: 10.5, color: 'rgba(255,255,255,.38)',
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        {[['#7ED321','On Track · > 66%'],['#F5A623','At Risk · 33–66%'],['#E85D75','Behind · < 33%']].map(([c, label], i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,.14)', marginRight: 10 }} />}
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, boxShadow: `0 0 8px ${c}` }} />
            {label}
          </span>
        ))}
      </div>

      {/* ── Settings ──────────────────────────────────────────────────────── */}
      <SettingsPanel
        settings={settings}
        open={settingsOpen}
        onToggle={() => setSettingsOpen(o => !o)}
        onChange={updateSettings}
        onReset={resetSettings}
        animRunning={animRunning}
        onAnimToggle={() => setAnimRunning(v => !v)}
        starsOn={starsOn}
        onStarsToggle={() => setStarsOn(v => !v)}
      />
    </div>
  )
}

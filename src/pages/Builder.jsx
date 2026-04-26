import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Anthropic from '@anthropic-ai/sdk'

// ─── CSS ──────────────────────────────────────────────────────────────────────

const BUILDER_CSS = `
  .bld-root {
    min-height:100vh;background:#0a0a0a;color:var(--font-color,#fff);
    font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;
    font-feature-settings:"ss01","cv11";
    overflow:hidden;position:relative;
  }
  .bld-bg-grid {
    position:fixed;inset:0;z-index:0;pointer-events:none;
    background-image:
      linear-gradient(to right,rgba(255,255,255,0.022) 1px,transparent 1px),
      linear-gradient(to bottom,rgba(255,255,255,0.022) 1px,transparent 1px);
    background-size:96px 96px;
    mask-image:radial-gradient(ellipse 1400px 900px at 50% 50%,#000 30%,transparent 85%);
    -webkit-mask-image:radial-gradient(ellipse 1400px 900px at 50% 50%,#000 30%,transparent 85%);
  }
  .bld-bg-glow {
    position:fixed;inset:0;z-index:0;pointer-events:none;
    background:
      radial-gradient(ellipse 900px 550px at 20% 115%,rgba(10,84,115,0.22),transparent 60%),
      radial-gradient(ellipse 700px 400px at 100% -10%,rgba(245,166,35,0.12),transparent 60%);
  }
  .bld-viewport {
    position:relative;z-index:1;
    min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;
  }
  .bld-canvas {
    width:1600px;height:900px;transform-origin:center center;
    display:flex;flex-direction:column;position:relative;
  }

  /* ── Header ── */
  .bld-head {
    display:grid;grid-template-columns:1fr auto 1fr;align-items:center;
    padding:28px 48px;border-bottom:1px solid rgba(255,255,255,0.08);
    flex-shrink:0;position:relative;z-index:2;
  }
  .bld-brand {display:flex;align-items:center;gap:12px;font-weight:600;font-size:15px;letter-spacing:-0.01em}
  .bld-brand-mark {width:20px;height:20px;position:relative;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .bld-brand-mark::before {content:"";position:absolute;inset:0;border:1.5px solid #0E6E95;border-radius:50%;opacity:0.75}
  .bld-brand-mark::after {content:"";width:7px;height:7px;background:var(--accent);border-radius:50%;box-shadow:0 0 12px var(--accent)}
  .bld-divider {width:1px;height:16px;background:rgba(255,255,255,0.14);margin:0 4px;flex-shrink:0}
  .bld-crumb {color:rgba(255,255,255,0.62);font-weight:400;font-size:13px}

  .bld-progress {
    justify-self:center;display:flex;align-items:center;gap:20px;
    padding:8px 18px;border:1px solid rgba(255,255,255,0.14);border-radius:999px;
    background:rgba(255,255,255,0.02);
  }
  .bld-plabel {font-size:11px;color:rgba(255,255,255,0.62);text-transform:uppercase;font-family:'JetBrains Mono',monospace;letter-spacing:0.04em}
  .bld-plabel b {color:#fff;font-weight:500}
  .bld-dots {display:flex;align-items:center;gap:10px}
  .bld-dot {width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.22);transition:all .3s;position:relative;flex-shrink:0}
  .bld-dot.done {background:#0E6E95}
  .bld-dot.active {
    background:var(--accent);width:10px;height:10px;
    box-shadow:0 0 0 4px var(--accent-soft),0 0 16px var(--accent-glow);
  }
  .bld-dot+.bld-dot::before {
    content:"";position:absolute;right:100%;top:50%;transform:translateY(-50%);
    width:14px;height:1px;background:rgba(255,255,255,0.14);margin-right:2px;
  }
  .bld-dot.done+.bld-dot::before,.bld-dot.active+.bld-dot::before {background:rgba(255,255,255,0.22)}

  .bld-session {justify-self:end;display:flex;align-items:center;gap:10px;font-size:12px;color:rgba(255,255,255,0.62)}
  .bld-tag {
    display:inline-flex;align-items:center;gap:8px;
    padding:6px 12px;border:1px solid rgba(255,255,255,0.14);border-radius:6px;
    font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.04em;
  }
  .bld-pulse {width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px var(--accent);animation:bld-pulse 2s infinite;flex-shrink:0}
  @keyframes bld-pulse {0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.85)}}

  /* ── Stage ── */
  .bld-stage {
    flex:1;min-height:0;overflow:hidden;
    padding:56px 120px 24px;position:relative;z-index:1;
  }
  .bld-stage-inner {height:100%;display:flex;flex-direction:column}

  .bld-kicker {
    display:inline-flex;align-items:center;gap:10px;
    padding:6px 12px;border:1px solid var(--accent-line);border-radius:999px;
    background:var(--accent-soft);color:var(--accent);
    font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;
    margin-bottom:24px;
  }
  .bld-kicker .d {width:5px;height:5px;background:var(--accent);border-radius:50%;box-shadow:0 0 8px var(--accent);flex-shrink:0}

  .bld-q {font-size:46px;line-height:1.18;letter-spacing:-0.025em;font-weight:500;max-width:24ch;margin-bottom:18px;color:var(--font-color,#fff)}
  .bld-q em {color:var(--accent);font-style:normal}
  .bld-q-sm {font-size:36px}

  .bld-help {font-size:17px;color:rgba(255,255,255,0.62);line-height:1.55;letter-spacing:-0.005em;max-width:64ch}
  .bld-help b {color:#fff;font-weight:500}
  .bld-help .ex {color:#fff;font-style:italic}

  /* ── Field ── */
  .bld-field {
    margin-top:24px;
    border:1px solid rgba(255,255,255,0.14);border-radius:14px;
    background:linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.008));
    transition:border-color .2s,box-shadow .2s;display:flex;flex-direction:column;
  }
  .bld-field:focus-within {
    border-color:var(--accent);
    box-shadow:0 0 0 4px var(--accent-soft),0 0 60px -10px var(--accent-glow);
  }
  .bld-field-top {
    display:flex;justify-content:space-between;align-items:center;
    padding:12px 18px;border-bottom:1px solid rgba(255,255,255,0.08);
    font-size:11px;color:rgba(255,255,255,0.40);
  }
  .bld-field-top-left {display:flex;align-items:center;gap:10px}
  .bld-badge {
    padding:3px 8px;border:1px solid rgba(255,255,255,0.14);border-radius:4px;
    font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.62);
  }
  .bld-field textarea,.bld-field-input {
    width:100%;padding:18px 22px;
    background:transparent;border:none;outline:none;resize:none;
    color:var(--font-color,#fff);font-family:inherit;font-size:22px;line-height:1.45;letter-spacing:-0.012em;
  }
  .bld-field textarea {min-height:110px}
  .bld-field textarea::placeholder,.bld-field-input::placeholder {color:rgba(255,255,255,0.22);font-style:italic}
  .bld-field-bot {
    display:flex;justify-content:space-between;align-items:center;
    padding:10px 14px 10px 18px;border-top:1px solid rgba(255,255,255,0.08);
    font-size:11px;color:rgba(255,255,255,0.40);
  }
  .bld-count {font-family:'JetBrains Mono',monospace}
  .bld-count b {color:rgba(255,255,255,0.62);font-weight:500}

  /* ── AI Button ── */
  .bld-btn-ai {
    display:inline-flex;align-items:center;gap:8px;
    padding:9px 14px;border-radius:8px;
    background:var(--accent-soft);border:1px solid var(--accent-line);color:var(--accent);
    font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;transition:all .2s;
  }
  .bld-btn-ai:hover:not(:disabled) {background:rgba(245,166,35,0.20);border-color:var(--accent)}
  .bld-btn-ai:disabled {opacity:0.4;cursor:not-allowed}
  .bld-btn-ai svg {width:13px;height:13px}
  .bld-btn-ai .k {padding:2px 5px;border:1px solid currentColor;border-radius:3px;font-family:'JetBrains Mono',monospace;font-size:9.5px;opacity:0.7;margin-left:2px}

  /* ── AI Panel ── */
  .bld-ai-panel {
    margin-top:14px;border:1px dashed rgba(255,255,255,0.14);border-radius:12px;
    padding:14px 18px;background:rgba(255,255,255,0.01);transition:all .3s;
  }
  .bld-ai-panel.ready {border:1px solid var(--accent-line);background:linear-gradient(180deg,var(--accent-soft),rgba(245,166,35,0.02))}
  .bld-ai-head {display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
  .bld-ai-title {
    display:flex;align-items:center;gap:10px;font-size:11px;color:rgba(255,255,255,0.40);
    font-family:'JetBrains Mono',monospace;letter-spacing:0.10em;text-transform:uppercase;
  }
  .bld-ai-panel.ready .bld-ai-title {color:var(--accent)}
  .bld-ai-ico {
    width:18px;height:18px;border-radius:50%;background:#141414;
    border:1px solid rgba(255,255,255,0.14);display:flex;align-items:center;justify-content:center;
    color:rgba(255,255,255,0.40);flex-shrink:0;
  }
  .bld-ai-panel.ready .bld-ai-ico {background:var(--accent-soft);border-color:var(--accent-line);color:var(--accent)}
  .bld-ai-ico svg {width:10px;height:10px}
  .bld-ai-body {color:rgba(255,255,255,0.22);font-size:15px;line-height:1.5;font-style:italic;min-height:28px}
  .bld-ai-panel.ready .bld-ai-body {color:#fff;font-style:normal}
  .bld-ai-actions {display:flex;align-items:center;gap:4px}
  .bld-ai-accept {
    display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:6px;
    background:var(--accent);color:#0a0a0a;border:none;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;
  }
  .bld-ai-accept svg {width:11px;height:11px}
  .bld-ai-discard {background:none;border:none;color:rgba(255,255,255,0.40);cursor:pointer;font-family:inherit;font-size:12px;padding:6px 8px}
  .bld-ai-discard:hover {color:rgba(255,255,255,0.62)}

  /* ── KR List ── */
  .bld-kr-list {display:flex;flex-direction:column;gap:14px;margin-top:24px}
  .bld-kr-row {
    display:flex;align-items:stretch;
    border:1px solid rgba(255,255,255,0.14);border-radius:14px;
    background:linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.008));
    overflow:hidden;transition:border-color .2s,box-shadow .2s;
  }
  .bld-kr-row:focus-within {border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-soft)}
  .bld-kr-idx {
    flex-shrink:0;width:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
    border-right:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.40);
  }
  .bld-kr-idx .n {font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:500;color:#fff}
  .bld-kr-idx .lbl {font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:0.12em;text-transform:uppercase}
  .bld-kr-row.optional .bld-kr-idx .n {color:rgba(255,255,255,0.62)}
  .bld-kr-input {
    flex:1;padding:18px;font-size:18px;background:transparent;border:none;outline:none;
    color:var(--font-color,#fff);font-family:inherit;
  }
  .bld-kr-input::placeholder {color:rgba(255,255,255,0.22);font-style:italic}
  .bld-opt-tag {
    align-self:center;margin-right:14px;flex-shrink:0;
    padding:3px 8px;border:1px solid rgba(255,255,255,0.14);border-radius:4px;
    font-family:'JetBrains Mono',monospace;font-size:9.5px;color:rgba(255,255,255,0.40);
    letter-spacing:0.1em;text-transform:uppercase;
  }

  /* ── Anchor Grid ── */
  .bld-anchor-grid {display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:18px;margin-top:28px}
  .bld-anchor-card {
    border:1px solid rgba(255,255,255,0.14);border-radius:14px;
    background:linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.008));
    display:flex;flex-direction:column;overflow:hidden;
    transition:border-color .2s,box-shadow .2s;
  }
  .bld-anchor-card:focus-within {border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-soft)}
  .bld-anchor-head {
    display:flex;align-items:center;gap:10px;
    padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.08);
    font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;
    color:var(--accent);
  }
  .bld-anchor-ico {
    width:22px;height:22px;border-radius:50%;flex-shrink:0;
    background:var(--accent-soft);border:1px solid var(--accent-line);
    display:flex;align-items:center;justify-content:center;color:var(--accent);
  }
  .bld-anchor-ico svg {width:11px;height:11px}
  .bld-anchor-input {
    padding:16px 18px;font-size:19px;background:transparent;border:none;outline:none;
    color:var(--font-color,#fff);font-family:inherit;
  }
  .bld-anchor-input::placeholder {color:rgba(255,255,255,0.22);font-style:italic}
  .bld-anchor-hint {padding:0 18px 14px;font-size:11px;color:rgba(255,255,255,0.40);font-family:'JetBrains Mono',monospace;letter-spacing:0.04em}

  /* ── Summary ── */
  .bld-summary {display:grid;grid-template-columns:1.2fr 1fr;gap:24px;margin-top:16px;flex:1;min-height:0}
  .bld-sum-obj {
    border:1px solid var(--accent-line);border-radius:18px;padding:28px 32px;
    background:linear-gradient(180deg,var(--accent-soft),rgba(245,166,35,0.03));
    position:relative;overflow:hidden;display:flex;flex-direction:column;
  }
  .bld-sum-obj::before {
    content:"";position:absolute;width:200px;height:200px;border-radius:50%;
    right:-60px;top:-60px;background:var(--accent);opacity:0.15;filter:blur(40px);pointer-events:none;
  }
  .bld-sum-obj-lbl {font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--accent);letter-spacing:0.14em;text-transform:uppercase;margin-bottom:14px}
  .bld-sum-obj-h2 {font-size:24px;font-weight:500;letter-spacing:-0.02em;line-height:1.3;color:var(--font-color,#fff)}
  .bld-sum-obj-meta {
    margin-top:auto;padding-top:16px;border-top:1px solid var(--accent-line);
    display:flex;gap:20px;flex-wrap:wrap;
    font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,0.62);letter-spacing:0.06em;
  }
  .bld-sum-obj-meta b {color:#fff;font-weight:500;display:block;font-size:13px;margin-top:2px}

  .bld-sum-list {display:flex;flex-direction:column;gap:10px;overflow:hidden}
  .bld-sum-card {border:1px solid rgba(255,255,255,0.14);border-radius:12px;padding:14px 18px;background:rgba(255,255,255,0.02)}
  .bld-sum-lbl {
    font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.40);
    letter-spacing:0.14em;text-transform:uppercase;margin-bottom:6px;
    display:flex;align-items:center;gap:8px;
  }
  .bld-sum-lbl .d {width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 6px var(--accent);flex-shrink:0}
  .bld-sum-txt {font-size:14px;color:var(--font-color,#fff);line-height:1.45}
  .bld-sum-anchor {border:1px solid rgba(255,255,255,0.14);border-radius:12px;padding:14px 18px;background:linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0))}
  .bld-sum-anchor-row {display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:8px}
  .bld-sum-anchor-k {font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.40);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:3px}
  .bld-sum-anchor-v {font-size:13px;color:var(--font-color,#fff);font-weight:500}

  .bld-sum-actions {display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.08)}
  .bld-sum-actions-left {display:flex;gap:10px}

  /* ── Footer ── */
  .bld-footer {
    padding:18px 48px;border-top:1px solid rgba(255,255,255,0.08);
    display:grid;grid-template-columns:1fr 1fr 1fr;align-items:center;
    background:rgba(10,10,10,0.7);backdrop-filter:blur(10px);flex-shrink:0;position:relative;z-index:2;
  }
  .bld-nav-back {display:flex;align-items:center}
  .bld-nav-next {justify-self:end;display:flex;align-items:center;gap:12px;}
  .bld-nav-center {
    justify-self:center;font-size:11px;color:rgba(255,255,255,0.40);
    font-family:'JetBrains Mono',monospace;letter-spacing:0.12em;
    display:flex;align-items:center;gap:10px;
  }
  .bld-nav-center .sep {width:4px;height:4px;background:rgba(255,255,255,0.40);border-radius:50%;opacity:0.5}

  .bld-btn {
    display:inline-flex;align-items:center;gap:10px;
    padding:13px 20px;border-radius:10px;
    font-family:inherit;font-size:14px;font-weight:500;letter-spacing:-0.005em;
    cursor:pointer;transition:all .2s;
    border:1px solid rgba(255,255,255,0.14);background:transparent;color:rgba(255,255,255,0.62);
  }
  .bld-btn:hover:not(:disabled) {color:#fff;border-color:rgba(255,255,255,0.22);background:rgba(255,255,255,0.03)}
  .bld-btn:disabled {opacity:0.3;cursor:not-allowed}
  .bld-btn svg {width:14px;height:14px}
  .bld-btn.primary {background:var(--accent);color:#0a0a0a;border-color:var(--accent)}
  .bld-btn.primary:hover:not(:disabled) {
    background:var(--accent-2);border-color:var(--accent-2);
    transform:translateX(2px);box-shadow:0 10px 40px -10px var(--accent-glow);
  }
  .bld-btn.primary:disabled {opacity:0.35;cursor:not-allowed;transform:none}

  .bld-save-status {display:flex;align-items:center;gap:8px;font-size:11px;color:rgba(255,255,255,0.40);font-family:'JetBrains Mono',monospace;letter-spacing:0.06em}
  .bld-save-status .sd {width:6px;height:6px;border-radius:50%;background:#0E6E95;box-shadow:0 0 6px #0E6E95;flex-shrink:0}

  @keyframes bld-spin {to{transform:rotate(360deg)}}
  .bld-spinner {width:12px;height:12px;border:1.5px solid currentColor;border-top-color:transparent;border-radius:50%;animation:bld-spin .7s linear infinite;flex-shrink:0}

  /* ── Settings ── */
  .bld-settings-wrap {position:relative;}
  .bld-settings-panel {
    position:absolute;bottom:calc(100% + 12px);right:0;
    width:300px;max-height:min(560px,80vh);overflow-y:auto;
    padding:18px;border-radius:14px;
    background:linear-gradient(180deg,rgba(20,20,20,.97),rgba(12,12,12,.97));
    border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(18px);
    box-shadow:0 20px 60px -20px rgba(0,0,0,.7);
    opacity:0;transform:translateY(10px) scale(.96);pointer-events:none;
    transition:all .25s cubic-bezier(.2,.7,.2,1);
    scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent;
  }
  .bld-settings-panel.open {opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}
  .bld-fab {
    display:inline-flex;align-items:center;justify-content:center;
    width:36px;height:36px;border-radius:10px;
    border:1px solid rgba(255,255,255,.14);background:transparent;
    color:rgba(255,255,255,.50);cursor:pointer;transition:all .2s;flex-shrink:0;
  }
  .bld-fab:hover {color:var(--accent);border-color:var(--accent);background:var(--accent-soft);}
  .bld-fab.open {color:var(--accent);border-color:var(--accent);background:var(--accent-soft);}
  .bld-fab svg {width:15px;height:15px;transition:transform .4s;}
  .bld-fab.open svg {transform:rotate(90deg);}
  .bld-color-row {display:flex;align-items:center;justify-content:space-between;padding:5px 0;font-size:12px;color:rgba(255,255,255,.6);gap:8px;}
  .bld-color-row-label {flex:1;min-width:0;}
  .bld-color-controls {display:flex;align-items:center;gap:6px;flex-shrink:0;}
  .bld-color-input {width:28px;height:22px;border-radius:5px;border:1px solid rgba(255,255,255,.2);cursor:pointer;padding:0;background:none;overflow:hidden;flex-shrink:0;}
  .bld-color-input::-webkit-color-swatch-wrapper {padding:0;}
  .bld-color-input::-webkit-color-swatch {border:none;border-radius:3px;}
  .bld-hex-input {width:80px;padding:3px 7px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:5px;color:rgba(255,255,255,.7);font-family:'JetBrains Mono',monospace;font-size:11px;outline:none;letter-spacing:0.04em;}
  .bld-hex-input:focus {border-color:rgba(255,255,255,.3);color:#fff;}
  .bld-settings-reset {
    width:100%;padding:9px;margin-top:4px;border-radius:8px;
    background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.14);
    color:rgba(255,255,255,.50);font-family:inherit;font-size:12px;cursor:pointer;transition:all .2s;
  }
  .bld-settings-reset:hover {background:rgba(255,255,255,.07);color:rgba(255,255,255,.8);}
`

// ─── Helpers ──────────────────────────────────────────────────────────────────

const wordCount = t => (t.trim() ? t.trim().split(/\s+/).length : 0)

const STEP_META = [
  { label: 'FOKUS',        time: '~ 6 MIN',  next: 'Weiter zu Objective' },
  { label: 'OBJECTIVE',    time: '~ 8 MIN',  next: 'Weiter zu Key Results' },
  { label: 'KEY RESULTS',  time: '~ 12 MIN', next: 'Weiter zu Alltagsanker' },
  { label: 'ALLTAGSANKER', time: '~ 5 MIN',  next: 'Zur Zusammenfassung' },
  { label: 'REVIEW',       time: 'BEREIT',   next: null },
]

// ─── Settings ─────────────────────────────────────────────────────────────────

const DEFAULT_BUILDER_SETTINGS = {
  accentColor: '#F5A623',
  fontColor: '#FFFFFF',
  companyName: '',
}

function deriveAccent(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  const lv = (v,f) => Math.min(255, Math.round(v+(255-v)*f))
  const toH = (rv,gv,bv) => '#'+[rv,gv,bv].map(v=>v.toString(16).padStart(2,'0')).join('')
  return {
    base: hex,
    hi: toH(lv(r,.18),lv(g,.18),lv(b,.18)),
    soft: `rgba(${r},${g},${b},0.12)`,
    line: `rgba(${r},${g},${b},0.30)`,
    glow: `rgba(${r},${g},${b},0.45)`,
  }
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
    <div className="bld-color-row">
      <span className="bld-color-row-label">{label}</span>
      <div className="bld-color-controls">
        <input type="color" className="bld-color-input" value={value}
          onChange={e => { onChange(e.target.value); setHex(e.target.value) }} />
        <input type="text" className="bld-hex-input" value={hex}
          onChange={e => setHex(e.target.value)}
          onBlur={() => commit(hex)}
          onKeyDown={e => { if (e.key === 'Enter') { commit(hex); e.target.blur() } }}
          maxLength={7}
        />
      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const StarIco = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"/>
  </svg>
)
const CheckIco = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 7"/>
  </svg>
)
const ArrowRIco = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)
const ArrowLIco = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)
const CopyIco = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)
const ResetIco = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>
  </svg>
)
const MonitorIco = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/><circle cx="21" cy="6" r="2" fill="currentColor"/>
  </svg>
)
const GearIco = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Builder() {
  const navigate = useNavigate()
  const vpRef = useRef(null)

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

  const [bldSettings, setBldSettings] = useState(DEFAULT_BUILDER_SETTINGS)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // ── Load settings from localStorage ──────────────────────────────────────
  useEffect(() => {
    try {
      const s = localStorage.getItem('lean-okr-builder-settings')
      if (s) setBldSettings(prev => ({ ...DEFAULT_BUILDER_SETTINGS, ...JSON.parse(s) }))
    } catch {}
  }, [])

  // ── Viewport scaling ──────────────────────────────────────────────────────
  useEffect(() => {
    function scale() {
      if (!vpRef.current) return
      const s = Math.min(window.innerWidth / 1600, window.innerHeight / 900)
      vpRef.current.style.transform = `scale(${s})`
    }
    scale()
    window.addEventListener('resize', scale)
    return () => window.removeEventListener('resize', scale)
  }, [])

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = e => {
      if (e.target.matches('input,textarea')) return
      if (e.key === 'ArrowRight' && step < 5) setStep(s => s + 1)
      if (e.key === 'ArrowLeft'  && step > 1) setStep(s => s - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step])

  // ── Logic ─────────────────────────────────────────────────────────────────
  const canProceed = () => {
    if (step === 1) return focus.trim().length > 0
    if (step === 2) return objective.trim().length > 0
    if (step === 3) return keyResults[0].trim().length > 0 && keyResults[1].trim().length > 0
    if (step === 4) return dailyAction.trim() && dailyPerson.trim() && dailyDeadline.trim()
    return true
  }

  const getClient = () =>
    new Anthropic({ apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY, dangerouslyAllowBrowser: true })

  const improveObjective = async () => {
    if (aiObjective) { setAiObjective(''); setAiObjectiveError(''); return }
    setAiObjectiveLoading(true); setAiObjectiveError(''); setAiObjective('')
    try {
      const msg = await getClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'Du bist ein OKR-Experte der Teams im Mittelstand dabei hilft, inspirierende Objectives zu formulieren. Du gibst kurze, direkte Antworten auf Deutsch. Kein Fachjargon, keine langen Erklärungen.',
        messages: [{
          role: 'user',
          content: `Verbessere dieses Objective zu einem klaren, inspirierenden Satz der einen erreichbaren Zustand beschreibt, keine Aktivität:\n\n"${objective}"\n\nGib nur das verbesserte Objective zurück, ohne Anführungszeichen, ohne Erklärung.`,
        }],
      })
      setAiObjective(msg.content[0].text.trim())
    } catch {
      setAiObjectiveError('KI nicht erreichbar, bitte API Key prüfen.')
    } finally {
      setAiObjectiveLoading(false)
    }
  }

  const checkKeyResults = async () => {
    setAiKRLoading(true); setAiKRError(''); setAiKRFeedback('')
    try {
      const krLines = keyResults
        .map((kr, i) => kr.trim() ? `KR${i + 1}: ${kr.trim()}` : null)
        .filter(Boolean)
        .join('\n')
      const msg = await getClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'Du bist ein OKR-Experte der Teams im Mittelstand dabei hilft, messbare Key Results zu formulieren. Du gibst kurzes, direktes Feedback auf Deutsch. Kein Fachjargon, keine langen Erklärungen.',
        messages: [{
          role: 'user',
          content: `Prüfe diese Key Results auf Messbarkeit und Konkretheit:\n${krLines}\n\nAntworte für jedes Key Result mit genau einer Zeile:\n✅ KR1: [kurzes Lob wenn gut] ODER ⚠️ KR1: [ein konkreter Verbesserungsvorschlag]\n\nRegeln für gute Key Results: messbar (hat eine Zahl), beschreibt ein Ergebnis nicht eine Aktivität, hat einen klaren Ausgangswert und Zielwert. Leere Felder ignorieren.`,
        }],
      })
      setAiKRFeedback(msg.content[0].text.trim())
    } catch {
      setAiKRError('KI nicht erreichbar, bitte API Key prüfen.')
    } finally {
      setAiKRLoading(false)
    }
  }

  const updateKR = (i, v) => setKeyResults(prev => { const n = [...prev]; n[i] = v; return n })

  const copyToClipboard = async () => {
    const lines = [
      `OKR – ${new Date().toLocaleDateString('de-DE')}`, '',
      'OBJECTIVE', objective, '',
      'KEY RESULTS', ...keyResults.filter(kr => kr.trim()).map((kr, i) => `${i + 1}. ${kr}`), '',
      'ALLTAGSANKER', `Aktion: ${dailyAction}`, `Verantwortlich: ${dailyPerson}`, `Bis: ${dailyDeadline}`,
    ]
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const saveAndNavigate = () => {
    localStorage.setItem('lean-okr-current', JSON.stringify({
      createdAt: new Date().toISOString(), focus, objective,
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

  const updateBldSettings = (patch) => {
    setBldSettings(prev => {
      const next = { ...prev, ...patch }
      localStorage.setItem('lean-okr-builder-settings', JSON.stringify(next))
      return next
    })
  }

  const resetBldSettings = () => {
    setBldSettings(DEFAULT_BUILDER_SETTINGS)
    localStorage.setItem('lean-okr-builder-settings', JSON.stringify(DEFAULT_BUILDER_SETTINGS))
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const today = new Date()
  const quarter = Math.floor(today.getMonth() / 3) + 1
  const year = today.getFullYear()
  const meta = STEP_META[step - 1]

  const accentHex = /^#[0-9A-Fa-f]{6}$/.test(bldSettings.accentColor) ? bldSettings.accentColor : '#F5A623'
  const fontHex   = /^#[0-9A-Fa-f]{6}$/.test(bldSettings.fontColor)   ? bldSettings.fontColor   : '#FFFFFF'
  const ac = deriveAccent(accentHex)

  const CSSVars = {
    '--accent': ac.base, '--accent-2': ac.hi,
    '--accent-soft': ac.soft, '--accent-line': ac.line, '--accent-glow': ac.glow,
    '--font-color': fontHex,
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bld-root" style={CSSVars}>
      <style>{BUILDER_CSS}</style>
      <div className="bld-bg-grid" />
      <div className="bld-bg-glow" />

      <div className="bld-viewport">
        <div ref={vpRef} className="bld-canvas">

          {/* ── Header ── */}
          <header className="bld-head">
            <div className="bld-brand">
              <div className="bld-brand-mark" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span>Lean OKR</span>
                {bldSettings.companyName && (
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', fontWeight: 400, letterSpacing: '0.04em' }}>
                    {bldSettings.companyName}
                  </span>
                )}
              </div>
              <span className="bld-divider" />
              <span className="bld-crumb">OKR-Builder</span>
            </div>
            <div className="bld-progress">
              <span className="bld-plabel"><b>{String(step).padStart(2,'0')}</b> / 05</span>
              <div className="bld-dots">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`bld-dot ${i < step ? 'done' : i === step ? 'active' : ''}`} />
                ))}
              </div>
              <span className="bld-plabel">{meta.label}</span>
            </div>
            <div className="bld-session">
              <span className="bld-tag"><span className="bld-pulse" />LIVE · PROJEKTION</span>
              <span className="bld-tag" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>Q{quarter} · {year}</span>
            </div>
          </header>

          {/* ── Stage ── */}
          <div className="bld-stage">
            <div className="bld-stage-inner">

              {/* ── Step 1: Fokus ── */}
              {step === 1 && <>
                <span className="bld-kicker"><span className="d" />Frage 01 · Fokus setzen</span>
                <h1 className="bld-q">
                  Was soll sich in eurer Abteilung in den nächsten 3 Monaten <em>wirklich verändern</em> — wenn ihr nur eine Sache nennen dürftet?
                </h1>
                <p className="bld-help">Denkt an <b>Wirkung</b>, nicht an Aktivitäten. Die eine Sache, die am Ende des Quartals einen spürbaren Unterschied macht.</p>
                <div className="bld-field">
                  <div className="bld-field-top">
                    <div className="bld-field-top-left">
                      <span className="bld-badge">FOKUS</span>
                      <span>Eine Sache · Wirkung statt Aktivität</span>
                    </div>
                    <span>Auto-gespeichert</span>
                  </div>
                  <textarea
                    value={focus}
                    onChange={e => setFocus(e.target.value)}
                    placeholder="Schreibt hier rein, was sich wirklich ändern soll …"
                  />
                  <div className="bld-field-bot">
                    <span className="bld-count"><b>{wordCount(focus)}</b> Wörter · <b>{focus.length}</b>/240</span>
                    <span>SCHRITT 01 · KEIN ZIELSATZ NÖTIG</span>
                  </div>
                </div>
              </>}

              {/* ── Step 2: Objective ── */}
              {step === 2 && <>
                <span className="bld-kicker"><span className="d" />Frage 02 · Objective</span>
                <h1 className="bld-q">
                  Formuliert euer Ziel als <em>inspirierenden Satz.</em> Es soll motivieren, nicht verwalten.
                </h1>
                <p className="bld-help">
                  Ein gutes Objective beschreibt einen <b>Zustand</b>, keine Aktivität.
                  Beispiel: <span className="ex">„Wir werden zur ersten Anlaufstelle für unsere Kunden."</span>
                </p>
                <div className="bld-field">
                  <div className="bld-field-top">
                    <div className="bld-field-top-left">
                      <span className="bld-badge">OBJECTIVE</span>
                      <span>Ein Satz · Präsens · Zustand, keine Aktivität</span>
                    </div>
                    <button
                      className="bld-btn-ai"
                      onClick={improveObjective}
                      disabled={!objective.trim() || aiObjectiveLoading}
                    >
                      {aiObjectiveLoading
                        ? <><span className="bld-spinner" />KI arbeitet…</>
                        : <><StarIco />Mit KI verbessern<span className="k">⌘ K</span></>
                      }
                    </button>
                  </div>
                  <textarea
                    value={objective}
                    onChange={e => setObjective(e.target.value)}
                    placeholder="Tippt euer Objective hier ein …"
                  />
                  <div className="bld-field-bot">
                    <span className="bld-count"><b>{wordCount(objective)}</b> Wörter · <b>{objective.length}</b>/160</span>
                    <span>AUTO-GESPEICHERT</span>
                  </div>
                </div>

                <div className={`bld-ai-panel ${aiObjective ? 'ready' : ''}`}>
                  <div className="bld-ai-head">
                    <div className="bld-ai-title">
                      <span className="bld-ai-ico"><StarIco /></span>
                      {aiObjective ? 'KI-Vorschlag · inspirierender formuliert' : 'KI-Vorschlag erscheint hier'}
                    </div>
                    {aiObjective && (
                      <div className="bld-ai-actions">
                        <button className="bld-ai-discard" onClick={() => setAiObjective('')}>Verwerfen</button>
                        <button className="bld-ai-accept" onClick={() => { setObjective(aiObjective); setAiObjective('') }}>
                          Vorschlag übernehmen <CheckIco />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="bld-ai-body">
                    {aiObjective || 'Klicke „Mit KI verbessern", um einen alternativen, inspirierender formulierten Vorschlag zu erhalten.'}
                  </div>
                  {aiObjectiveError && <p style={{ color: '#E85D75', fontSize: 12, marginTop: 6 }}>{aiObjectiveError}</p>}
                </div>
              </>}

              {/* ── Step 3: Key Results ── */}
              {step === 3 && <>
                <span className="bld-kicker"><span className="d" />Frage 03 · Key Results</span>
                <h1 className="bld-q">
                  Woran würdet ihr <em>konkret merken</em>, dass ihr das Ziel erreicht habt?
                </h1>
                <p className="bld-help">Key Results sind <b>Messgrößen</b>, keine Aufgaben. Jedes KR beschreibt ein Ergebnis mit Zahl &amp; Endzustand.</p>

                <div className="bld-kr-list">
                  {[0, 1, 2].map(i => (
                    <div key={i} className={`bld-kr-row${i === 2 ? ' optional' : ''}`}>
                      <div className="bld-kr-idx">
                        <span className="n">{String(i + 1).padStart(2,'0')}</span>
                        <span className="lbl">KR</span>
                      </div>
                      <input
                        className="bld-kr-input"
                        type="text"
                        value={keyResults[i]}
                        onChange={e => updateKR(i, e.target.value)}
                        placeholder={i === 2 ? 'optional · drittes Key Result' : `z. B. Kundenzufriedenheit steigt von 72% auf 85%`}
                      />
                      {i === 2 && <span className="bld-opt-tag">Optional</span>}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button
                    className="bld-btn-ai"
                    onClick={checkKeyResults}
                    disabled={!keyResults[0].trim() || aiKRLoading}
                  >
                    {aiKRLoading
                      ? <><span className="bld-spinner" />KI prüft…</>
                      : <><CheckIco />Mit KI prüfen<span className="k">⌘ K</span></>
                    }
                  </button>
                </div>

                {(aiKRFeedback || aiKRError) && (
                  <div className={`bld-ai-panel${aiKRFeedback ? ' ready' : ''}`} style={{ marginTop: 12 }}>
                    <div className="bld-ai-head">
                      <div className="bld-ai-title">
                        <span className="bld-ai-ico"><CheckIco /></span>
                        {aiKRFeedback ? 'KI-Feedback zu euren Key Results' : 'Fehler'}
                      </div>
                      {aiKRFeedback && (
                        <button className="bld-ai-discard" onClick={() => { setAiKRFeedback(''); setAiKRError('') }}>Schließen</button>
                      )}
                    </div>
                    <div className="bld-ai-body" style={{ fontStyle: 'normal' }}>
                      {aiKRError
                        ? <span style={{ color: '#E85D75' }}>{aiKRError}</span>
                        : aiKRFeedback.split('\n').map((line, i) => {
                            const isGood = line.startsWith('✅')
                            const isWarn = line.startsWith('⚠️') || line.startsWith('⚠')
                            return (
                              <div key={i} style={{
                                color: isGood ? '#4ADE80' : isWarn ? '#FCD34D' : '#fff',
                                marginBottom: i < aiKRFeedback.split('\n').length - 1 ? 8 : 0,
                                lineHeight: 1.55,
                              }}>
                                {line}
                              </div>
                            )
                          })
                      }
                    </div>
                  </div>
                )}
              </>}

              {/* ── Step 4: Alltagsanker ── */}
              {step === 4 && <>
                <span className="bld-kicker"><span className="d" />Frage 04 · Alltagsanker</span>
                <h1 className="bld-q">
                  Was bedeutet dieses OKR <em>konkret für diese Woche</em>?
                </h1>
                <p className="bld-help"><b>Ohne diesen Schritt bleibt OKR abstrakt.</b> Verankert das Ziel in einer ersten, sichtbaren Handlung — Person, Aktion, Datum.</p>

                <div className="bld-anchor-grid">
                  <div className="bld-anchor-card">
                    <div className="bld-anchor-head">
                      <span className="bld-anchor-ico">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                      </span>
                      Konkrete Aktion
                    </div>
                    <input className="bld-anchor-input" type="text" value={dailyAction}
                      onChange={e => setDailyAction(e.target.value)}
                      placeholder="z. B. Kunden-Erstkontakt-Audit starten" />
                    <div className="bld-anchor-hint">Was wird tatsächlich gemacht — kein „klären", kein „besprechen".</div>
                  </div>
                  <div className="bld-anchor-card">
                    <div className="bld-anchor-head">
                      <span className="bld-anchor-ico">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>
                      </span>
                      Verantwortliche Person
                    </div>
                    <input className="bld-anchor-input" type="text" value={dailyPerson}
                      onChange={e => setDailyPerson(e.target.value)}
                      placeholder="Name" />
                    <div className="bld-anchor-hint">Genau eine Person — keine Teams, keine Abteilungen.</div>
                  </div>
                  <div className="bld-anchor-card">
                    <div className="bld-anchor-head">
                      <span className="bld-anchor-ico">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                      </span>
                      Bis wann
                    </div>
                    <input className="bld-anchor-input" type="text" value={dailyDeadline}
                      onChange={e => setDailyDeadline(e.target.value)}
                      placeholder="TT.MM.JJJJ" />
                    <div className="bld-anchor-hint">Ein konkretes Datum, nicht „nächste Woche".</div>
                  </div>
                </div>
              </>}

              {/* ── Step 5: Zusammenfassung ── */}
              {step === 5 && <>
                <span className="bld-kicker"><span className="d" />Schritt 05 · Zusammenfassung</span>
                <h1 className="bld-q bld-q-sm">
                  Euer OKR für <em>Q{quarter} {year}.</em><br />Bereit, sichtbar zu werden.
                </h1>

                <div className="bld-summary">
                  <div className="bld-sum-obj">
                    <div className="bld-sum-obj-lbl">Objective</div>
                    <h2 className="bld-sum-obj-h2">{objective || '–'}</h2>
                    <div className="bld-sum-obj-meta">
                      <span>ZYKLUS<b>Q{quarter} {year}</b></span>
                      {dailyPerson && <span>OWNER<b>{dailyPerson}</b></span>}
                    </div>
                  </div>

                  <div className="bld-sum-list">
                    {keyResults.filter(kr => kr.trim()).map((kr, i) => (
                      <div key={i} className="bld-sum-card">
                        <div className="bld-sum-lbl"><span className="d" />Key Result {String(i + 1).padStart(2,'0')}</div>
                        <div className="bld-sum-txt">{kr}</div>
                      </div>
                    ))}
                    {(dailyAction || dailyPerson || dailyDeadline) && (
                      <div className="bld-sum-anchor">
                        <div className="bld-sum-lbl"><span className="d" />Alltagsanker · Diese Woche</div>
                        <div className="bld-sum-anchor-row">
                          <div><div className="bld-sum-anchor-k">Aktion</div><div className="bld-sum-anchor-v">{dailyAction || '–'}</div></div>
                          <div><div className="bld-sum-anchor-k">Owner</div><div className="bld-sum-anchor-v">{dailyPerson || '–'}</div></div>
                          <div><div className="bld-sum-anchor-k">Bis</div><div className="bld-sum-anchor-v">{dailyDeadline || '–'}</div></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bld-sum-actions">
                  <div className="bld-sum-actions-left">
                    <button className="bld-btn" onClick={copyToClipboard}>
                      {copied ? <><CheckIco />Kopiert!</> : <><CopyIco />Als Text kopieren</>}
                    </button>
                    <button className="bld-btn" onClick={reset}>
                      <ResetIco />Neu starten
                    </button>
                  </div>
                  <button className="bld-btn primary" onClick={saveAndNavigate} style={{ padding: '15px 22px', fontSize: 15 }}>
                    <MonitorIco />
                    Zum Zielemonitor
                    <ArrowRIco />
                  </button>
                </div>
              </>}

            </div>
          </div>

          {/* ── Footer ── */}
          <footer className="bld-footer">
            <div className="bld-nav-back">
              {step === 1 ? (
                <span className="bld-save-status"><span className="sd" />GESPEICHERT · LOKAL</span>
              ) : (
                <button className="bld-btn" onClick={() => setStep(s => s - 1)}>
                  <ArrowLIco />Zurück
                </button>
              )}
            </div>

            <div className="bld-nav-center">
              <span>{String(step).padStart(2,'0')} / 05</span>
              <span className="sep" />
              <span>{meta.label}</span>
              <span className="sep" />
              <span>{meta.time}</span>
            </div>

            <div className="bld-nav-next">
              {/* ── Settings ── */}
              <div className="bld-settings-wrap" onClick={e => e.stopPropagation()}>
                <div className={`bld-settings-panel ${settingsOpen ? 'open' : ''}`}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.16em', color: 'rgba(255,255,255,.38)', textTransform: 'uppercase', marginBottom: 16 }}>
                    Einstellungen
                  </div>

                  {/* Unternehmensname */}
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.16em', color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', marginBottom: 8 }}>
                    Unternehmen
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 5 }}>Name</label>
                    <input
                      type="text"
                      value={bldSettings.companyName}
                      placeholder="z.B. Acme GmbH"
                      onChange={e => updateBldSettings({ companyName: e.target.value })}
                      style={{
                        width: '100%', padding: '7px 10px',
                        background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.14)',
                        borderRadius: 6, color: '#fff', fontFamily: 'Inter,system-ui,sans-serif',
                        fontSize: 13, outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', margin: '12px 0' }} />

                  {/* Farben */}
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.16em', color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', marginBottom: 8 }}>
                    Farben
                  </div>
                  <ColorPicker label="Akzentfarbe" value={bldSettings.accentColor}
                    onChange={v => updateBldSettings({ accentColor: v })} />
                  <ColorPicker label="Schriftfarbe" value={bldSettings.fontColor}
                    onChange={v => updateBldSettings({ fontColor: v })} />

                  <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', margin: '12px 0' }} />

                  <button className="bld-settings-reset" onClick={resetBldSettings}>
                    Auf Standardwerte zurücksetzen
                  </button>
                </div>

                <button
                  className={`bld-fab ${settingsOpen ? 'open' : ''}`}
                  onClick={() => setSettingsOpen(o => !o)}
                  title="Einstellungen"
                >
                  <GearIco />
                </button>
              </div>

              {step < 5 ? (
                <button className="bld-btn primary" onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
                  {meta.next}
                  <ArrowRIco />
                </button>
              ) : (
                <span className="bld-save-status"><span className="sd" />ALLES GESPEICHERT</span>
              )}
            </div>
          </footer>

        </div>
      </div>
    </div>
  )
}

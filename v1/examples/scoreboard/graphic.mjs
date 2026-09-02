/**
 * OGraf Demo — Live Scoreboard
 * Compliant with OGraf Graphics Specification v1
 *
 * Steps: pre-match → live → half-time → full-time
 * Responsive: uses vmin-based sizing, works at any aspect ratio
 *
 * Layout mirrors real broadcast scoreboards:
 *   [crest] FCZ  0 : 0  AJX [crest]
 *   Single horizontal row — compact, always readable.
 */

const STEPS = ['pre-match', 'live', 'half-time', 'second-half', 'full-time'];
const IS_REPOSITORY_DEMO = new URL(import.meta.url).pathname.endsWith(
  '/v1/examples/scoreboard/graphic.mjs'
);
const OGRAF_LOGO_PATH = IS_REPOSITORY_DEMO
  ? '../../../docs/logo/ograf-logo-colour.svg'
  : './assets/ograf-logo-colour.svg';
const OGRAF_LOGO_URL = new URL(OGRAF_LOGO_PATH, import.meta.url).href;

const DEFAULT_STATE = {
  step:      'pre-match',
  homeTeam:  'FC Zürich',
  awayTeam:  'Ajax Amsterdam',
  homeShort: 'FCZ',
  awayShort: 'AJX',
  homeScore: 0,
  awayScore: 0,
  minute:    0,
  seconds:   0,
  homeColor: '#005ca9',
  awayColor: '#d4192c',
};

const CSS = `
  :host {
    display: block;
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    container-type: inline-size;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Keyframes ─────────────────────────────────── */

  @keyframes fadeScale {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1); }
  }

  @keyframes fadeOut {
    from { opacity: 1; transform: scale(1); }
    to   { opacity: 0; transform: scale(0.9); }
  }

  @keyframes pulseLive {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.3; }
  }

  @keyframes scoreFlash {
    0%   { transform: scale(1); color: #fff; }
    25%  { transform: scale(1.35); color: #fbbf24; }
    100% { transform: scale(1); color: #fff; }
  }

  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  @keyframes tickClock {
    from { opacity: 0.4; }
    to   { opacity: 1; }
  }

  /* ── Root container ──────────────────────────────── */

  .sb {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    padding: clamp(12px, 3vmin, 36px);
    font-family: 'Inter', 'Arial', 'Helvetica Neue', sans-serif;
    opacity: 0;
  }

  .sb.is-visible {
    opacity: 1;
  }

  .sb.is-entering {
    animation: fadeScale 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .sb.is-exiting {
    animation: fadeOut 0.35s ease-in both;
  }

  /* ── Board ──────────────────────────────────────── */

  .sb__board {
    position: relative;
    background: linear-gradient(145deg, rgba(12,16,32,0.97) 0%, rgba(18,22,42,0.97) 100%);
    border-radius: clamp(6px, 1.2vmin, 14px);
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow:
      0 4px 40px rgba(0,0,0,0.55),
      0 0 0 1px rgba(255,255,255,0.04) inset,
      0 1px 0 rgba(255,255,255,0.06) inset;
    overflow: hidden;
  }

  /* Top shimmer bar */
  .sb__shimmer {
    height: clamp(2px, 0.35vmin, 3px);
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(99,132,255,0.5) 25%,
      rgba(255,255,255,0.7) 50%,
      rgba(99,132,255,0.5) 75%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: shimmer 20s linear infinite;
  }

  /* ── Header: status only, centered ───────────────── */

  .sb__header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: clamp(4px, 0.8vmin, 10px) clamp(10px, 2vmin, 24px);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .sb__status {
    display: flex;
    align-items: center;
    gap: clamp(3px, 0.6vmin, 7px);
  }

  .sb__status-dot {
    width: clamp(4px, 0.7vmin, 7px);
    height: clamp(4px, 0.7vmin, 7px);
    border-radius: 50%;
    background: #888;
    flex-shrink: 0;
  }

  .sb__status-label {
    font-size: clamp(7px, 1.1vmin, 11px);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
  }

  /* ── Clock — sits between the two scores ─────────── */

  .sb__clock {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(1px, 0.2vmin, 3px);
  }

  .sb__clock-time {
    font-size: clamp(10px, 2vmin, 20px);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: rgba(255,255,255,0.55);
    letter-spacing: 0.06em;
    line-height: 1;
  }

  .sb__clock-sep {
    display: inline;
    margin: 0 1px;
  }

  .sb__clock-tick {
    animation: tickClock 1s steps(1) infinite;
  }

  /* Divider — only visible in pre-match */
  .sb__divider {
    font-size: clamp(14px, 3vmin, 30px);
    font-weight: 300;
    color: rgba(255,255,255,0.2);
    line-height: 1;
  }

  .sb[data-step="pre-match"] .sb__clock { display: none; }

  /* Step-specific clock colours */
  .sb[data-step="live"] .sb__clock-time,
  .sb[data-step="second-half"] .sb__clock-time { color: #ef4444; }
  .sb[data-step="half-time"] .sb__clock-time   { color: #f59e0b; }

  /* Step-specific status styling */
  .sb[data-step="live"] .sb__status-label,
  .sb[data-step="second-half"] .sb__status-label { color: #ef4444; }
  .sb[data-step="live"] .sb__status-dot,
  .sb[data-step="second-half"] .sb__status-dot {
    background: #ef4444;
    animation: pulseLive 1.4s ease-in-out infinite;
  }
  .sb[data-step="half-time"] .sb__status-label { color: #f59e0b; }
  .sb[data-step="half-time"] .sb__status-dot   { background: #f59e0b; }
  .sb[data-step="full-time"] .sb__status-label { color: rgba(255,255,255,0.5); }
  .sb[data-step="full-time"] .sb__status-dot   { background: #22c55e; }

  /* ── Main score row — single horizontal line ─────── */

  .sb__main {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(4px, 0.9vmin, 11px) clamp(10px, 2vmin, 24px);
    gap: clamp(8px, 1.6vmin, 20px);
  }

  /* ── Team side (crest + short code) ──────────────── */

  .sb__team {
    display: flex;
    align-items: center;
    gap: clamp(6px, 1.2vmin, 14px);
    flex-shrink: 0;
  }

  .sb__team--home {
    flex-direction: row;
  }

  .sb__team--away {
    flex-direction: row-reverse;
  }

  .sb__crest {
    width: clamp(22px, 4.2vmin, 44px);
    height: clamp(22px, 4.2vmin, 44px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: clamp(7px, 1.3vmin, 13px);
    color: #fff;
    letter-spacing: 0.02em;
    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    box-shadow:
      0 2px 8px rgba(0,0,0,0.35),
      0 0 0 2px rgba(255,255,255,0.1) inset;
    flex-shrink: 0;
  }

  .sb__team-short {
    font-size: clamp(12px, 2.8vmin, 28px);
    font-weight: 800;
    color: #fff;
    letter-spacing: 0.04em;
    line-height: 1;
    white-space: nowrap;
  }

  /* ── Center score block ────────────────────────── */

  .sb__center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(3px, 0.6vmin, 7px);
    flex-shrink: 0;
  }

  .sb__scores {
    display: flex;
    align-items: center;
    gap: clamp(6px, 1.2vmin, 14px);
  }

  .sb__score {
    font-size: clamp(20px, 4.8vmin, 48px);
    font-weight: 900;
    color: #fff;
    line-height: 1;
    min-width: 1.2ch;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  .sb__score.is-flashing {
    animation: scoreFlash 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .sb__divider {
    font-size: clamp(14px, 3vmin, 30px);
    font-weight: 300;
    color: rgba(255,255,255,0.2);
    line-height: 1;
  }

  /* ── Footer ─────────────────────────────────────── */

  .sb__footer {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: clamp(3px, 0.6vmin, 8px) clamp(10px, 2vmin, 24px);
    border-top: 1px solid rgba(255,255,255,0.06);
    gap: clamp(4px, 0.8vmin, 8px);
  }

  .sb__footer-label {
    font-size: clamp(6px, 0.9vmin, 9px);
    font-weight: 600;
    color: rgba(255,255,255,0.2);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .sb__footer-logo {
    height: clamp(8px, 1.4vmin, 14px);
    width: auto;
    opacity: 0.35;
  }

  /* ── Entry animations (child stagger) ───────────── */

  .sb.is-entering .sb__board  { animation: fadeScale 0.45s cubic-bezier(0.16,1,0.3,1) 0.05s backwards; }
  .sb.is-entering .sb__team   { animation: fadeScale 0.35s cubic-bezier(0.16,1,0.3,1) 0.15s backwards; }
  .sb.is-entering .sb__center { animation: fadeScale 0.35s cubic-bezier(0.16,1,0.3,1) 0.1s  backwards; }
  .sb.is-entering .sb__header { animation: fadeScale 0.3s  cubic-bezier(0.16,1,0.3,1) 0.08s backwards; }
  .sb.is-entering .sb__footer { animation: fadeScale 0.3s  cubic-bezier(0.16,1,0.3,1) 0.2s  backwards; }

  /* ── Step change animation ─────────────────────── */

  .sb__center.is-step-changing {
    animation: fadeScale 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .sb__status.is-step-changing {
    animation: fadeScale 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  /* ── Square / portrait: center horizontally ─────── */

  @media (max-aspect-ratio: 5/4) {
    .sb {
      justify-content: center;
    }
  }
`;

export default class OGrafScoreboard extends HTMLElement {

  constructor() {
    super();
    this._state     = { ...DEFAULT_STATE };
    this._animState = 'hidden';
    this._shadow    = this.attachShadow({ mode: 'open' });
    this._clockTimer = null;
  }

  // ─── OGraf Lifecycle Methods ────────────────────────────────

  async load({ data = {} } = {}) {
    this._state = { ...DEFAULT_STATE, ...data };
    this._buildDOM();
    return { statusCode: 200 };
  }

  async playAction({ skipAnimation = false } = {}) {
    const el = this._shadow.querySelector('.sb');
    if (!el) return { statusCode: 200, currentStep: this._currentStep() };

    el.classList.remove('is-exiting');
    el.classList.add('is-visible');
    this._animState = 'visible';

    if (skipAnimation) {
      el.style.opacity = '1';
    } else {
      el.classList.add('is-entering');
      setTimeout(() => el.classList.remove('is-entering'), 600);
    }

    this._startClock();
    return { statusCode: 200, currentStep: this._currentStep() };
  }

  async stopAction({ skipAnimation = false } = {}) {
    const el = this._shadow.querySelector('.sb');
    if (!el) return { statusCode: 200 };

    this._stopClock();

    if (skipAnimation) {
      el.classList.remove('is-visible', 'is-entering');
      el.style.opacity = '0';
      this._animState = 'hidden';
      this._resetState();
      return { statusCode: 200 };
    }

    el.classList.remove('is-entering');
    el.classList.add('is-exiting');
    this._animState = 'hidden';

    await Promise.race([
      new Promise(r => el.addEventListener('animationend', r, { once: true })),
      new Promise(r => setTimeout(r, 450)),
    ]);

    el.classList.remove('is-visible', 'is-exiting');
    this._resetState();
    return { statusCode: 200 };
  }

  async updateAction({ data = {}, skipAnimation = false } = {}) {
    const oldScore = { home: this._state.homeScore, away: this._state.awayScore };
    const oldStep  = this._state.step;
    this._state = { ...this._state, ...data };

    this._updateDOM();

    if (!skipAnimation) {
      if (this._state.homeScore !== oldScore.home) this._flashScore('home');
      if (this._state.awayScore !== oldScore.away) this._flashScore('away');
      if (this._state.step !== oldStep) this._animateStepChange();
    }

    return { statusCode: 200 };
  }

  /**
   * customAction — advance to the next step
   * id='next-step': cycle pre-match → live → half-time → full-time
   * id='goal-home': increment home score
   * id='goal-away': increment away score
   */
  async customAction({ id, skipAnimation = false } = {}) {
    switch (id) {
      case 'next-step': {
        const idx = STEPS.indexOf(this._state.step);
        const next = STEPS[Math.min(idx + 1, STEPS.length - 1)];
        if (next === 'live')         { this._state.minute = 0;  this._state.seconds = 0; }
        if (next === 'half-time')    { this._state.minute = 45; this._state.seconds = 0; }
        if (next === 'second-half')  { this._state.minute = 45; this._state.seconds = 0; }
        if (next === 'full-time')    { this._state.minute = 90; this._state.seconds = 0; }
        this._state.step = next;
        this._updateDOM();
        if (!skipAnimation) this._animateStepChange();
        if (next === 'live' || next === 'second-half') this._startClock();
        else this._stopClock();
        break;
      }
      case 'goal-home':
        this._state.homeScore++;
        this._updateDOM();
        if (!skipAnimation) this._flashScore('home');
        break;
      case 'goal-away':
        this._state.awayScore++;
        this._updateDOM();
        if (!skipAnimation) this._flashScore('away');
        break;
    }
    return { statusCode: 200, result: this.getState() };
  }

  async dispose() {
    this._stopClock();
    this._shadow.innerHTML = '';
    return { statusCode: 200 };
  }

  _currentStep() {
    return Math.max(0, STEPS.indexOf(this._state.step));
  }

  /** Public read-only accessor for current state (used by host page). */
  getState() {
    return { ...this._state };
  }

  // ─── DOM Helpers ────────────────────────────────────────────

  _buildDOM() {
    const s = this._state;
    this._shadow.innerHTML = `
      <style>${CSS}</style>
      <div class="sb" data-step="${s.step}" aria-live="polite">
        <div class="sb__board">
          <div class="sb__shimmer" aria-hidden="true"></div>

          <div class="sb__header">
            <div class="sb__status">
              <span class="sb__status-dot" aria-hidden="true"></span>
              <span class="sb__status-label">${this._stepLabel(s.step)}</span>
            </div>
          </div>

          <div class="sb__main">
            <div class="sb__team sb__team--home">
              <div class="sb__crest" style="background: ${this._esc(s.homeColor)}">${this._esc(s.homeShort)}</div>
              <span class="sb__team-short sb__team-short--home">${this._esc(s.homeShort)}</span>
            </div>

            <div class="sb__center">
              <div class="sb__scores">
                <span class="sb__score sb__score--home">${s.homeScore}</span>
                <span class="sb__divider">:</span>
                <span class="sb__score sb__score--away">${s.awayScore}</span>
              </div>
              <div class="sb__clock">
                <span class="sb__clock-time">${this._clockText()}</span>
              </div>
            </div>

            <div class="sb__team sb__team--away">
              <div class="sb__crest" style="background: ${this._esc(s.awayColor)}">${this._esc(s.awayShort)}</div>
              <span class="sb__team-short sb__team-short--away">${this._esc(s.awayShort)}</span>
            </div>
          </div>

          <div class="sb__footer">
            <span class="sb__footer-label">Powered by</span>
            <img class="sb__footer-logo" src="${OGRAF_LOGO_URL}" alt="OGraf" aria-hidden="true">
          </div>
        </div>
      </div>
    `;
  }

  _updateDOM() {
    const s  = this._state;
    const el = this._shadow.querySelector('.sb');
    if (!el) return;

    el.dataset.step = s.step;

    const q = (sel) => this._shadow.querySelector(sel);
    q('.sb__team-short--home').textContent = s.homeShort;
    q('.sb__team-short--away').textContent = s.awayShort;
    q('.sb__score--home').textContent = s.homeScore;
    q('.sb__score--away').textContent = s.awayScore;
    q('.sb__status-label').textContent = this._stepLabel(s.step);
    q('.sb__clock-time').innerHTML = this._clockText();

    // Update crests
    const homeC = q('.sb__team--home .sb__crest');
    const awayC = q('.sb__team--away .sb__crest');
    homeC.textContent = s.homeShort;
    homeC.style.background = s.homeColor;
    awayC.textContent = s.awayShort;
    awayC.style.background = s.awayColor;
  }

  _flashScore(side) {
    const el = this._shadow.querySelector(`.sb__score--${side}`);
    if (!el) return;
    el.classList.remove('is-flashing');
    void el.offsetWidth;
    el.classList.add('is-flashing');
    setTimeout(() => el.classList.remove('is-flashing'), 600);
  }

  _animateStepChange() {
    const center = this._shadow.querySelector('.sb__center');
    const status = this._shadow.querySelector('.sb__status');
    [center, status].forEach(el => {
      if (!el) return;
      el.classList.remove('is-step-changing');
      void el.offsetWidth;
      el.classList.add('is-step-changing');
      setTimeout(() => el.classList.remove('is-step-changing'), 400);
    });
  }

  _stepLabel(step) {
    switch (step) {
      case 'pre-match':   return 'Pre-Match';
      case 'live':        return 'Live';
      case 'half-time':   return 'Half-Time';
      case 'second-half': return 'Live';
      case 'full-time':   return 'Full-Time';
      default:           return step;
    }
  }

  _clockText() {
    const s = this._state;
    if (s.step === 'pre-match') return '';
    if (s.step === 'half-time') return '45<span class="sb__clock-sep">:</span>00';
    if (s.step === 'full-time') return '90<span class="sb__clock-sep">:</span>00';
    // 'live' and 'second-half' both show the running clock
    const mm = String(s.minute).padStart(2, '0');
    const ss = String(s.seconds).padStart(2, '0');
    return `${mm}<span class="sb__clock-sep sb__clock-tick">:</span>${ss}`;
  }

  _startClock() {
    this._stopClock();
    if (this._state.step !== 'live' && this._state.step !== 'second-half') return;
    this._clockTimer = setInterval(() => {
      if (this._state.step !== 'live' && this._state.step !== 'second-half') { this._stopClock(); return; }
      this._state.seconds++;
      if (this._state.seconds >= 60) {
        this._state.seconds = 0;
        this._state.minute = Math.min(this._state.minute + 1, 90);
      }
      const clockEl = this._shadow.querySelector('.sb__clock-time');
      if (clockEl) clockEl.innerHTML = this._clockText();
    }, 1000);
  }

  _stopClock() {
    if (this._clockTimer) { clearInterval(this._clockTimer); this._clockTimer = null; }
  }

  _resetState() {
    this._state = {
      ...this._state,
      step: 'pre-match',
      homeScore: 0,
      awayScore: 0,
      minute: 0,
      seconds: 0,
    };
    this._updateDOM();
  }

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

/**
 * OGraf Demo — News Lower Third
 * Compliant with OGraf Graphics Specification v1
 * https://ograf.ebu.io/v1/specification/docs/Specification.html
 */

const DEFAULT_STATE = {
  name:    'Anders Berg',
  title:   'Senior Correspondent',
  channel: 'OGraf News',
};

const CSS = `
  :host {
    display: block;
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    font-family: 'Arial', 'Helvetica Neue', sans-serif;
  }

  /* ── Keyframes ─────────────────────────────────── */

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes lineGrow {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }

  @keyframes livePulse {
    0%, 100% { opacity: 1;   transform: scale(1); }
    50%      { opacity: 0.3; transform: scale(0.7); }
  }

  @keyframes textOut {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(-10px); }
  }

  @keyframes textIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Root wrapper ──────────────────────────────── */

  /* Anchor handles positioning so the inner .l3rd is free to animate
     transforms (slide-in/out) without fighting positional transforms. */
  .l3rd-anchor {
    position: absolute;
    bottom: 88px;
    left: 0;
    will-change: transform;
  }

  .l3rd {
    display: flex;
    flex-direction: column;
    /* Size to content, capped at the host-set visible strip width so
       the top accent line and the dark text rows share the same width
       as the actual content. Anchored at the visible left edge by
       .l3rd-anchor (left:var(--visible-left)). Fallback is the full
       1920px canvas for hosts that don't provide a visible-width. */
    width: fit-content;
    max-width: var(--visible-width, 1920px);
    overflow: hidden;
    will-change: transform;
    filter: drop-shadow(0 6px 28px rgba(0, 0, 0, 0.55));
  }

  /* Allow the flex chain down to the truncatable text to shrink below
     its content's min-content. Without this, default min-width:auto on
     each flex item leaks through and blocks shrinking. */
  .l3rd__body,
  .l3rd__content,
  .l3rd__name-row,
  .l3rd__title-row {
    min-width: 0;
  }

  /* ── Layout: laptop ─────────────────────────────── */
  /* Defaults already work for the slight 16:10 crop (focus-x bias on
     parent ensures left edge stays visible). No overrides needed. */

  /* ── Layout: phone (heavy 9:16 crop of 16:9 source) ───
     The anchor is positioned at the parent's focal point so the LT
     stays inside the visible strip, and the LT's internals scale
     down to fit the narrow viewport. */
  :host([layout="phone"]) .l3rd-anchor {
    left: calc(var(--focus-x, 0.5) * 100%);
    transform: translateX(-50%);
    bottom: 110px;
  }
  :host([layout="phone"]) .l3rd {
    transform-origin: center bottom;
  }
  :host([layout="phone"]) .l3rd__name {
    font-size: 36px;
  }
  :host([layout="phone"]) .l3rd__title {
    font-size: 20px;
  }
  :host([layout="phone"]) .l3rd__name-row,
  :host([layout="phone"]) .l3rd__title-row {
    padding-left: 18px;
    padding-right: 28px;
    gap: 32px;
  }
  :host([layout="phone"]) .l3rd__tag-label,
  :host([layout="phone"]) .l3rd__channel {
    font-size: 13px;
  }

  /* ── Top accent line ──────────────────────────── */

  .l3rd__topline {
    height: 3px;
    background: linear-gradient(90deg, #2352C3 0%, #87A0DE 60%, transparent 100%);
    transform-origin: left center;
    transform: scaleX(0);
  }

  .l3rd.is-animating .l3rd__topline {
    animation: lineGrow 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both;
  }

  /* ── Body (bar + content) ─────────────────────── */

  .l3rd__body {
    display: flex;
    align-items: stretch;
  }

  /* Gradient accent bar */
  .l3rd__bar {
    width: 7px;
    background: linear-gradient(180deg, #1a3d99 0%, #1a3d99 50%, #1a3d99 100%);
    flex-shrink: 0;
  }

  /* Content stack */
  .l3rd__content {
    display: flex;
    flex-direction: column;
  }

  /* ── Name row ─────────────────────────────────── */

  .l3rd__name-row {
    background: rgba(7, 11, 24, 0.94);
    padding: 16px 36px 12px 22px;
    display: flex;
    align-items: center;
    gap: 48px;
    justify-content: space-between;
  }

  .l3rd__name {
    font-size: 46px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 0.01em;
    /* line-height 1.2 keeps room for descenders (g, p, y) which would
       otherwise be cut off by overflow:hidden — Arial descender is
       ~21% of font-size. */
    line-height: 1.2;
    white-space: nowrap;
    opacity: 0;
    /* Hard-clip when too long — no ellipsis, gives one more letter of
       readable text. flex-basis 0 + grow 1: name takes the remaining
       space after the LIVE tag. min-width 0: allow shrinking below
       the nowrap content size. */
    flex: 1 1 0;
    min-width: 0;
    overflow: hidden;
  }

  .l3rd.is-animating .l3rd__name {
    animation: fadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both;
  }

  /* Channel tag */
  .l3rd__tag {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    opacity: 0;
  }

  .l3rd.is-animating .l3rd__tag {
    animation: fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
  }

  .l3rd__tag-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #ef4444;
    flex-shrink: 0;
  }

  .l3rd.is-visible .l3rd__tag-dot {
    animation: livePulse 1.8s ease-in-out 1s infinite;
  }

  .l3rd__tag-label {
    font-size: 15px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.45);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  /* ── Divider ──────────────────────────────────── */

  .l3rd__divider {
    height: 1px;
    background: linear-gradient(90deg, rgba(135,160,222,0.35) 0%, transparent 70%);
    margin: 0 22px;
  }

  /* ── Title row ────────────────────────────────── */

  .l3rd__title-row {
    background: rgba(5, 8, 18, 0.88);
    padding: 10px 36px 16px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 48px;
  }

  .l3rd__title {
    font-size: 24px;
    font-weight: 400;
    color: #87A0DE;
    letter-spacing: 0.04em;
    white-space: nowrap;
    opacity: 0;
    flex: 1 1 0;
    min-width: 0;
    overflow: hidden;
  }

  .l3rd.is-animating .l3rd__title {
    animation: fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.48s both;
  }

  /* Bottom-right channel label */
  .l3rd__channel {
    font-size: 15px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.28);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
    opacity: 0;
    flex-shrink: 0;
  }

  .l3rd.is-animating .l3rd__channel {
    animation: fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both;
  }

  /* ── Exit animations ──────────────────────────── */

  .l3rd__name.is-exiting,
  .l3rd__tag.is-exiting {
    animation: textOut 0.18s ease-in both;
  }

  .l3rd__title.is-exiting,
  .l3rd__channel.is-exiting {
    animation: textOut 0.18s ease-in 0.05s both;
  }

  /* ── Update animations ────────────────────────── */

  .l3rd__name.is-out,
  .l3rd__tag.is-out,
  .l3rd__title.is-out,
  .l3rd__channel.is-out {
    animation: textOut 0.15s ease-in both;
  }

  .l3rd__name.is-in,
  .l3rd__tag.is-in,
  .l3rd__title.is-in,
  .l3rd__channel.is-in {
    animation: textIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
`;

export default class OGrafLowerThird extends HTMLElement {

  constructor() {
    super();
    this._state      = { ...DEFAULT_STATE };
    this._animState  = 'hidden';   // hidden | visible
    this._shadow     = this.attachShadow({ mode: 'open' });
  }

  // ─── OGraf Lifecycle Methods ────────────────────────────────

  /**
   * load() — Called by the control system before any actions.
   * Initialises the graphic with data and renders it (hidden).
   */
  async load(data = {}, renderType, renderCharacteristics) {
    this._state = { ...DEFAULT_STATE, ...data };
    this._buildDOM();
    return { status: 0 };
  }

  /**
   * playAction() — Animate the graphic in.
   * Returns a Promise that resolves when the graphic is ready
   * for the next action (resolves immediately for broadcast use).
   */
  async playAction(delta, goto, skipAnimation) {
    const el = this._shadow.querySelector('.l3rd');
    if (!el) return { status: 0 };

    // Hard-reset any leftover WAAPI animations from prior cycles —
    // see stage-version comment for the gory details.
    el.getAnimations().forEach(a => a.cancel());
    el.style.transform = 'translateX(-150%)';

    el.classList.add('is-animating');
    this._animState = 'visible';

    if (skipAnimation) {
      el.style.transform = 'translateX(0)';
      el.querySelectorAll('.l3rd__name, .l3rd__tag, .l3rd__title, .l3rd__channel, .l3rd__topline')
        .forEach(n => { n.style.animation = 'none'; n.style.opacity = '1'; });
    } else {
      // Use WAAPI — CSS transitions are unreliable in Shadow DOM
      const anim = el.animate(
        [{ transform: 'translateX(-150%)' }, { transform: 'translateX(0)' }],
        { duration: 600, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
      );
      anim.finished
        .then(() => { el.style.transform = 'translateX(0)'; anim.cancel(); })
        .catch(() => { /* canceled by a subsequent stop/play */ });
    }

    return { status: 0 };
  }

  /**
   * stopAction() — Animate the graphic out.
   * Phase 1: text elements fade up and out.
   * Phase 2: container slides off to the left.
   */
  async stopAction(skipAnimation) {
    const el = this._shadow.querySelector('.l3rd');
    if (!el) return { status: 0 };

    if (skipAnimation) {
      el.getAnimations().forEach(a => a.cancel());
      el.style.transition = 'none';
      el.style.transform = 'translateX(-150%)';
      el.classList.remove('is-animating');
      this._animState = 'hidden';
      return { status: 0 };
    }

    el.getAnimations().forEach(a => a.cancel());
    el.style.transform = 'translateX(0)';

    // Phase 1 — text out
    const textEls = [...el.querySelectorAll('.l3rd__name, .l3rd__tag, .l3rd__title, .l3rd__channel')];
    textEls.forEach(t => t.classList.add('is-exiting'));

    await new Promise(r => setTimeout(r, 240));

    // Phase 2 — container slides out via WAAPI (CSS transitions unreliable in Shadow DOM)
    el.classList.remove('is-animating');
    this._animState = 'hidden';
    const slideOut = el.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-150%)' }],
      { duration: 400, easing: 'cubic-bezier(0.55, 0, 1, 0.45)', fill: 'forwards' }
    );
    try {
      await Promise.race([ slideOut.finished, new Promise(r => setTimeout(r, 500)) ]);
    } catch (_) {
      // Animation canceled by a subsequent play/stop — caller is in charge.
      return { status: 0 };
    }
    // Lock offscreen position AND release the forward-fill effect, otherwise
    // it can leak through and snap a subsequent slide-in back to -150%.
    el.style.transform = 'translateX(-150%)';
    slideOut.cancel();
    return { status: 0 };
  }

  /**
   * updateAction() — Update graphic data without reloading.
   * Animates text out, swaps content, animates back in.
   */
  async updateAction(data = {}, skipAnimation) {
    this._state = { ...this._state, ...data };

    if (skipAnimation) {
      this._updateDOM();
      return { status: 0 };
    }

    const textEls = [...this._shadow.querySelectorAll('.l3rd__name, .l3rd__tag, .l3rd__title, .l3rd__channel')];

    // Phase 1 — text out
    textEls.forEach(el => { el.classList.remove('is-in'); el.classList.add('is-out'); });
    await new Promise(r => setTimeout(r, 180));

    // Swap content
    this._updateDOM();

    // Phase 2 — text in
    textEls.forEach(el => { el.classList.remove('is-out'); el.classList.add('is-in'); });
    setTimeout(() => textEls.forEach(el => el.classList.remove('is-in')), 350);

    return { status: 0 };
  }

  /**
   * customAction() — Handle vendor-specific actions (none defined).
   */
  async customAction(id, payload, skipAnimation) {
    return { status: 0 };
  }

  /**
   * dispose() — Clean up when the graphic is removed.
   */
  async dispose() {
    this._shadow.innerHTML = '';
    return { status: 0 };
  }

  // ─── DOM Helpers ────────────────────────────────────────────

  _buildDOM() {
    this._shadow.innerHTML = `
      <style>${CSS}</style>
      <div class="l3rd-anchor">
        <div class="l3rd" style="transform: translateX(-150%)" aria-live="polite">

          <div class="l3rd__topline" aria-hidden="true"></div>

          <div class="l3rd__body">
            <div class="l3rd__bar" aria-hidden="true"></div>
            <div class="l3rd__content">

              <div class="l3rd__name-row">
                <span class="l3rd__name">${this._esc(this._state.name)}</span>
                <div class="l3rd__tag" aria-label="Live">
                  <div class="l3rd__tag-dot" aria-hidden="true"></div>
                  <span class="l3rd__tag-label">Live</span>
                </div>
              </div>

              <div class="l3rd__divider" aria-hidden="true"></div>

              <div class="l3rd__title-row">
                <span class="l3rd__title">${this._esc(this._state.title)}</span>
                <span class="l3rd__channel">${this._esc(this._state.channel)}</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    `;
  }

  _updateDOM() {
    const nameEl    = this._shadow.querySelector('.l3rd__name');
    const titleEl   = this._shadow.querySelector('.l3rd__title');
    const channelEl = this._shadow.querySelector('.l3rd__channel');
    if (nameEl)    nameEl.textContent    = this._state.name;
    if (titleEl)   titleEl.textContent   = this._state.title;
    if (channelEl) channelEl.textContent = this._state.channel;
  }

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

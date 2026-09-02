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
     transforms (slide-in/out) without fighting positional transforms.
     The --visible-left custom property is set by the host page in
     canvas-pixel units when the graphic is embedded inside a viewport-
     cropped wrapper (e.g. the multi-device stage). For full-canvas
     hosts (broadcast output, standalone TV embed) the default 0 is
     correct. */
  .l3rd-anchor {
    position: absolute;
    bottom: 88px;
    left: var(--visible-left, 0);
    will-change: transform;
  }

  .l3rd {
    display: flex;
    flex-direction: column;
    /* Size to content, but never wider than the visible strip — so the
       top accent line, the dark name-row background, and the title-row
       all share the same width as the actual text content. Anchored
       at the visible left edge by .l3rd-anchor's left:var(--visible-left).
       Fallback is the full broadcast canvas (1920px) for full-canvas
       hosts where no visible-width is provided. */
    width: fit-content;
    max-width: var(--visible-width, 1920px);
    overflow: hidden;
    will-change: transform;
    filter: drop-shadow(0 6px 28px rgba(0, 0, 0, 0.55));
  }

  /* Allow every flex container/item along the chain from .l3rd down to
     the truncatable text to shrink below its content's min-content
     width. Without this, the default min-width:auto on each flex
     item leaks through and prevents the chain from shrinking, even
     when the outer .l3rd is capped. */
  .l3rd__body,
  .l3rd__content,
  .l3rd__name-row,
  .l3rd__title-row {
    min-width: 0;
  }

  /* ── Layout: laptop ─────────────────────────────── */
  /* Defaults already work for the slight 16:10 crop. */

  /* ── Layout: tablet (3:4 crop of 16:9 source) ────
     Anchor at the visible left edge — same as default, just with the
     bottom offset tightened for the portrait crop. The default rule
     already reads --visible-left so we only need to shift bottom. */
  :host([layout="tablet"]) .l3rd-anchor {
    bottom: 100px;
  }
  :host([layout="tablet"]) .l3rd__name  { font-size: 60px; }
  :host([layout="tablet"]) .l3rd__title { font-size: 32px; }
  :host([layout="tablet"]) .l3rd__name-row {
    padding: 32px 44px 22px 28px;
    gap: 56px;
  }
  :host([layout="tablet"]) .l3rd__title-row {
    padding: 20px 44px 32px 28px;
    gap: 56px;
  }
  :host([layout="tablet"]) .l3rd__tag-label,
  :host([layout="tablet"]) .l3rd__channel { font-size: 20px; }

  /* ── Layout: phone (heavy 9:16 crop of 16:9 source) ───
     Anchor at the visible left edge (inherited from the default rule
     via --visible-left), with phone-specific bottom offset and the
     LT's internals scaled down to fit the narrow viewport. */
  :host([layout="phone"]) .l3rd-anchor {
    bottom: 130px;
  }
  :host([layout="phone"]) .l3rd__name {
    font-size: 44px;
  }
  :host([layout="phone"]) .l3rd__title {
    font-size: 24px;
  }
  :host([layout="phone"]) .l3rd__name-row {
    padding: 24px 32px 18px 22px;
    gap: 32px;
  }
  :host([layout="phone"]) .l3rd__title-row {
    padding: 14px 32px 24px 22px;
    gap: 32px;
  }
  :host([layout="phone"]) .l3rd__tag-label,
  :host([layout="phone"]) .l3rd__channel {
    font-size: 16px;
  }
  :host([layout="phone"]) .l3rd__divider {
    margin: 0 22px;
  }
  :host([layout="phone"]) .l3rd__bar {
    width: 8px;
  }

  /* ── Top accent line ──────────────────────────── */

  .l3rd__topline {
    height: 6px;
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
    width: 11px;
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
    padding: 40px 54px 30px 33px;
    display: flex;
    align-items: center;
    gap: 72px;
    justify-content: space-between;
  }

  .l3rd__name {
    font-size: 70px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 0.01em;
    /* line-height 1.2 gives the line-box enough vertical room for
       descenders (g, p, y...) which otherwise get clipped by the
       overflow:hidden below. Arial descender depth is ~21% of font-
       size, so anything under ~1.15 will eat the bottom of the g. */
    line-height: 1.2;
    white-space: nowrap;
    opacity: 0;
    /* Hard-clip horizontally when the name is too long for its slot —
       no ellipsis, so the user sees one more letter instead of "…".
       flex-basis 0 distributes the remaining space (after the LIVE
       tag) entirely to the name; min-width 0 lets it shrink below the
       nowrap content size the default min-width:auto would otherwise
       pin it to. */
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
    gap: 12px;
    flex-shrink: 0;
    opacity: 0;
  }

  .l3rd.is-animating .l3rd__tag {
    animation: fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
  }

  .l3rd__tag-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #ef4444;
    flex-shrink: 0;
  }

  .l3rd.is-visible .l3rd__tag-dot {
    animation: livePulse 1.8s ease-in-out 1s infinite;
  }

  .l3rd__tag-label {
    font-size: 22px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.45);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  /* ── Divider ──────────────────────────────────── */

  .l3rd__divider {
    height: 2px;
    background: linear-gradient(90deg, rgba(135,160,222,0.35) 0%, transparent 70%);
    margin: 0 33px;
  }

  /* ── Title row ────────────────────────────────── */

  .l3rd__title-row {
    background: rgba(5, 8, 18, 0.88);
    padding: 25px 54px 40px 33px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 72px;
  }

  .l3rd__title {
    font-size: 36px;
    font-weight: 400;
    color: #87A0DE;
    letter-spacing: 0.04em;
    white-space: nowrap;
    opacity: 0;
    /* Same hard-clip rule as .l3rd__name — title shrinks first, the
       channel label keeps its natural width. */
    flex: 1 1 0;
    min-width: 0;
    overflow: hidden;
  }

  .l3rd.is-animating .l3rd__title {
    animation: fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.48s both;
  }

  /* Bottom-right channel label */
  .l3rd__channel {
    font-size: 22px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.28);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
    opacity: 0;
    flex-shrink: 0;   /* keep full width — title is the shrinker */
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
  async load({ data = {} } = {}) {
    this._state = { ...DEFAULT_STATE, ...data };
    this._buildDOM();
    return { statusCode: 200 };
  }

  /**
   * playAction() — Animate the graphic in.
   * Returns a Promise that resolves when the graphic is ready
   * for the next action (resolves immediately for broadcast use).
   */
  async playAction({ skipAnimation = false } = {}) {
    const el = this._shadow.querySelector('.l3rd');
    if (!el) return { statusCode: 200, currentStep: 0 };

    // Hard-reset: cancel any leftover WAAPI animations from prior
    // play/stop cycles. Without this, a previous slide-out's
    // `fill: forwards` effect keeps applying translateX(-150%) and
    // re-takes the element the moment our new slide-in cancels itself
    // on completion — looking like the LT vanishes right after sliding in.
    el.getAnimations().forEach(a => a.cancel());
    el.style.transform = 'translateX(-150%)';   // anchor at off-screen start

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
        .catch(() => { /* canceled by a subsequent stop/play — nothing to do */ });
    }

    return { statusCode: 200, currentStep: 0 };
  }

  /**
   * stopAction() — Animate the graphic out.
   * Phase 1: text elements fade up and out.
   * Phase 2: container slides off to the left.
   */
  async stopAction({ skipAnimation = false } = {}) {
    const el = this._shadow.querySelector('.l3rd');
    if (!el) return { statusCode: 200 };

    if (skipAnimation) {
      el.getAnimations().forEach(a => a.cancel());
      el.style.transition = 'none';
      el.style.transform = 'translateX(-150%)';
      el.classList.remove('is-animating');
      this._animState = 'hidden';
      return { statusCode: 200 };
    }

    // Hard-reset prior WAAPI animations (mirrors playAction). Without
    // this, an in-flight slide-in's forward-fill can compete with the
    // upcoming slide-out and produce a visible jump.
    el.getAnimations().forEach(a => a.cancel());
    el.style.transform = 'translateX(0)';   // anchor at on-screen start

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
    // Safety timeout: if WAAPI doesn't resolve (e.g. suspended timeline), still complete.
    // Wrapped in try/catch so that if a subsequent playAction cancels
    // slideOut mid-flight, we exit cleanly without rejecting.
    try {
      await Promise.race([ slideOut.finished, new Promise(r => setTimeout(r, 500)) ]);
    } catch (_) {
      // slideOut was canceled — a new play/stop has taken over. Don't
      // touch transform here; whoever's running now is in charge.
      return { statusCode: 200 };
    }
    // Lock the offscreen position with inline style AND release the
    // animation's forward-fill effect — otherwise the fill keeps
    // pinning the element at -150% across the next playAction's
    // lifecycle and snaps it back the moment that animation ends.
    el.style.transform = 'translateX(-150%)';
    slideOut.cancel();
    return { statusCode: 200 };
  }

  /**
   * updateAction() — Update graphic data without reloading.
   * Animates text out, swaps content, animates back in.
   */
  async updateAction({ data = {}, skipAnimation = false } = {}) {
    this._state = { ...this._state, ...data };

    if (skipAnimation) {
      this._updateDOM();
      return { statusCode: 200 };
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

    return { statusCode: 200 };
  }

  /**
   * customAction() — Handle vendor-specific actions (none defined).
   */
  async customAction() {
    return { statusCode: 400, statusMessage: 'No custom actions supported' };
  }

  /**
   * dispose() — Clean up when the graphic is removed.
   */
  async dispose() {
    this._shadow.innerHTML = '';
    return { statusCode: 200 };
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

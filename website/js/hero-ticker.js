/* -----------------------------------------------------------
   HERO TICKER - diagonal reel of OGraf templates
   Vanilla JS - no dependencies. Loads after the DOM.
   Drops a diagonal ticker behind the existing .section-hero,
   leaves all other markup untouched.
----------------------------------------------------------- */
(function () {
  'use strict';

  // -- Card data - matches the demo slugs in #demos ------------
  const TEMPLATES = [
    {
      slug: 'lower-third',
      label: 'Lower Third',
      accent: '#10B981',
      html: `
        <div class="htk-tpl htk--lt">
          <span class="htk-lt__bug"><i></i>LIVE</span>
          <div class="htk-lt__bar">
            <div class="htk-lt__name">Anders Berg</div>
            <div class="htk-lt__role">Senior Correspondent</div>
          </div>
        </div>`,
    },
    {
      slug: 'scoreboard',
      label: 'Scoreboard',
      accent: '#2352C3',
      html: `
        <div class="htk-tpl htk--sb">
          <div class="htk-sb__panel">
            <div class="htk-sb__row">
              <span class="htk-sb__crest" style="background:#2352C3">F</span>
              <span class="htk-sb__team">FCZ</span>
              <span class="htk-sb__score">2</span>
            </div>
            <div class="htk-sb__row">
              <span class="htk-sb__crest" style="background:#F43F5E">A</span>
              <span class="htk-sb__team">AJX</span>
              <span class="htk-sb__score">1</span>
            </div>
          </div>
          <div class="htk-sb__time">67'</div>
        </div>`,
    },
    {
      slug: 'breaking',
      label: 'Breaking News',
      accent: '#F43F5E',
      html: `
        <div class="htk-tpl htk--brk">
          <div class="htk-brk__bar">
            <span class="htk-brk__chip">BREAKING</span>
            <span class="htk-brk__text">EU REACHES CLIMATE DEAL</span>
          </div>
        </div>`,
    },
    {
      slug: 'weather',
      label: 'Weather',
      accent: '#F59E0B',
      html: `
        <div class="htk-tpl htk--wx">
          <div class="htk-wx__sun"></div>
          <div class="htk-wx__city">GENEVA</div>
          <div class="htk-wx__temp">22&deg;</div>
          <div class="htk-wx__cond">Sunny</div>
        </div>`,
    },
    {
      slug: 'election',
      label: 'Election Live',
      accent: '#87A0DE',
      html: `
        <div class="htk-tpl htk--el">
          <div class="htk-el__head">RESULTS - LIVE</div>
          <div class="htk-el__row">
            <span class="htk-el__name">Greens</span>
            <span class="htk-el__bar"><i style="width:67%;background:#10B981"></i></span>
            <span class="htk-el__pct">28%</span>
          </div>
          <div class="htk-el__row">
            <span class="htk-el__name">Liberals</span>
            <span class="htk-el__bar"><i style="width:58%;background:#F59E0B"></i></span>
            <span class="htk-el__pct">24%</span>
          </div>
          <div class="htk-el__row">
            <span class="htk-el__name">Soc Dem</span>
            <span class="htk-el__bar"><i style="width:46%;background:#F43F5E"></i></span>
            <span class="htk-el__pct">19%</span>
          </div>
          <div class="htk-el__row">
            <span class="htk-el__name">Centre</span>
            <span class="htk-el__bar"><i style="width:34%;background:#87A0DE"></i></span>
            <span class="htk-el__pct">14%</span>
          </div>
        </div>`,
    },
    {
      slug: 'stocks',
      label: 'Markets - FX',
      accent: '#10B981',
      html: `
        <div class="htk-tpl htk--stk">
          <div class="htk-stk__head">
            <span class="htk-stk__sym">EURX</span>
            <span class="htk-stk__price">1.0842</span>
            <span class="htk-stk__delta">+0.42%</span>
          </div>
          <svg class="htk-stk__chart" viewBox="0 0 90 24" preserveAspectRatio="none">
            <polyline fill="rgba(16,185,129,0.18)" stroke="none"
              points="0,24 4,12 12,8 18,14 22,10 30,16 38,8 46,14 54,6 62,12 70,4 78,10 86,2 90,8 90,24"/>
            <polyline fill="none" stroke="#10B981" stroke-width="1.2"
              points="4,12 12,8 18,14 22,10 30,16 38,8 46,14 54,6 62,12 70,4 78,10 86,2"/>
          </svg>
          <div class="htk-stk__bar">FX - LIVE FRANKFURT</div>
        </div>`,
    },
    {
      slug: 'channel-bug',
      label: 'Channel Bug',
      accent: '#87A0DE',
      html: `
        <div class="htk-tpl htk--bug">
          <div class="htk-bug__logo"><span style="color:#87A0DE">O</span><span>graf</span></div>
          <div class="htk-bug__sub">NEWS - 24</div>
          <div class="htk-bug__clock">21:47</div>
        </div>`,
    },
    {
      slug: 'stat-callout',
      label: 'Stat Callout',
      accent: '#2352C3',
      html: `
        <div class="htk-tpl htk--stat">
          <div class="htk-stat__eyebrow">DATA - ECONOMY</div>
          <div class="htk-stat__value">&euro;8.4B</div>
          <div class="htk-stat__label">Renewable investment 2025</div>
        </div>`,
    },
    {
      slug: 'leaderboard',
      label: 'F1 Leaderboard',
      accent: '#F59E0B',
      html: `
        <div class="htk-tpl htk--lb">
          <div class="htk-lb__head">F1 - LAP 38/52</div>
          <div class="htk-lb__row"><span class="htk-lb__pos">1</span><span class="htk-lb__bar" style="background:#0600EF"></span><span class="htk-lb__code">VER</span><span class="htk-lb__time">LEADER</span></div>
          <div class="htk-lb__row"><span class="htk-lb__pos">2</span><span class="htk-lb__bar" style="background:#00D7B6"></span><span class="htk-lb__code">HAM</span><span class="htk-lb__time">+ 4.211</span></div>
          <div class="htk-lb__row"><span class="htk-lb__pos">3</span><span class="htk-lb__bar" style="background:#E8002D"></span><span class="htk-lb__code">LEC</span><span class="htk-lb__time">+ 9.734</span></div>
          <div class="htk-lb__row"><span class="htk-lb__pos">4</span><span class="htk-lb__bar" style="background:#FF8000"></span><span class="htk-lb__code">NOR</span><span class="htk-lb__time">+12.012</span></div>
        </div>`,
    },
    {
      slug: 'title-card',
      label: 'Title Card',
      accent: '#F43F5E',
      html: `
        <div class="htk-tpl htk--ttl">
          <div class="htk-ttl__kicker">EPISODE 04</div>
          <div class="htk-ttl__title">INSIDE THE STUDIO</div>
          <div class="htk-ttl__rule"></div>
        </div>`,
    },
    {
      slug: 'countdown',
      label: 'Countdown',
      accent: '#2352C3',
      html: `
        <div class="htk-tpl htk--cd">
          <div class="htk-cd__label">ON AIR IN</div>
          <div class="htk-cd__time">
            <span>00</span><em>:</em><span>04</span><em>:</em><span>23</span>
          </div>
          <div class="htk-cd__sub">EUROVISION - SEMI-FINAL 1</div>
        </div>`,
    },
    {
      slug: 'quote',
      label: 'Quote Card',
      accent: '#87A0DE',
      html: `
        <div class="htk-tpl htk--qt">
          <div class="htk-qt__mark">&ldquo;</div>
          <div class="htk-qt__text">Open standards already won the web. Now broadcast.</div>
          <div class="htk-qt__by">- Klaus Weber, EBU</div>
        </div>`,
    },
  ];

  // -- Helpers ----------------------------------------------
  function cardHtml(t) {
    return `
      <a class="htk-card" href="#demos" data-slug="${t.slug}" style="--htk-accent:${t.accent}">
        <div class="htk-card__head">
          <span class="htk-card__dot"></span>
          <span class="htk-card__tag">${t.label}</span>
          <span class="htk-card__type">graphic.mjs</span>
        </div>
        <div class="htk-card__frame">${t.html}</div>
      </a>`;
  }

  // Each row holds COPIES copies of the deck. The keyframes translate by
  // exactly one deck width (1 / COPIES of total) so the loop is seamless.
  // 4 copies covers very wide viewports without leaving an empty edge.
  const COPIES = 4;

  function row(items, dir, durationSec) {
    const inner = Array(COPIES).fill(items).flat().map(cardHtml).join('');
    const cls = dir === 'right' ? 'htk-row htk-row--right' : 'htk-row htk-row--left';
    const style = durationSec ? ` style="animation-duration: ${durationSec}s"` : '';
    return `<div class="${cls}"${style}>${inner}</div>`;
  }

  // -- Mount ------------------------------------------------
  function mount() {
    const hero = document.querySelector('.section-hero');
    if (!hero) return;
    if (hero.querySelector('.hero-ticker')) return; // already mounted

    // Build three rows with offset orders for visual variety
    const a = TEMPLATES;
    const b = [...TEMPLATES].reverse();
    const c = TEMPLATES.slice(4).concat(TEMPLATES.slice(0, 4));

    const wrap = document.createElement('div');
    wrap.className = 'hero-ticker';
    wrap.setAttribute('aria-hidden', 'true');
    // Three different speeds - 95s is the fastest (matches the original
     // tempo); others are progressively slower for parallax-like variety.
    wrap.innerHTML = `
      <div class="hero-ticker__diag">
        ${row(a, 'right', 95)}
        ${row(b, 'right', 135)}
        ${row(c, 'right', 175)}
      </div>
    `;

    const veil = document.createElement('div');
    veil.className = 'hero-ticker__veil';

    // Insert as the first children so existing ::before glow stays underneath
    // and existing ::after vignette + .hero__inner stay above.
    hero.insertBefore(veil, hero.firstChild);
    hero.insertBefore(wrap, hero.firstChild);

    // Click on a card -> smooth-scroll to #demos.
    wrap.addEventListener('click', (e) => {
      const card = e.target.closest('.htk-card');
      if (!card) return;
      e.preventDefault();
      const target = document.getElementById('demos');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Hover-pause is intentionally disabled - the CSS animations on the
    // rows just keep running. Faster, lighter, and avoids any visual
    // hitch from per-frame JS transform updates.
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

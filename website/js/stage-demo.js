/*
 * Multi-device stage demo
 * -------------------------------------------------------------
 * Drives the three <ograf-lower-third> instances inside the stage
 * composition (TV, Tablet, Phone). Each instance lives in a
 * 1920x1080 logical "broadcast canvas" wrapper (the same dimensions
 * OGraf graphics are designed against) which we CSS-scale to fill
 * each device's visible screen - so the LT renders at its native
 * pixel sizes (60px headers etc.) and stays proportionally identical
 * across all three devices.
 *
 * The LT is the OGraf graphic. Everything else on each screen - the
 * background video, the dark scrim, the device frame - is demo
 * dressing to give the graphic a realistic context. None of that is
 * part of the OGraf spec or template.
 *
 * Architecture (post-iframe migration):
 *   <div .stage-device__screen data-focus-x>
 *     <video .stage-device__bg-video>            <- demo content
 *     <div   .stage-device__bg-overlay>          <- demo content
 *     <div   .stage-device__canvas>              <- 1920x1080, JS-scaled
 *       <ograf-lower-third>                      <- the actual OGraf graphic
 *
 * We talk to the graphic via direct method calls on the custom
 * element (load / playAction / stopAction / updateAction), not via
 * postMessage - there's no iframe boundary anymore.
 */
(function () {
  const screens = [...document.querySelectorAll('.stage-device__screen')];
  const lts     = [...document.querySelectorAll('ograf-lower-third.stage-device__graphic')];
  const backgroundVideos = [...document.querySelectorAll('.stage-device__bg-video')];
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!lts.length) return;

  function syncBackgroundVideos() {
    backgroundVideos.forEach(video => {
      if (motionQuery.matches) {
        video.pause();
        try {
          video.currentTime = 0;
        } catch (_) {
          /* The video has not loaded enough metadata to seek yet. */
        }
      } else {
        video.play().catch(() => {
          /* Muted video playback can still be blocked by host policy. */
        });
      }
    });
  }

  syncBackgroundVideos();
  motionQuery.addEventListener('change', syncBackgroundVideos);

  // -- Form / control elements -------------------------------
  const btnToggle = document.getElementById('stage-toggle');
  const btnLabel  = btnToggle ? btnToggle.querySelector('.stage-btn__label') : null;
  const nameIn    = document.getElementById('stage-name');
  const titleIn   = document.getElementById('stage-title');
  const channelIn = document.getElementById('stage-channel');
  const sync      = document.getElementById('stage-sync');
  const syncStatus = sync ? sync.querySelector('.stage__sync-status') : null;
  const syncDetail = sync ? sync.querySelector('.stage__sync-detail') : null;
  let isPlaying   = false;

  // -- Broadcast canvas resolution ---------------------------
  const CANVAS = { w: 1920, h: 1080 };

  function setSync(state, status, detail = 'All devices') {
    if (!sync) return;
    sync.dataset.state = state;
    if (syncStatus) syncStatus.textContent = status;
    if (syncDetail) syncDetail.textContent = detail;
  }

  function setToggleState(playing) {
    isPlaying = playing;
    if (!btnToggle) return;
    btnToggle.classList.toggle('is-playing', playing);
    if (btnLabel) btnLabel.textContent = playing ? 'Stop' : 'Play In';
  }

  function ltData() {
    return {
      name:    (nameIn.value    || 'Anders Berg').trim(),
      title:   (titleIn.value   || 'Senior Correspondent').trim(),
      channel: (channelIn.value || 'OGraf News').trim(),
    };
  }

  // -- Per-device focus point --------------------------------
  // Each screen carries data-focus-x="0..1" indicating which point
  // of the 16:9 source video should land at the centre of the
  // visible (potentially-cropped) screen. CSS declares the matching
  // `--focus-x` custom property for the demo video/object-position;
  // JS reads dataset.focusX directly for the canvas-position math.

  // -- Canvas scaling ----------------------------------------
  // For each screen, scale the 1920x1080 canvas so it FILLS the
  // visible area (cover, not contain - slight overflow is clipped
  // by the screen's overflow:hidden). Then position it so that
  // (focus-x x 1920, 0.5 x 1080) lands at the screen's centre, so
  // narrow crops (e.g. 9:16 phone over a 16:9 source) keep the
  // subject and the LT inside the visible window.
  function scaleCanvas(screen) {
    const canvas = screen.querySelector('.stage-device__canvas');
    const lt     = screen.querySelector('ograf-lower-third');
    if (!canvas) return;
    const sw = screen.clientWidth;
    const sh = screen.clientHeight;
    const s  = Math.max(sw / CANVAS.w, sh / CANVAS.h);
    if (!(s > 0) || !isFinite(s)) return;
    const fx = parseFloat(screen.dataset.focusX) || 0.5;
    const fy = 0.5;

    // Snap the canvas wrapper's screen position to an integer pixel.
    // Float values (e.g. -94.122) introduce subpixel rendering drift
    // that scales differently per device (heavier on phones with
    // small scale, lighter on tablets), causing inconsistent gap/clip
    // results on the visible left edge. The cost of rounding is a
    // focal-point off-centering of up to half a screen pixel - visually
    // imperceptible.
    const X = Math.round(sw / 2 - fx * CANVAS.w * s);
    const Y = Math.round(sh / 2 - fy * CANVAS.h * s);
    canvas.style.left      = X + 'px';
    canvas.style.top       = Y + 'px';
    canvas.style.transform = `scale(${s})`;

    if (lt) {
      // Derive visible-left from the rounded X so that
      //   screen_x = X + visible_left * s
      // resolves to exactly 0 (canvas-edge math is float-symbolic;
      // a single multiplication can't introduce drift). The LT thus
      // lands precisely at the visible left edge on every device, no
      // bias or hand-tuning needed.
      const visibleWidth = sw / s;
      let visibleLeft    = -X / s;
      visibleLeft        = Math.max(0, Math.min(CANVAS.w - visibleWidth, visibleLeft));
      lt.style.setProperty('--visible-left',  visibleLeft  + 'px');
      lt.style.setProperty('--visible-width', visibleWidth + 'px');
    }
  }
  function scaleAll() { screens.forEach(scaleCanvas); }
  scaleAll();
  window.addEventListener('resize', scaleAll);
  if (window.ResizeObserver) {
    screens.forEach(s => new ResizeObserver(() => scaleCanvas(s)).observe(s));
  }

  // -- Custom-element lifecycle ------------------------------
  // graphic.mjs is loaded as `type="module"` (deferred), so it
  // registers <ograf-lower-third> after this script has finished
  // running. We wait for the upgrade and then call OGraf's
  // load() lifecycle method on every instance to build their
  // internal DOM into a hidden initial state - so the very first
  // play() animates instantly without a "first build" stutter.
  customElements.whenDefined('ograf-lower-third').then(async () => {
    await Promise.all(lts.map(el => el.load(ltData())));
    if (btnToggle) btnToggle.disabled = false;
    setSync('ready', 'Ready');
  });

  // -- Toggle button -----------------------------------------
  if (btnToggle) {
    btnToggle.addEventListener('click', async () => {
      if (isPlaying) {
        // Optimistic UI update - animation runs after.
        setToggleState(false);
        setSync('ready', 'Ready');
        await Promise.all(lts.map(el => el.stopAction(false)));
      } else {
        const data = ltData();
        // Apply latest input data silently before the in-animation,
        // so the LT slides in showing the current form values rather
        // than whatever was loaded last.
        await Promise.all(lts.map(el => el.updateAction(data, true)));
        setToggleState(true);
        setSync('live', 'On Air');
        await Promise.all(lts.map(el => el.playAction(null, null, false)));
      }
    });
  }

  // -- Live update on input ----------------------------------
  // updateAction is a no-op when the LT is hidden (silently swaps
  // internal state) and animates the text out/in when on-air -
  // works in every state without gating.
  [nameIn, titleIn, channelIn].forEach(input => {
    input.addEventListener('input', () => {
      const data = ltData();
      lts.forEach(el => el.updateAction(data));
    });
  });

  // -- Auto-play on first scroll into the section ------------
  // The whole point of the section is to *show* the LT running on
  // every device. If the user never clicks Play they just see the
  // muted backgrounds, so we trigger Play once on their behalf when
  // the section enters the viewport.
  //
  // Skipped when:
  //   - user prefers reduced motion
  //   - user has already interacted with the toggle
  //   - we already auto-played once (one-shot per page load)
  const section = document.querySelector('.section-stage');
  if (section && 'IntersectionObserver' in window) {
    let autoPlayed     = false;
    let userInteracted = false;
    let io             = null;
    let autoPlayTimer  = null;

    const stopAutoPlayTracking = () => {
      if (io) io.disconnect();
      io = null;
      window.clearTimeout(autoPlayTimer);
      autoPlayTimer = null;
    };

    if (btnToggle) {
      btnToggle.addEventListener('click', () => {
        userInteracted = true;
        stopAutoPlayTracking();
      }, { once: true });
    }

    const tryAutoPlay = async () => {
      autoPlayTimer = null;
      if (autoPlayed || userInteracted || motionQuery.matches) return;
      autoPlayed = true;
      stopAutoPlayTracking();

      // Element might not have been defined / loaded yet on slow
      // networks - wait for both before triggering play.
      await customElements.whenDefined('ograf-lower-third');
      if (userInteracted || motionQuery.matches) {
        autoPlayed = false;
        return;
      }
      const data = ltData();
      await Promise.all(lts.map(el => el.updateAction(data, true)));
      setToggleState(true);
      setSync('live', 'On Air');
      lts.forEach(el => el.playAction(null, null, false));
    };

    const observeForAutoPlay = () => {
      if (autoPlayed || userInteracted || motionQuery.matches || io) return;
      io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && autoPlayTimer === null) {
            autoPlayTimer = window.setTimeout(tryAutoPlay, 250);
          }
        }
      }, { threshold: 0.35 });
      io.observe(section);
    };

    motionQuery.addEventListener('change', async () => {
      if (motionQuery.matches) {
        stopAutoPlayTracking();
        if (autoPlayed && isPlaying && !userInteracted) {
          setToggleState(false);
          setSync('ready', 'Ready');
          await Promise.all(lts.map(el => el.stopAction(true)));
        }
      } else {
        observeForAutoPlay();
      }
    });

    observeForAutoPlay();
  }
})();

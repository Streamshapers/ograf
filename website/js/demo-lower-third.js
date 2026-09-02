(function () {
  const MESSAGE_ORIGIN = window.location.origin;
  const iframe     = document.getElementById('demo-iframe');
  const player     = document.getElementById('demo-player');
  const btnPlay    = document.getElementById('btn-play');
  const btnUpdate  = document.getElementById('btn-update');
  const btnStop    = document.getElementById('btn-stop');
  const statusEl   = document.getElementById('demo-status');

  let isReady   = false;
  let isPlaying = false;

  function send(action, data) {
    iframe.contentWindow.postMessage({ action, data }, MESSAGE_ORIGIN);
  }

  // Handshake: once the iframe finishes loading, ping it.
  // The iframe replies with 'ready' - this avoids the race where the
  // iframe fires 'ready' before the parent's message handler is registered.
  iframe.addEventListener('load', () => send('ping'));

  function setStatus(state, text) {
    statusEl.dataset.state = state;
    statusEl.textContent   = text;
  }

  // Scale the 1920-1080 iframe to fit the player container
  function scaleIframe() {
    const scale = player.clientWidth / 1920;
    iframe.style.transform = `scale(${scale})`;
  }

  scaleIframe();
  window.addEventListener('resize', scaleIframe);
  if (window.ResizeObserver) {
    new ResizeObserver(scaleIframe).observe(player);
  }

  // Messages from the iframe graphic (filter by source)
  window.addEventListener('message', ({ data, origin, source }) => {
    if (source !== iframe.contentWindow || origin !== MESSAGE_ORIGIN) return;
    const { event } = data ?? {};
    if (!event) return;

    if (event === 'ready') {
      isReady = true;
      setStatus('ready', 'Ready');
      btnPlay.disabled = false;
    }
    if (event === 'playing') {
      isPlaying = true;
      setStatus('playing', 'On Air');
      btnPlay.disabled = true;
      btnUpdate.disabled = false;
      btnStop.disabled = false;
    }
    if (event === 'stopped') {
      isPlaying = false;
      setStatus('ready', 'Ready');
      btnPlay.disabled = false;
      btnUpdate.disabled = true;
      btnStop.disabled = true;
    }
  });

  btnPlay.addEventListener('click', () => {
    if (!isReady) return;
    // Send data with play bundled - iframe handles update+play atomically
    send('play', {
      name:    document.getElementById('ctrl-name').value,
      title:   document.getElementById('ctrl-title').value,
      channel: document.getElementById('ctrl-channel').value,
    });
  });

  btnUpdate.addEventListener('click', () => {
    send('update', {
      name:    document.getElementById('ctrl-name').value,
      title:   document.getElementById('ctrl-title').value,
      channel: document.getElementById('ctrl-channel').value,
    });
  });

  btnStop.addEventListener('click', () => {
    send('stop');
  });
})();

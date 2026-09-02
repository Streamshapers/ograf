(function () {
    const MESSAGE_ORIGIN = window.location.origin;
    const READY_PING_INTERVAL_MS = 250;
    const READY_PING_TIMEOUT_MS = 10_000;
    const FORMATS = {
        '16/9': { width: 1920, height: 1080, layout: null, focusX: 0.5 },
        '4/3': { width: 1440, height: 1080, layout: null, focusX: 0.54 },
        '1/1': { width: 1080, height: 1080, layout: 'tablet', focusX: 0.58 },
        '9/16': { width: 1080, height: 1920, layout: 'phone', focusX: 0.6 }
    };

    function initialiseController(controller) {
        const iframe = controller.querySelector('[data-demo-iframe]');
        const player = controller.querySelector('[data-demo-player]');
        const btnPlay = controller.querySelector('[data-demo-action="play"]');
        const btnUpdate = controller.querySelector('[data-demo-action="update"]');
        const btnStop = controller.querySelector('[data-demo-action="stop"]');
        const statusEl = controller.querySelector('[data-demo-status]');
        const aspectButtons = [...controller.querySelectorAll('.demo-aspect-btn')];
        const fields = Object.fromEntries(
            [...controller.querySelectorAll('[data-demo-field]')]
                .map(field => [field.dataset.demoField, field])
        );

        let isReady = false;
        let readinessTimer = null;
        let currentFormat = FORMATS[player.dataset.ratio || '16/9'];

        function send(action, data) {
            iframe.contentWindow.postMessage({ action, data }, MESSAGE_ORIGIN);
        }

        function getFieldData() {
            return Object.fromEntries(
                Object.entries(fields).map(([name, field]) => [name, field.value])
            );
        }

        function setStatus(state, text) {
            statusEl.dataset.state = state;
            statusEl.textContent = text;
        }

        function scaleIframe() {
            const scale = player.clientWidth / currentFormat.width;
            iframe.style.setProperty('width', `${currentFormat.width}px`, 'important');
            iframe.style.setProperty('height', `${currentFormat.height}px`, 'important');
            iframe.style.transform = `scale(${scale})`;
        }

        function sendCurrentFormat() {
            if (aspectButtons.length < 2) return;
            send('format', {
                layout: currentFormat.layout,
                focusX: currentFormat.focusX
            });
        }

        function setFormat(ratio) {
            currentFormat = FORMATS[ratio];
            player.dataset.ratio = ratio;
            aspectButtons.forEach(button => {
                button.classList.toggle('is-active', button.dataset.ratio === ratio);
            });
            scaleIframe();
            sendCurrentFormat();
        }

        iframe.addEventListener('load', () => {
            requestReady();
            sendCurrentFormat();
        });
        aspectButtons.forEach(button => {
            if (!button.disabled) {
                button.addEventListener('click', () => setFormat(button.dataset.ratio));
            }
        });
        scaleIframe();
        window.addEventListener('resize', scaleIframe);
        if (window.ResizeObserver) {
            new ResizeObserver(scaleIframe).observe(player);
        }

        window.addEventListener('message', ({ data, origin, source }) => {
            if (source !== iframe.contentWindow || origin !== MESSAGE_ORIGIN) return;
            const { event } = data ?? {};
            if (!event) return;

            if (event === 'ready') {
                isReady = true;
                window.clearInterval(readinessTimer);
                setStatus('ready', 'Ready');
                btnPlay.disabled = false;
            }
            if (event === 'playing') {
                setStatus('playing', 'On Air');
                btnPlay.disabled = true;
                btnUpdate.disabled = false;
                btnStop.disabled = false;
            }
            if (event === 'stopped') {
                setStatus('ready', 'Ready');
                btnPlay.disabled = false;
                btnUpdate.disabled = true;
                btnStop.disabled = true;
            }
        });

        function requestReady() {
            if (!isReady) send('ping');
        }

        requestReady();
        readinessTimer = window.setInterval(requestReady, READY_PING_INTERVAL_MS);
        window.setTimeout(
            () => window.clearInterval(readinessTimer),
            READY_PING_TIMEOUT_MS
        );

        btnPlay.addEventListener('click', () => {
            if (isReady) send('play', getFieldData());
        });
        btnUpdate.addEventListener('click', () => send('update', getFieldData()));
        btnStop.addEventListener('click', () => send('stop'));
    }

    document.querySelectorAll('[data-demo-controller]').forEach(initialiseController);
})();

(function () {
    const MESSAGE_ORIGIN = window.location.origin;

    function initialiseController(controller) {
        const iframe = controller.querySelector('[data-demo-iframe]');
        const player = controller.querySelector('[data-demo-player]');
        const btnPlay = controller.querySelector('[data-demo-action="play"]');
        const btnUpdate = controller.querySelector('[data-demo-action="update"]');
        const btnStop = controller.querySelector('[data-demo-action="stop"]');
        const statusEl = controller.querySelector('[data-demo-status]');
        const fields = Object.fromEntries(
            [...controller.querySelectorAll('[data-demo-field]')]
                .map(field => [field.dataset.demoField, field])
        );

        let isReady = false;

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
            const scale = player.clientWidth / 1920;
            iframe.style.transform = `scale(${scale})`;
        }

        iframe.addEventListener('load', () => send('ping'));
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

        btnPlay.addEventListener('click', () => {
            if (isReady) send('play', getFieldData());
        });
        btnUpdate.addEventListener('click', () => send('update', getFieldData()));
        btnStop.addEventListener('click', () => send('stop'));
    }

    document.querySelectorAll('[data-demo-controller]').forEach(initialiseController);
})();

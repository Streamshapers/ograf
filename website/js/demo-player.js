const CATALOG_URL = new URL('../demo-catalog.json', import.meta.url);
const SITE_ROOT_URL = new URL('../', CATALOG_URL);
const MESSAGE_ORIGIN = window.location.origin;
const GRAPHIC_TAG = 'ograf-demo-graphic';
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const canvas = document.getElementById('graphic-canvas');

let example;
let graphic;
let backgroundVideo;
let focusX = 0.5;

function notifyParent(message) {
    window.parent.postMessage(message, MESSAGE_ORIGIN);
}

function resolveSitePath(path) {
    if (typeof path !== 'string' || !path || path.startsWith('/') || path.includes('..')) {
        throw new Error(`Unsafe demo catalogue path: ${path}`);
    }

    return new URL(path, SITE_ROOT_URL);
}

async function loadJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Unable to load ${url.pathname}: ${response.status}`);

    return response.json();
}

function getDefaultData(schema) {
    return Object.fromEntries(Object.entries(schema?.properties ?? {}).flatMap(([key, value]) => (
        Object.hasOwn(value, 'default') ? [[key, value.default]] : []
    )));
}

function syncBackgroundVideo() {
    if (!backgroundVideo) return;

    if (motionQuery.matches) {
        backgroundVideo.pause();
        try {
            backgroundVideo.currentTime = 0;
        } catch (_) {
            // Metadata may not be available yet.
        }
        return;
    }

    backgroundVideo.play().catch(() => {
        // Muted autoplay can still be blocked by an embedding policy.
    });
}

function setupBackground(background = {}) {
    document.body.style.setProperty('--demo-overlay', background.overlay ?? 'transparent');

    if (background.type === 'image') {
        const imageUrl = resolveSitePath(background.src);
        document.body.style.backgroundImage = `url('${imageUrl.href}')`;
        return;
    }

    if (background.type !== 'video') return;

    backgroundVideo = document.createElement('video');
    backgroundVideo.className = 'demo-background bg-video';
    backgroundVideo.muted = true;
    backgroundVideo.loop = true;
    backgroundVideo.playsInline = true;
    backgroundVideo.preload = 'metadata';

    for (const sourceDefinition of background.sources ?? []) {
        const source = document.createElement('source');
        source.src = resolveSitePath(sourceDefinition.src).href;
        source.type = sourceDefinition.type;
        backgroundVideo.append(source);
    }

    document.body.prepend(backgroundVideo);
    syncBackgroundVideo();
    motionQuery.addEventListener('change', syncBackgroundVideo);
}

function fitCanvas() {
    if (example.presentation.renderer !== 'fixed-canvas') return;

    const canvasSize = example.presentation.canvas;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const scale = Math.max(
        viewportWidth / canvasSize.width,
        viewportHeight / canvasSize.height
    );
    if (!(scale > 0) || !Number.isFinite(scale)) return;

    const left = Math.round(viewportWidth / 2 - focusX * canvasSize.width * scale);
    const top = Math.round(viewportHeight / 2 - canvasSize.height * scale / 2);
    canvas.style.left = `${left}px`;
    canvas.style.top = `${top}px`;
    canvas.style.transform = `scale(${scale})`;

    const visibleWidth = viewportWidth / scale;
    const visibleLeft = Math.max(
        0,
        Math.min(canvasSize.width - visibleWidth, -left / scale)
    );
    graphic.style.setProperty('--visible-left', `${visibleLeft}px`);
    graphic.style.setProperty('--visible-width', `${visibleWidth}px`);
}

function setupCanvas() {
    if (example.presentation.renderer !== 'fixed-canvas') return;

    const { width, height } = example.presentation.canvas;
    canvas.classList.add('graphic-canvas--fixed');
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
}

function applyFormat({ layout, focusX: nextFocusX } = {}) {
    if (layout) graphic.setAttribute('layout', layout);
    else graphic.removeAttribute('layout');

    focusX = Number.isFinite(Number(nextFocusX)) ? Number(nextFocusX) : 0.5;
    document.documentElement.style.setProperty('--focus-x', focusX);
    fitCanvas();
}

function renderCharacteristics() {
    const fixedCanvas = example.presentation.canvas;

    return {
        resolution: fixedCanvas ?? {
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight
        }
    };
}

async function handleMessage({ data, origin, source }) {
    if (source !== window.parent || origin !== MESSAGE_ORIGIN) return;
    const { action, data: payload } = data ?? {};
    if (!action) return;

    switch (action) {
        case 'ping':
            notifyParent({ event: 'ready' });
            break;
        case 'play':
            if (payload && Object.keys(payload).length) {
                await graphic.updateAction({ data: payload, skipAnimation: true });
            }
            await graphic.playAction({ goto: 0, skipAnimation: false });
            notifyParent({ event: 'playing' });
            break;
        case 'stop':
            await graphic.stopAction({ skipAnimation: false });
            notifyParent({ event: 'stopped' });
            break;
        case 'update':
            await graphic.updateAction({ data: payload ?? {}, skipAnimation: false });
            break;
        case 'custom': {
            const result = await graphic.customAction({
                id: payload?.id,
                payload: payload?.payload ?? payload,
                skipAnimation: false
            });
            notifyParent({ event: 'state', state: result?.result });
            break;
        }
        case 'format':
            applyFormat(payload);
            break;
    }
}

async function initialisePlayer() {
    const catalogue = await loadJson(CATALOG_URL);
    const requestedId = new URLSearchParams(window.location.search).get('example');
    example = catalogue.examples.find(candidate => candidate.id === requestedId);
    if (!example) throw new Error(`Unknown OGraf example: ${requestedId}`);

    const manifestUrl = resolveSitePath(example.manifest);
    const manifest = await loadJson(manifestUrl);
    const moduleUrl = new URL(manifest.main, manifestUrl);
    const graphicModule = await import(moduleUrl.href);
    if (typeof graphicModule.default !== 'function') {
        throw new Error(`${manifest.main} does not export an OGraf Graphic class`);
    }

    setupBackground(example.presentation.background);
    setupCanvas();
    customElements.define(GRAPHIC_TAG, graphicModule.default);
    graphic = document.createElement(GRAPHIC_TAG);
    graphic.id = 'graphic';
    canvas.append(graphic);

    window.addEventListener('resize', fitCanvas);
    window.addEventListener('message', handleMessage);
    await graphic.load({
        data: getDefaultData(manifest.schema),
        renderType: 'realtime',
        renderCharacteristics: renderCharacteristics()
    });
    applyFormat({});
    document.title = `OGraf Example — ${example.title}`;
    notifyParent({ event: 'ready' });
}

initialisePlayer().catch(error => {
    console.error(error);
    notifyParent({ event: 'error', message: error.message });
});

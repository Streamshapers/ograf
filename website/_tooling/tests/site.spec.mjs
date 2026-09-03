import { expect, test } from '@playwright/test';

const PRODUCTION_URL = 'https://ograf.ebu.io/';
const SOCIAL_IMAGE_PATH = 'website/assets/img/ograf-social-preview.png';
const SOCIAL_IMAGE_URL = `${PRODUCTION_URL}${SOCIAL_IMAGE_PATH}`;
const SOCIAL_IMAGE_ALT = 'OGraf logo with the text "The EBU\'s open specification '
    + 'to liberate broadcast graphics" on a dark blue background.';
const SOCIAL_TITLE = 'OGraf - Open HTML Graphics for Broadcast';
const SOCIAL_DESCRIPTION = "The EBU's open specification for HTML broadcast graphics. "
    + 'Build once, run across compatible broadcast, web, and mobile workflows.';

function monitorPage(page) {
    const errors = [];
    const failedSameOriginRequests = [];

    page.on('console', message => {
        if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
        if (response.url().startsWith('http://127.0.0.1:')
            && response.status() >= 400) {
            failedSameOriginRequests.push(`${response.status()} ${response.url()}`);
        }
    });

    return { errors, failedSameOriginRequests };
}

async function expectPreparedSocialMetadata(page) {
    await expect(page.locator('link[rel="canonical"]'))
        .toHaveAttribute('href', PRODUCTION_URL);
    await expect(page.locator('meta[property="og:type"]'))
        .toHaveAttribute('content', 'website');
    await expect(page.locator('meta[property="og:title"]'))
        .toHaveAttribute('content', SOCIAL_TITLE);
    await expect(page.locator('meta[property="og:description"]'))
        .toHaveAttribute('content', SOCIAL_DESCRIPTION);
    await expect(page.locator('meta[property="og:site_name"]'))
        .toHaveAttribute('content', 'OGraf');
    await expect(page.locator('meta[property="og:url"]'))
        .toHaveAttribute('content', PRODUCTION_URL);
    await expect(page.locator('meta[property="og:image"]'))
        .toHaveAttribute('content', SOCIAL_IMAGE_URL);
    await expect(page.locator('meta[property="og:image:secure_url"]'))
        .toHaveAttribute('content', SOCIAL_IMAGE_URL);
    await expect(page.locator('meta[property="og:image:type"]'))
        .toHaveAttribute('content', 'image/png');
    await expect(page.locator('meta[property="og:image:width"]'))
        .toHaveAttribute('content', '1200');
    await expect(page.locator('meta[property="og:image:height"]'))
        .toHaveAttribute('content', '630');
    await expect(page.locator('meta[property="og:image:alt"]'))
        .toHaveAttribute('content', SOCIAL_IMAGE_ALT);
    await expect(page.locator('meta[name="twitter:card"]'))
        .toHaveAttribute('content', 'summary_large_image');
    await expect(page.locator('meta[name="twitter:title"]'))
        .toHaveAttribute('content', SOCIAL_TITLE);
    await expect(page.locator('meta[name="twitter:description"]'))
        .toHaveAttribute('content', SOCIAL_DESCRIPTION);
    await expect(page.locator('meta[name="twitter:image"]'))
        .toHaveAttribute('content', SOCIAL_IMAGE_URL);
    await expect(page.locator('meta[name="twitter:image:alt"]'))
        .toHaveAttribute('content', SOCIAL_IMAGE_ALT);

    const imageResponse = await page.request.get(`./${SOCIAL_IMAGE_PATH}`);
    expect(imageResponse.ok()).toBeTruthy();
    expect(imageResponse.headers()['content-type']).toContain('image/png');
    const imageDimensions = await page.evaluate(async imagePath => {
        const image = new Image();
        image.src = `./${imagePath}`;
        await image.decode();

        return { width: image.naturalWidth, height: image.naturalHeight };
    }, SOCIAL_IMAGE_PATH);
    expect(imageDimensions).toEqual({ width: 1200, height: 630 });

    const structuredData = JSON.parse(
        await page.locator('script[type="application/ld+json"]').textContent()
    );
    expect(structuredData).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'OGraf',
        url: PRODUCTION_URL,
        publisher: {
            '@type': 'Organization',
            name: 'European Broadcasting Union'
        }
    });
}

async function openLandingPage(page) {
    const monitor = monitorPage(page);
    await page.goto('./');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
    await expect(page.locator('.logo-grid__item')).not.toHaveCount(0);
    await expect(page.locator('.hero__badge')).toHaveCount(2);
    await expect(page.locator('.hero__badge').nth(1)).toContainText('v1');
    await expect(page.locator('.hero__badge').nth(1)).toContainText('Server API · Stable');
    await expect(page.locator('.status-card')).toHaveCount(2);
    await expect(page.locator('.status-card').nth(1)).toContainText('Published 2026-08-13');
    await expect(page.locator('.status-card').nth(1))
        .toContainText('Read the Server API specification');
    await expect(page.locator('link[href^="website/css/style.css"]'))
        .toHaveAttribute('href', /style\.css\?v=\d+$/);
    await expect(page.locator('script[src^="website/js/demo-carousel.js"]'))
        .toHaveAttribute('src', /demo-carousel\.js\?v=\d+$/);
    await expect(page.locator('body')).not.toContainText('Mid-2026');
    await expect(page.locator('body')).not.toContainText('Draft – Published');
    return monitor;
}

async function expectCleanPage(monitor) {
    expect(monitor.errors, 'console and page errors').toEqual([]);
    expect(monitor.failedSameOriginRequests, 'same-origin HTTP errors').toEqual([]);
}

async function readDownload(download) {
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);

    return Buffer.concat(chunks);
}

function listStoredZipFiles(archive) {
    const files = [];
    let offset = 0;

    while (offset + 4 <= archive.length && archive.readUInt32LE(offset) === 0x04034b50) {
        expect(archive.readUInt16LE(offset + 8), 'ZIP compression method').toBe(0);
        const size = archive.readUInt32LE(offset + 18);
        const fileNameLength = archive.readUInt16LE(offset + 26);
        const extraLength = archive.readUInt16LE(offset + 28);
        const fileNameStart = offset + 30;
        const contentsStart = fileNameStart + fileNameLength + extraLength;
        files.push(archive.subarray(fileNameStart, contentsStart).toString('utf8'));
        offset = contentsStart + size;
    }

    return files;
}

test('social metadata uses the approved preview image', async ({ page }) => {
    const monitor = monitorPage(page);
    await page.goto('./');
    await expectPreparedSocialMetadata(page);
    await expectCleanPage(monitor);
});

test('@mobile navigation, manifests, and runtime requests work', async ({ page }) => {
    const monitor = await openLandingPage(page);
    const toggle = page.locator('#nav-toggle');

    if (await toggle.isVisible()) {
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator('#site-nav')).toHaveAttribute('aria-hidden', 'false');
        await page.keyboard.press('Escape');
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    } else {
        await expect(page.locator('#site-nav')).toBeVisible();
    }

    const moduleResponse = await page.request.get(
        './v1/examples/responsive-lower-third/graphic.mjs'
    );
    expect(moduleResponse.ok()).toBeTruthy();
    expect(moduleResponse.headers()['content-type']).toContain('text/javascript');
    await expectCleanPage(monitor);
});

test('heavy demo media loads only when requested', async ({ page }) => {
    const sameOriginRequests = [];
    page.on('request', request => {
        if (request.url().startsWith('http://127.0.0.1:')) {
            sameOriginRequests.push(new URL(request.url()).pathname);
        }
    });

    const monitor = await openLandingPage(page);
    const stageSources = page.locator('.stage-device__bg-video source');
    const deferredFrames = page.locator('.demo-player__iframe[data-src]');

    await expect(stageSources).toHaveCount(6);
    for (const source of await stageSources.all()) {
        await expect(source).not.toHaveAttribute('src');
        await expect(source).toHaveAttribute('data-src', /Background-Interview-Video-720/);
    }
    await expect(deferredFrames).toHaveCount(3);
    expect(sameOriginRequests.some(path => path.includes('Background-Interview-Video-720')))
        .toBe(false);
    expect(sameOriginRequests.some(path => path.includes('/v1/examples/l3rd-name/')))
        .toBe(false);

    await page.locator('.section-stage').scrollIntoViewIfNeeded();
    await expect.poll(() => sameOriginRequests.some(
        path => path.includes('Background-Interview-Video-720')
    )).toBe(true);

    await page.locator('#demos').scrollIntoViewIfNeeded();
    await expect(page.locator('#sb-iframe')).toHaveAttribute(
        'src',
        'website/demo-player/index.html?example=scoreboard'
    );
    await expect(page.locator('#sb-play')).toBeEnabled();

    await page.locator('#demo-tab-1').click();
    const l3rdFrame = page.locator('#demo-slide-1 .demo-player__iframe');
    await expect(l3rdFrame).toHaveAttribute(
        'src',
        'website/demo-player/index.html?example=l3rd-name'
    );
    await expect(page.locator('#demo-slide-1 [data-demo-action="play"]')).toBeEnabled();
    await expect(page.locator('#demo-slide-2 .demo-player__iframe')).not.toHaveAttribute('src');

    await expect(page.locator('[data-lucide]')).not.toHaveCount(0);
    await expect(page.locator('i[data-lucide]')).toHaveCount(0);
    await expectCleanPage(monitor);
});

test('multi-device stage fits compact landscape viewports', async ({ page }) => {
    const compactViewports = [
        { width: 1260, height: 802 },
        { width: 1024, height: 768 }
    ];

    for (const viewport of compactViewports) {
        await page.setViewportSize(viewport);
        const monitor = await openLandingPage(page);
        const section = page.locator('.section-stage');
        const siteHeader = page.locator('.site-header');
        const tv = page.locator('.stage-device--tv');
        const tablet = page.locator('.stage-device--tablet');
        const controls = page.locator('.stage__controls');

        await section.scrollIntoViewIfNeeded();

        const sectionBox = await section.boundingBox();
        const headerBox = await siteHeader.boundingBox();
        const tvBox = await tv.boundingBox();
        const tabletBox = await tablet.boundingBox();
        const controlsBox = await controls.boundingBox();

        expect(sectionBox).not.toBeNull();
        expect(headerBox).not.toBeNull();
        expect(tvBox).not.toBeNull();
        expect(tabletBox).not.toBeNull();
        expect(controlsBox).not.toBeNull();
        expect(sectionBox.height).toBeLessThanOrEqual(viewport.height - headerBox.height + 1);
        expect(controlsBox.y + controlsBox.height)
            .toBeLessThanOrEqual(sectionBox.y + sectionBox.height + 1);

        const tabletOverlap = tabletBox.x + tabletBox.width - tvBox.x;
        expect(tabletOverlap).toBeGreaterThan(0);
        expect(tabletOverlap).toBeLessThanOrEqual(16);

        const pageWidth = await page.evaluate(() => ({
            clientWidth: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth
        }));
        expect(pageWidth.scrollWidth).toBe(pageWidth.clientWidth);
        await expectCleanPage(monitor);
    }
});

test('@compat stage and all carousel example controls run', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const monitor = await openLandingPage(page);

    const stageButton = page.locator('#stage-toggle');
    await expect(stageButton).toBeEnabled();
    await stageButton.click();
    await expect(page.locator('#stage-sync')).toHaveAttribute('data-state', 'live');
    await page.locator('#stage-name').fill('Updated Presenter');
    await stageButton.click();
    await expect(page.locator('#stage-sync')).toHaveAttribute('data-state', 'ready');

    await page.locator('#demos').scrollIntoViewIfNeeded();
    await expect(page.locator('#sb-play')).toBeEnabled();
    await page.locator('#sb-play').click();
    await expect(page.locator('#sb-status')).toHaveAttribute('data-state', 'playing');
    await page.locator('#sb-home').fill('EBU');
    await page.locator('#sb-update').click();
    await page.locator('#sb-stop').click();
    await expect(page.locator('#sb-status')).toHaveAttribute('data-state', 'ready');

    for (const controllerName of ['l3rd-name', 'responsive-lower-third']) {
        await page.locator('.demo-carousel__btn--next').click();
        const controller = page.locator(`[data-demo-controller="${controllerName}"]`);
        const playButton = controller.locator('[data-demo-action="play"]');

        await expect(controller.locator('xpath=ancestor::*[contains(@class, "demo-carousel__slide")]'))
            .toHaveClass(/is-active/);
        await playButton.scrollIntoViewIfNeeded();
        await expect(playButton).toBeVisible();
        await expect(playButton).toBeEnabled();
        await playButton.click();
        await expect(controller.locator('[data-demo-status]')).toHaveAttribute('data-state', 'playing');
        await controller.locator('[data-demo-field="name"]').fill('Updated Presenter');
        await controller.locator('[data-demo-action="update"]').click();
        const customAction = controller.locator('[data-demo-custom-action]');
        if (await customAction.count()) {
            await expect(customAction).toBeEnabled();
            await customAction.click();
        }
        await controller.locator('[data-demo-action="stop"]').click();
        await expect(controller.locator('[data-demo-status]')).toHaveAttribute('data-state', 'ready');
    }

    await expectCleanPage(monitor);
});

test('@mobile demo carousel adapts and offers valid OGraf packages', async ({ page }) => {
    const monitor = await openLandingPage(page);
    const carouselViewport = page.locator('.demo-carousel__viewport');
    const activeSlide = page.locator('.demo-carousel__slide.is-active');
    const player = activeSlide.locator('.demo-player');
    const controls = activeSlide.locator('.demo-controls');
    const viewportSize = page.viewportSize();

    await page.locator('#demos').scrollIntoViewIfNeeded();
    await expect(carouselViewport).toBeVisible();
    await expect(page.locator('.demo-carousel__slide')).toHaveCount(3);
    await expect(page.locator('.demo-carousel__dot')).toHaveCount(3);
    await expect(page.locator('.demo-card__tag')).toHaveCount(0);

    for (const chromePart of ['.demo-card__header', '.demo-aspect-bar']) {
        await expect(activeSlide.locator(chromePart)).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    }

    const viewportBox = await carouselViewport.boundingBox();
    const firstSlideBox = await page.locator('.demo-carousel__slide').nth(0).boundingBox();
    const secondSlideBox = await page.locator('.demo-carousel__slide').nth(1).boundingBox();
    const minimumVisibleNeighbour = viewportSize.width <= 640
        ? 24
        : viewportSize.width <= 900 ? 60 : 80;
    expect(viewportBox).not.toBeNull();
    expect(firstSlideBox.x).toBeGreaterThan(viewportBox.x);
    expect(viewportBox.x + viewportBox.width - secondSlideBox.x)
        .toBeGreaterThanOrEqual(minimumVisibleNeighbour);
    const maskImages = await carouselViewport.evaluate(element => {
        const styles = getComputedStyle(element);

        return [styles.maskImage, styles.webkitMaskImage];
    });
    expect(maskImages.some(value => value.includes('linear-gradient'))).toBe(true);
    await expect(page.locator('.demo-carousel__slide').nth(1)).toHaveCSS('opacity', '0.58');

    await page.locator('.demo-carousel__dot').nth(1).click();
    await expect.poll(async () => {
        const previousBox = await page.locator('.demo-carousel__slide').nth(0).boundingBox();
        const nextBox = await page.locator('.demo-carousel__slide').nth(2).boundingBox();
        const previousVisibleWidth = previousBox.x + previousBox.width - viewportBox.x;
        const nextVisibleWidth = viewportBox.x + viewportBox.width - nextBox.x;

        return Math.min(previousVisibleWidth, nextVisibleWidth);
    }).toBeGreaterThanOrEqual(minimumVisibleNeighbour);

    await page.locator('.demo-carousel__dot').nth(0).click();
    await expect(activeSlide).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('.demo-carousel__slide').nth(1)).toHaveAttribute('aria-hidden', 'true');

    const playerBox = await player.boundingBox();
    const controlsBox = await controls.boundingBox();
    const cardBox = await activeSlide.locator('.demo-card').boundingBox();

    expect(viewportSize).not.toBeNull();
    expect(playerBox).not.toBeNull();
    expect(controlsBox).not.toBeNull();
    expect(cardBox).not.toBeNull();

    const hasSideControls = viewportSize.width >= 901;
    if (hasSideControls) {
        expect(controlsBox.x).toBeGreaterThanOrEqual(playerBox.x + playerBox.width - 1);
        expect(cardBox.height).toBeLessThan(viewportSize.height - 64);
    } else {
        expect(controlsBox.y).toBeGreaterThanOrEqual(playerBox.y + playerBox.height - 1);
        expect(playerBox.height).toBeLessThan(viewportSize.height - 64);
    }

    const pageWidth = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
    }));
    expect(pageWidth.scrollWidth).toBe(pageWidth.clientWidth);

    const expectedDownloads = [
        {
            name: 'ograf-example-scoreboard.zip',
            files: [
                'README.md',
                'assets/ograf-logo-colour.svg',
                'graphic.mjs',
                'scoreboard.ograf.json'
            ]
        },
        {
            name: 'ograf-example-l3rd-name.zip',
            files: [
                'README.md',
                'graphic.mjs',
                'l3rd.ograf.json',
                'lib/CSSPlugin.js',
                'lib/TextPlugin.js',
                'lib/gsap-core.js',
                'lib/gsap.min.js',
                'lib/ograf-logo-app.svg',
                'lib/utils/strings.js'
            ]
        },
        {
            name: 'ograf-example-responsive-lower-third.zip',
            files: [
                'README.md',
                'graphic.mjs',
                'responsive-lower-third.ograf.json'
            ]
        }
    ];
    await expect(page.locator('.demo-card__download')).toHaveCount(expectedDownloads.length);
    for (let index = 0; index < expectedDownloads.length; index += 1) {
        await page.locator('.demo-carousel__dot').nth(index).click();
        const link = page.locator('.demo-carousel__slide').nth(index)
            .locator('.demo-card__download');
        const downloadPromise = page.waitForEvent('download');
        await link.click();
        const download = await downloadPromise;
        const archive = await readDownload(download);

        expect(download.suggestedFilename()).toBe(expectedDownloads[index].name);
        expect(archive.subarray(0, 4).toString('hex')).toBe('504b0304');
        expect(listStoredZipFiles(archive)).toEqual(expectedDownloads[index].files);
    }

    await expectCleanPage(monitor);
});

test('scoreboard and responsive lower third keep a stable player height', async ({ page }) => {
    const monitor = await openLandingPage(page);
    const formats = [
        { ratio: '16/9', width: '1920px', height: '1080px' },
        { ratio: '4/3', width: '1440px', height: '1080px' },
        { ratio: '1/1', width: '1080px', height: '1080px' },
        { ratio: '9/16', width: '1080px', height: '1920px' }
    ];

    async function expectStableHeight(card) {
        const stage = card.locator('.demo-player-stage');
        const player = card.locator('.demo-player');
        const iframe = card.locator('.demo-player__iframe');
        const initialStageBox = await stage.boundingBox();

        for (const format of formats) {
            await card.locator(`.demo-aspect-btn[data-ratio="${format.ratio}"]`).click();
            await expect(player).toHaveAttribute('data-ratio', format.ratio);
            await expect(iframe).toHaveCSS('width', format.width);
            await expect(iframe).toHaveCSS('height', format.height);

            const stageBox = await stage.boundingBox();
            const playerBox = await player.boundingBox();
            expect(Math.abs(stageBox.height - initialStageBox.height)).toBeLessThan(1);
            expect(Math.abs(playerBox.height - initialStageBox.height)).toBeLessThan(1);
        }
    }

    await page.locator('#demos').scrollIntoViewIfNeeded();
    await expectStableHeight(page.locator('.demo-card--scoreboard'));

    await page.locator('.demo-carousel__dot').nth(2).click();
    const responsiveLowerThird = page.locator('[data-demo-controller="responsive-lower-third"]');
    await expect(responsiveLowerThird.locator('[data-demo-action="play"]')).toBeEnabled();
    await expectStableHeight(responsiveLowerThird);
    await expect(
        responsiveLowerThird.locator('.demo-player__iframe').contentFrame().locator('#graphic')
    ).toHaveAttribute('layout', 'phone');

    await expectCleanPage(monitor);
});

test('@mobile landscape phones retain a complete demo frame', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    const monitor = await openLandingPage(page);
    const player = page.locator('.demo-carousel__slide.is-active .demo-player');

    await page.locator('#demos').scrollIntoViewIfNeeded();
    const playerBox = await player.boundingBox();
    expect(playerBox).not.toBeNull();
    expect(playerBox.height).toBeLessThan(390 - 64);

    const pageWidth = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
    }));
    expect(pageWidth.scrollWidth).toBe(pageWidth.clientWidth);
    await expectCleanPage(monitor);
});

test('video is private until consent and uses only youtube-nocookie', async ({ page }) => {
    const thirdPartyRequests = [];
    await page.route('https://www.youtube-nocookie.com/**', async route => {
        thirdPartyRequests.push(route.request().url());
        await route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Video</title>' });
    });

    const monitor = await openLandingPage(page);
    expect(thirdPartyRequests).toEqual([]);
    await page.locator('.section-video__consent').click();
    await expect(page.locator('.section-video__embed iframe')).toHaveAttribute(
        'src',
        /youtube-nocookie\.com\/embed\/u4wruk2QTs0/
    );
    await expect.poll(() => thirdPartyRequests.length).toBeGreaterThan(0);
    expect(thirdPartyRequests.every(url => url.startsWith('https://www.youtube-nocookie.com/'))).toBeTruthy();
    await expectCleanPage(monitor);
});

test('normative documentation routes remain available', async ({ page }) => {
    const paths = process.env.REQUIRE_JEKYLL_OUTPUT === '1'
        ? [
            './v1/specification/docs/Specification.html',
            './v1/specification/docs/Specification_Server_API.html',
            './v1/specification/json-schemas/graphics/schema.json',
            './v1/specification/open-api/docs/',
            './CHANGELOG.html'
        ]
        : [
            './v1/specification/docs/Specification.md',
            './v1/specification/docs/Specification_Server_API.md',
            './v1/specification/json-schemas/graphics/schema.json',
            './v1/specification/open-api/docs/',
            './CHANGELOG.md'
        ];

    for (const path of paths) {
        const response = await page.request.get(path);
        expect(response.ok(), path).toBeTruthy();
    }
});

test('development server blocks path traversal', async ({ page }) => {
    const response = await page.request.get('./%2e%2e%2f%2e%2e%2fCNAME');
    expect(response.status()).toBe(403);
});

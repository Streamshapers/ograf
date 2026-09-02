import { expect, test } from '@playwright/test';

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

test('navigation, manifests, and runtime requests work', async ({ page }, testInfo) => {
    const monitor = await openLandingPage(page);

    if (testInfo.project.name === 'mobile-preview') {
        const toggle = page.locator('#nav-toggle');
        await expect(toggle).toBeVisible();
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator('#site-nav')).toHaveAttribute('aria-hidden', 'false');
        await page.keyboard.press('Escape');
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    } else {
        await expect(page.locator('#site-nav')).toBeVisible();
    }

    const moduleResponse = await page.request.get('./website/demos/lower-third-stage/graphic.mjs');
    expect(moduleResponse.ok()).toBeTruthy();
    expect(moduleResponse.headers()['content-type']).toContain('text/javascript');
    await expectCleanPage(monitor);
});

test('stage, scoreboard, and carousel lower-third controls run', async ({ page }) => {
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

    for (const controllerName of ['news-lower-third', 'responsive-lower-third']) {
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
        await controller.locator('[data-demo-action="stop"]').click();
        await expect(controller.locator('[data-demo-status]')).toHaveAttribute('data-state', 'ready');
    }

    await expectCleanPage(monitor);
});

test('demo carousel adapts and offers valid OGraf packages', async ({ page }) => {
    const monitor = await openLandingPage(page);
    const carouselViewport = page.locator('.demo-carousel__viewport');
    const activeSlide = page.locator('.demo-carousel__slide.is-active');
    const player = activeSlide.locator('.demo-player');
    const controls = activeSlide.locator('.demo-controls');

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
    expect(viewportBox).not.toBeNull();
    expect(firstSlideBox.x).toBeGreaterThan(viewportBox.x);
    expect(secondSlideBox.x).toBeLessThan(viewportBox.x + viewportBox.width);

    await page.locator('.demo-carousel__dot').nth(1).click();
    await expect.poll(async () => {
        const previousBox = await page.locator('.demo-carousel__slide').nth(0).boundingBox();
        const nextBox = await page.locator('.demo-carousel__slide').nth(2).boundingBox();
        return previousBox.x + previousBox.width > viewportBox.x
            && nextBox.x < viewportBox.x + viewportBox.width;
    }).toBeTruthy();

    await page.locator('.demo-carousel__dot').nth(0).click();
    await expect(activeSlide).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('.demo-carousel__slide').nth(1)).toHaveAttribute('aria-hidden', 'true');

    const viewportSize = page.viewportSize();
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

    const downloadLinks = page.locator('.demo-card__download');
    await expect(downloadLinks).toHaveCount(3);
    for (const link of await downloadLinks.all()) {
        const href = await link.getAttribute('href');
        expect(href).toMatch(/\.zip$/);

        const response = await page.request.get(href);
        expect(response.ok(), href).toBeTruthy();
        expect(response.headers()['content-type']).toContain('application/zip');
        expect((await response.body()).subarray(0, 4).toString('hex')).toBe('504b0304');
    }

    await expectCleanPage(monitor);
});

test('landscape phones retain a complete demo frame', async ({ page }) => {
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

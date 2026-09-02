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

test('stage, scoreboard, and lower-third controls run', async ({ page }) => {
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

    await page.locator('.demo-carousel__btn--next').click();
    await expect(page.locator('.demo-carousel__slide').nth(1)).toHaveClass(/is-active/);
    const lowerThirdPlayButton = page.locator('#btn-play');
    await lowerThirdPlayButton.scrollIntoViewIfNeeded();
    await expect(lowerThirdPlayButton).toBeVisible();
    await expect(lowerThirdPlayButton).toBeEnabled();
    await lowerThirdPlayButton.click();
    await expect(page.locator('#demo-status')).toHaveAttribute('data-state', 'playing');
    await page.locator('#ctrl-name').fill('Updated Presenter');
    await page.locator('#btn-update').click();
    await page.locator('#btn-stop').click();
    await expect(page.locator('#demo-status')).toHaveAttribute('data-state', 'ready');

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

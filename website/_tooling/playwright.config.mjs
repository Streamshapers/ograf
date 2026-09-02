import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT) || 4173;

export default defineConfig({
    testDir: './tests',
    timeout: 45_000,
    expect: { timeout: 10_000 },
    fullyParallel: false,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        trace: 'retain-on-failure',
        video: 'retain-on-failure'
    },
    webServer: {
        command: 'node scripts/dev-server.mjs',
        url: `http://127.0.0.1:${PORT}`,
        reuseExistingServer: !process.env.CI,
        env: {
            ...process.env,
            PORT: String(PORT)
        }
    },
    projects: [
        {
            name: 'desktop-root',
            use: {
                ...devices['Desktop Chrome'],
                baseURL: `http://127.0.0.1:${PORT}`
            }
        },
        {
            name: 'mobile-preview',
            use: {
                ...devices['Pixel 7'],
                baseURL: `http://127.0.0.1:${PORT}/ograf`
            }
        },
        {
            name: 'tablet-preview',
            use: {
                ...devices['Pixel 7'],
                viewport: { width: 820, height: 1180 },
                baseURL: `http://127.0.0.1:${PORT}/ograf`
            }
        }
    ]
});

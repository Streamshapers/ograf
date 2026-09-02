import { access, readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HtmlValidate } from 'html-validate';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const TOOLING_ROOT = resolve(SCRIPT_DIRECTORY, '..');
const REPOSITORY_ROOT = resolve(TOOLING_ROOT, '..', '..');
const WEBSITE_ROOT = resolve(REPOSITORY_ROOT, 'website');
const HTML_FILES = [
    resolve(REPOSITORY_ROOT, 'index.html'),
    resolve(WEBSITE_ROOT, 'demos/scoreboard/index.html'),
    resolve(WEBSITE_ROOT, 'demos/lower-third/index.html'),
    resolve(WEBSITE_ROOT, 'demos/lower-third-stage/index.html')
];
const FORBIDDEN_RUNTIME_HOSTS = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'unpkg.com',
    'cdn.jsdelivr.net',
    'youtube.com/embed'
];
const errors = [];

async function exists(path) {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

async function walk(directory, predicate) {
    const entries = await readdir(directory, { withFileTypes: true });
    const paths = [];

    for (const entry of entries) {
        if (entry.name === 'node_modules') continue;
        const entryPath = resolve(directory, entry.name);
        if (entry.isDirectory()) {
            paths.push(...await walk(entryPath, predicate));
        } else if (predicate(entryPath)) {
            paths.push(entryPath);
        }
    }

    return paths.sort();
}

function report(message) {
    errors.push(message);
}

function isIgnoredReference(reference) {
    return !reference
        || reference.startsWith('#')
        || reference.startsWith('%23')
        || reference.startsWith('/')
        || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(reference);
}

async function validateLocalReferences(filePath, contents, pattern) {
    for (const match of contents.matchAll(pattern)) {
        const reference = match[1].split(/[?#]/, 1)[0];
        if (isIgnoredReference(reference)) continue;
        const resolvedReference = resolve(dirname(filePath), decodeURIComponent(reference));
        if (!await exists(resolvedReference)) {
            report(`${relative(REPOSITORY_ROOT, filePath)} references missing ${reference}`);
        }
    }
}

async function validateHtml() {
    const validator = new HtmlValidate({
        extends: ['html-validate:recommended'],
        rules: {
            'prefer-native-element': 'off'
        }
    });

    for (const filePath of HTML_FILES) {
        const contents = await readFile(filePath, 'utf8');
        const reportResult = await validator.validateString(contents, filePath);

        for (const result of reportResult.results) {
            for (const message of result.messages) {
                report(`${relative(REPOSITORY_ROOT, filePath)}:${message.line}:${message.column} ${message.ruleId}: ${message.message}`);
            }
        }

        if (!/<meta\s+name=["']robots["']\s+content=["']noindex,nofollow["']/i.test(contents)) {
            report(`${relative(REPOSITORY_ROOT, filePath)} is missing noindex,nofollow`);
        }

        await validateLocalReferences(
            filePath,
            contents,
            /(?:href|src|data-manifest|data-base)=["']([^"']+)["']/gi
        );
    }
}

async function validateCss() {
    const cssFiles = await walk(resolve(WEBSITE_ROOT, 'css'), path => extname(path) === '.css');
    for (const filePath of cssFiles) {
        const contents = await readFile(filePath, 'utf8');
        await validateLocalReferences(filePath, contents, /url\(\s*["']?([^"')]+)["']?\s*\)/gi);
    }
}

async function validateJson() {
    const jsonFiles = await walk(WEBSITE_ROOT, path => extname(path) === '.json');
    for (const filePath of jsonFiles) {
        try {
            JSON.parse(await readFile(filePath, 'utf8'));
        } catch (error) {
            report(`${relative(REPOSITORY_ROOT, filePath)} contains invalid JSON: ${error.message}`);
        }
    }
}

async function validateJavaScript() {
    const scriptFiles = await walk(WEBSITE_ROOT, path => {
        if (!['.js', '.mjs'].includes(extname(path))) return false;
        return !path.includes('/assets/vendor/');
    });

    for (const filePath of scriptFiles) {
        const check = spawnSync(process.execPath, ['--check', filePath], { encoding: 'utf8' });
        if (check.status !== 0) {
            report(`${relative(REPOSITORY_ROOT, filePath)} failed node --check:\n${check.stderr.trim()}`);
        }
    }
}

async function validateRuntimeDependencies() {
    const runtimeFiles = [
        resolve(REPOSITORY_ROOT, 'index.html'),
        ...await walk(resolve(WEBSITE_ROOT, 'css'), path => extname(path) === '.css'),
        ...await walk(resolve(WEBSITE_ROOT, 'js'), path => ['.js', '.mjs'].includes(extname(path)))
    ];

    for (const filePath of runtimeFiles) {
        const contents = await readFile(filePath, 'utf8');
        for (const host of FORBIDDEN_RUNTIME_HOSTS) {
            if (contents.includes(host)) {
                report(`${relative(REPOSITORY_ROOT, filePath)} contains forbidden runtime host ${host}`);
            }
        }
    }
}

async function validateRepositoryContract() {
    const cname = (await readFile(resolve(REPOSITORY_ROOT, 'CNAME'), 'utf8')).trim();
    if (cname !== 'ograf.ebu.io') report(`CNAME must remain ograf.ebu.io, got ${cname}`);

    const requiredPaths = [
        'index.html',
        'favicon.svg',
        'site.webmanifest',
        'v1/specification/docs/Specification.md',
        'v1/specification/docs/Specification_Server_API.md',
        'v1/specification/json-schemas/graphics/schema.json',
        'v1/specification/open-api/docs/index.html',
        'CHANGELOG.md',
        'website/assets/vendor/gsap/gsap.min.js',
        'website/assets/vendor/gsap/ScrollTrigger.min.js',
        'website/assets/vendor/lucide/lucide.min.js',
        'website/assets/img/ograf-social-preview.png',
        'website/demos/scoreboard/ograf-demo-scoreboard.zip',
        'website/demos/lower-third/ograf-demo-lower-third.zip',
        'website/demos/lower-third-stage/ograf-demo-responsive-lower-third.zip'
    ];

    for (const requiredPath of requiredPaths) {
        if (!await exists(resolve(REPOSITORY_ROOT, requiredPath))) {
            report(`Required path is missing: ${requiredPath}`);
        }
    }

    const manifestCheck = spawnSync(
        process.execPath,
        [resolve(SCRIPT_DIRECTORY, 'update-manifests.mjs'), '--check'],
        { encoding: 'utf8' }
    );
    if (manifestCheck.status !== 0) {
        report(manifestCheck.stderr.trim() || manifestCheck.stdout.trim());
    }

    const demoPackageCheck = spawnSync(
        process.execPath,
        [resolve(SCRIPT_DIRECTORY, 'update-demo-packages.mjs'), '--check'],
        { encoding: 'utf8' }
    );
    if (demoPackageCheck.status !== 0) {
        report(demoPackageCheck.stderr.trim() || demoPackageCheck.stdout.trim());
    }
}

await Promise.all([
    validateHtml(),
    validateCss(),
    validateJson(),
    validateJavaScript(),
    validateRuntimeDependencies(),
    validateRepositoryContract()
]);

if (errors.length) {
    console.error(errors.map(error => `- ${error}`).join('\n'));
    process.exitCode = 1;
} else {
    console.log('Website validation passed.');
}

export const DEMO_CATALOG_URL = new URL('../demo-catalog.json', import.meta.url);
export const SITE_ROOT_URL = new URL('../', DEMO_CATALOG_URL);

export function resolveSitePath(path) {
    if (typeof path !== 'string' || !path || path.startsWith('/') || path.includes('..')) {
        throw new Error(`Unsafe demo catalogue path: ${path}`);
    }

    return new URL(path, SITE_ROOT_URL);
}

export async function loadDemoCatalog() {
    const response = await fetch(DEMO_CATALOG_URL);
    if (!response.ok) {
        throw new Error(
            `Unable to load ${DEMO_CATALOG_URL.pathname}: ${response.status}`
        );
    }

    return response.json();
}

export function findDemoExample(catalogue, id) {
    const example = catalogue.examples.find(candidate => candidate.id === id);
    if (!example) throw new Error(`Unknown OGraf example: ${id}`);

    return example;
}

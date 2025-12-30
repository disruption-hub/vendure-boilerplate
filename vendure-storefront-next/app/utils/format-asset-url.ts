import { API_URL } from '../constants';

export function formatAssetUrl(url?: string): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;

    // Derived asset base: strip /shop-api and append /assets
    // If API_URL is http://localhost:3000/shop-api -> http://localhost:3000/assets
    const assetBase = API_URL.replace(/\/shop-api$/, '') + '/assets';

    // Ensure we don't double slash
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return `${assetBase}${normalizedPath}`;
}

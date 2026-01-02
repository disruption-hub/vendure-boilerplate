"use server";

const DEFAULT_DEV_ZKEY_SERVICE_URL = 'http://127.0.0.1:3002';

function getZkeyServiceUrl(): string {
    const raw = (process.env.ZKEY_SERVICE_URL ?? process.env.NEXT_PUBLIC_ZKEY_SERVICE_URL ?? '').trim();
    if (raw) return raw.replace(/\/+$/, '');
    if (process.env.NODE_ENV === 'development') return DEFAULT_DEV_ZKEY_SERVICE_URL;
    throw new Error('ZKEY_SERVICE_URL is not configured');
}

async function zkeyFetch(pathname: string, init?: RequestInit) {
    const base = getZkeyServiceUrl();
    let url: string;
    try {
        url = new URL(pathname, `${base}/`).toString();
    } catch (e) {
        throw new Error(`Invalid ZKEY_SERVICE_URL: ${base}`, { cause: e as unknown });
    }

    const maxRetries = 5;
    const retryDelay = 2000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutMs = 10_000;
        const t = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await fetch(url, {
                ...init,
                signal: controller.signal,
                cache: 'no-store',
            });
        } catch (e) {
            const isRetryable =
                e instanceof Error &&
                (e.name === 'AbortError' ||
                    e.message.includes('ECONNREFUSED') ||
                    e.message.includes('fetch failed'));

            if (attempt < maxRetries && isRetryable) {
                console.log(`[zkeyFetch] Attempt ${attempt + 1} failed. Retrying in ${retryDelay}ms... (Error: ${e instanceof Error ? e.message : String(e)})`);
                await new Promise((resolve) => setTimeout(resolve, retryDelay));
                continue;
            }
            throw new Error(`Failed to reach ZKey service at ${base}. Is it running and reachable?`, { cause: e as unknown });
        } finally {
            clearTimeout(t);
        }
    }
    throw new Error(`Failed to reach ZKey service at ${base} after ${maxRetries} retries.`);
}

async function handleResponse(response: Response) {
    if (!response.ok) {
        let errorMessage = 'An error occurred';
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || JSON.stringify(errorData);
        } catch {
            errorMessage = await response.text();
        }
        return { success: false, error: errorMessage, statusCode: response.status };
    }
    try {
        const data = await response.json();
        return { success: true, data };
    } catch {
        return { success: true, data: null };
    }
}

export async function requestOtpAction(identifier: string, type: 'phone' | 'email', clientId: string) {
    const response = await zkeyFetch('/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, type, clientId }),
    });
    return handleResponse(response);
}

export async function loginWithPasswordAction(interactionId: string, email: string, password: string) {
    const response = await zkeyFetch('/auth/interaction/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionId, email, password }),
    });
    return handleResponse(response);
}

export async function loginWithUserIdAction(interactionId: string, userId: string) {
    const response = await zkeyFetch('/auth/interaction/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionId, userId }),
    });
    return handleResponse(response);
}

export async function loginWithOtpAction(interactionId: string, identifier: string, code: string) {
    // First verify OTP to get userId
    const verifyResponse = await zkeyFetch('/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code }),
    });

    const verifyResult = await handleResponse(verifyResponse);
    if (!verifyResult.success) return verifyResult;

    const { accessToken } = verifyResult.data;

    // Decode JWT to get userId (simple base64 decode of payload)
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const userId = payload.sub;

    // Now complete the interaction
    const loginResponse = await zkeyFetch('/auth/interaction/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionId, userId }),
    });

    return handleResponse(loginResponse);
}

export async function loginWithWalletAction(interactionId: string, address: string, signature: string) {
    // First verify wallet signature to get userId
    const verifyResponse = await zkeyFetch('/auth/wallet/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature }),
    });

    const verifyResult = await handleResponse(verifyResponse);
    if (!verifyResult.success) return verifyResult;

    const { accessToken } = verifyResult.data;

    // Decode JWT to get userId
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const userId = payload.sub;

    // Now complete the interaction
    const loginResponse = await zkeyFetch('/auth/interaction/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionId, userId }),
    });

    return handleResponse(loginResponse);
}

export async function getInteractionDetails(interactionId: string) {
    const response = await zkeyFetch(`/auth/interaction/${interactionId}`);
    const result = await handleResponse(response);
    if (!result.success) throw new Error(result.error); // Keep throw for initial load to trigger error boundary
    return result.data;
}

export async function registerAction(
    interactionId: string,
    email: string,
    firstName: string,
    lastName: string,
    phone: string,
    walletAddress?: string,
    signature?: string,
) {
    const response = await zkeyFetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName, phone, walletAddress, signature, clientId: interactionId }),
    });
    return handleResponse(response);
}

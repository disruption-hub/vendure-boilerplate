"use server";

const ZKEY_SERVICE_URL = process.env.ZKEY_SERVICE_URL || 'http://localhost:3002';

export async function requestOtpAction(identifier: string, type: 'phone' | 'email', clientId: string) {
    const response = await fetch(`${ZKEY_SERVICE_URL}/auth/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, type, clientId }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to send OTP');
    }

    return response.json();
}

export async function loginWithPasswordAction(interactionId: string, email: string, password: string) {
    const response = await fetch(`${ZKEY_SERVICE_URL}/auth/interaction/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionId, email, password }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Login failed');
    }

    return response.json();
}
export async function loginWithUserIdAction(interactionId: string, userId: string) {
    const response = await fetch(`${ZKEY_SERVICE_URL}/auth/interaction/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionId, userId }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Login failed');
    }

    return response.json();
}

export async function loginWithOtpAction(interactionId: string, identifier: string, code: string) {
    // First verify OTP to get userId
    const verifyResponse = await fetch(`${ZKEY_SERVICE_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code }),
    });

    if (!verifyResponse.ok) {
        const error = await verifyResponse.text();
        throw new Error(error || 'OTP verification failed');
    }

    const { accessToken } = await verifyResponse.json();

    // Decode JWT to get userId (simple base64 decode of payload)
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const userId = payload.sub;

    // Now complete the interaction
    const loginResponse = await fetch(`${ZKEY_SERVICE_URL}/auth/interaction/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionId, userId }),
    });

    if (!loginResponse.ok) {
        const error = await loginResponse.text();
        throw new Error(error || 'Failed to complete login');
    }

    return loginResponse.json();
}

export async function loginWithWalletAction(interactionId: string, address: string, signature: string) {
    // First verify wallet signature to get userId
    const verifyResponse = await fetch(`${ZKEY_SERVICE_URL}/auth/wallet/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature }),
    });

    if (!verifyResponse.ok) {
        const error = await verifyResponse.text();
        throw new Error(error || 'Wallet verification failed');
    }

    const { accessToken } = await verifyResponse.json();

    // Decode JWT to get userId
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const userId = payload.sub;

    // Now complete the interaction
    const loginResponse = await fetch(`${ZKEY_SERVICE_URL}/auth/interaction/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionId, userId }),
    });

    if (!loginResponse.ok) {
        const error = await loginResponse.text();
        throw new Error(error || 'Failed to complete login');
    }

    return loginResponse.json();
}

export async function getInteractionDetails(interactionId: string) {
    const response = await fetch(`${ZKEY_SERVICE_URL}/auth/interaction/${interactionId}`);

    if (!response.ok) {
        throw new Error('Failed to fetch interaction details');
    }

    return response.json();
}

export async function registerAction(email: string, firstName: string, lastName: string, phone: string) {
    const response = await fetch(`${ZKEY_SERVICE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName, phone }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Registration failed');
    }

    return response.json();
}

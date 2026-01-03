import { zkeyClient } from './zkey-client';

/**
 * Functional wrapper around ZKeyClient for cleaner server action imports
 */

export async function requestOtp(identifier: string, type: 'email' | 'phone') {
    return zkeyClient.requestOtp(identifier, type);
}

export async function verifyOtp(identifier: string, code: string) {
    return zkeyClient.verifyOtp(identifier, code);
}

export async function getWalletNonce(address: string) {
    return zkeyClient.getWalletNonce(address);
}

export async function loginWithWallet(address: string, signature: string) {
    return zkeyClient.loginWithWallet(address, signature);
}

export async function register(email: string, firstName: string, lastName: string, phone: string, password?: string) {
    return zkeyClient.register(email, firstName, lastName, phone, password);
}

export async function login(email: string, password: string) {
    return zkeyClient.login(email, password);
}

export async function getProfile(token: string) {
    return zkeyClient.getProfile(token);
}

export async function updateProfile(token: string, data: { firstName?: string; lastName?: string; phone?: string; walletAddress?: string }) {
    return zkeyClient.updateProfile(token, data);
}

export async function unlinkWallet(token: string) {
    return zkeyClient.unlinkWallet(token);
}

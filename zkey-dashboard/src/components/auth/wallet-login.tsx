"use client";

import { Button } from "@/components/ui/button";
import { Wallet, Loader2 } from "lucide-react";
import { useState } from "react";
import freighter from "@stellar/freighter-api";

interface WalletLoginProps {
    onWalletLogin: (address: string, signature: string) => Promise<void>;
    buttonLabel?: string;
    missingExtensionMessage?: string;
    couldNotGetAddressMessage?: string;
    failedToGetNonceMessage?: string;
    walletSigningFailedMessage?: string;
    failedToLoginMessage?: string;
    onError?: (message: string) => void;
}

export function WalletLogin({
    onWalletLogin,
    buttonLabel,
    missingExtensionMessage,
    couldNotGetAddressMessage,
    failedToGetNonceMessage,
    walletSigningFailedMessage,
    failedToLoginMessage,
    onError,
}: WalletLoginProps) {
    const [isLoading, setIsLoading] = useState(false);

    const errorToMessage = (err: unknown) => {
        if (err instanceof Error) return err.message;
        if (typeof err === 'string') return err;
        if (err && typeof err === 'object') {
            const anyErr = err as any;
            if (typeof anyErr.message === 'string') return anyErr.message;
            if (anyErr.error) return errorToMessage(anyErr.error);
            try {
                return JSON.stringify(anyErr);
            } catch {
                return String(anyErr);
            }
        }
        return String(err);
    };

    const isUserRejected = (err: unknown) => {
        const msg = errorToMessage(err).toLowerCase();
        return msg.includes('rejected') || msg.includes('user rejected') || msg.includes('canceled') || msg.includes('cancelled');
    };

    const getFreighterAddress = async (): Promise<string | null> => {
        const connected = await freighter.isConnected();
        if ((connected as any)?.error) {
            onError?.(errorToMessage((connected as any).error));
            return null;
        }
        if (!(connected as any)?.isConnected) {
            onError?.(missingExtensionMessage || 'Freighter wallet extension not found. Please install it first.');
            return null;
        }

        const addressObj = await freighter.getAddress();
        if ((addressObj as any)?.error) {
            const e = (addressObj as any).error;
            if (isUserRejected(e)) return null;
            onError?.(errorToMessage(e));
            return null;
        }
        const addr = (addressObj as any)?.address as string | undefined;
        if (addr) return addr;

        // If the app is not yet allowed, getAddress() returns an empty string. Prompt user.
        const accessObj = await freighter.requestAccess();
        if ((accessObj as any)?.error) {
            const e = (accessObj as any).error;
            if (isUserRejected(e)) return null;
            onError?.(errorToMessage(e));
            return null;
        }
        const accessAddr = (accessObj as any)?.address as string | undefined;
        if (accessAddr) return accessAddr;

        onError?.(couldNotGetAddressMessage || 'Could not get address from Freighter');
        return null;
    };

    const handleWalletLogin = async () => {
        setIsLoading(true);
        try {
            // 1. Ensure address (prompts via requestAccess if needed)
            const address = await getFreighterAddress();
            if (!address) return;

            // 2. Get Nonce from ZKey
            const nonceResponse = await fetch(`${process.env.NEXT_PUBLIC_ZKEY_URL || 'http://localhost:3002'}/auth/nonce/${address}`);
            const { nonce } = await nonceResponse.json();
            if (!nonce) {
                onError?.(failedToGetNonceMessage || 'Failed to get nonce from server');
                return;
            }

            // 3. Sign Nonce with Freighter
            let signResult: any;
            try {
                signResult = await freighter.signMessage(nonce, { address });
            } catch (e) {
                if (isUserRejected(e)) return;
                onError?.(errorToMessage(e));
                return;
            }

            if (signResult?.error) {
                const e = signResult.error;
                if (isUserRejected(e)) return;
                onError?.(errorToMessage(e));
                return;
            }

            const signature = signResult?.signedMessage || signResult;
            if (!signature) {
                onError?.(walletSigningFailedMessage || 'Wallet signing failed');
                return;
            }

            // 4. Call parent handler
            await onWalletLogin(address, signature);
        } catch (err: any) {
            if (isUserRejected(err)) return;
            onError?.(errorToMessage(err) || failedToLoginMessage || 'Failed to login with wallet');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            className="w-full h-12 flex items-center justify-center gap-2 font-bold rounded-xl zkey-primary-btn"
            onClick={handleWalletLogin}
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin zkey-spinner--on-primary" />
            ) : (
                <>
                    <Wallet className="h-5 w-5" />
                    <span>{buttonLabel || 'Login with Stellar Wallet'}</span>
                </>
            )}
        </Button>
    );
}

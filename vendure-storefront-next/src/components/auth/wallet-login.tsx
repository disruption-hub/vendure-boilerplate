"use client";

import { Button } from "@/components/ui/button";
import { Wallet, Loader2 } from "lucide-react";
import { useState } from "react";
import freighter from "@stellar/freighter-api";
import { toast } from "sonner";
import { getWalletNonceAction } from "@/app/sign-in/actions";
import { useRouter } from "next/navigation";
import { loginWithWalletAction } from "@/app/sign-in/actions";

export function WalletLogin() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

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

    const handleWalletLogin = async () => {
        setIsLoading(true);
        try {
            // 1. Ensure address (prompts via requestAccess if needed)
            const connected = await freighter.isConnected();
            if ((connected as any)?.error) {
                toast.error(errorToMessage((connected as any).error));
                return;
            }
            if (!(connected as any)?.isConnected) {
                toast.error("Freighter wallet extension not found. Please install it first.");
                return;
            }

            const addressObj = await freighter.getAddress();
            if ((addressObj as any)?.error) {
                const e = (addressObj as any).error;
                if (isUserRejected(e)) return;
                toast.error(errorToMessage(e));
                return;
            }
            let address = (addressObj as any)?.address as string | undefined;
            if (!address) {
                const accessObj = await freighter.requestAccess();
                if ((accessObj as any)?.error) {
                    const e = (accessObj as any).error;
                    if (isUserRejected(e)) return;
                    toast.error(errorToMessage(e));
                    return;
                }
                address = (accessObj as any)?.address as string | undefined;
            }
            if (!address) {
                toast.error("Could not get address from Freighter");
                return;
            }

            // 2. Get Nonce from ZKey
            const { nonce } = await getWalletNonceAction(address);
            if (!nonce) {
                toast.error("Failed to get nonce from server");
                return;
            }

            // 3. Sign Nonce with Freighter
            let signResult: any;
            try {
                signResult = await freighter.signMessage(nonce, { address });
            } catch (e) {
                if (isUserRejected(e)) return;
                toast.error(errorToMessage(e));
                return;
            }

            if (signResult?.error) {
                const e = signResult.error;
                if (isUserRejected(e)) return;
                toast.error(errorToMessage(e));
                return;
            }

            const signature = signResult?.signedMessage || signResult;
            if (!signature) {
                toast.error("Wallet signing failed");
                return;
            }

            // 4. Login to ZKey
            const res = await loginWithWalletAction(address, signature);
            if (!res?.success) throw new Error(res?.error || "Failed to login with wallet");

            toast.success("Wallet login successful!");
            router.push("/");
        } catch (err: any) {
            if (isUserRejected(err)) return;
            toast.error(err.message || "Failed to login with wallet");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            className="w-full h-12 flex items-center justify-center gap-2 border-white/20 bg-white/5 hover:bg-white/10 text-white"
            onClick={handleWalletLogin}
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
                <>
                    <Wallet className="h-5 w-5" />
                    <span>Login with Stellar Wallet</span>
                </>
            )}
        </Button>
    );
}

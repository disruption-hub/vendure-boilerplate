"use client";

import { Button } from "@/components/ui/button";
import { Wallet, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface WalletLoginProps {
    onWalletLogin: (address: string, signature: string) => Promise<void>;
}

export function WalletLogin({ onWalletLogin }: WalletLoginProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleWalletLogin = async () => {
        setIsLoading(true);
        try {
            // Check if Freighter is available
            if (!(window as any).freighter) {
                throw new Error("Freighter wallet extension not found. Please install it first.");
            }

            const freighter = (window as any).freighter;

            // 1. Get Address from Freighter
            const { address, error } = await freighter.getAddress();
            if (error || !address) throw new Error(error || "Could not get address from Freighter");

            // 2. Get Nonce from ZKey
            const nonceResponse = await fetch(`${process.env.NEXT_PUBLIC_ZKEY_URL || 'http://localhost:3002'}/auth/nonce/${address}`);
            const { nonce } = await nonceResponse.json();
            if (!nonce) throw new Error("Failed to get nonce from server");

            // 3. Sign Nonce with Freighter
            const signResult = await freighter.signMessage(nonce);
            const signature = (signResult as any).signedMessage || signResult;
            if (!signature) throw new Error("Wallet signing failed");

            // 4. Call parent handler
            await onWalletLogin(address, signature);

            toast.success("Wallet login successful!");
        } catch (err: any) {
            console.error(err);
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

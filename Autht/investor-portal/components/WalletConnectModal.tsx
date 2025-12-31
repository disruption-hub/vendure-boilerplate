'use client';

import { Wallet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useWallet } from '@/lib/stellar-wallet-context';
import { useEffect } from 'react';

interface WalletConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnect: (publicKey: string, walletType: string) => void;
}

export default function WalletConnectModal({ isOpen, onClose, onConnect }: WalletConnectModalProps) {
    const { connectWallet, isConnecting, publicKey } = useWallet();

    // Auto-close and trigger onConnect when wallet is connected
    useEffect(() => {
        if (publicKey && isOpen) {
            onConnect(publicKey, 'stellar'); // Generic type since stellar-wallets-kit handles multiple wallets
            onClose();
        }
    }, [publicKey, isOpen, onConnect, onClose]);

    const handleConnect = async () => {
        try {
            await connectWallet();
            // The stellar-wallets-kit modal will handle wallet selection
            // Once connected, publicKey will update and trigger the useEffect above
        } catch (err: any) {
            toast.error(err.message || 'Failed to connect wallet');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass rounded-3xl p-8 border border-white/10 max-w-md w-full relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <X className="w-5 h-5 text-brand-slate" />
                </button>

                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-brand-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Wallet className="w-7 h-7 text-brand-gold" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Connect Stellar Wallet</h2>
                    <p className="text-brand-slate text-sm">
                        Connect your wallet to access the investor portal
                    </p>
                </div>

                <Button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full h-14 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-bold"
                >
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>

                <p className="text-center text-brand-slate text-xs mt-6">
                    Don't have a wallet?{' '}
                    <a
                        href="https://freighter.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-gold hover:underline"
                    >
                        Get Freighter
                    </a>
                </p>
            </div>
        </div>
    );
}

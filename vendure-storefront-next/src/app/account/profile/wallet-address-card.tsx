"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTransition } from 'react';
import { unlinkWalletAction } from './actions';

export default function WalletAddressCard({ walletAddress }: { walletAddress: string | null }) {
    const [isPending, startTransition] = useTransition();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Wallet address</CardTitle>
                <CardDescription>
                    Manage your linked Stellar wallet.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm">
                    {walletAddress ? (
                        <div className="font-mono break-all">{walletAddress}</div>
                    ) : (
                        <div className="text-muted-foreground">No wallet linked</div>
                    )}
                </div>

                <Button
                    type="button"
                    variant="destructive"
                    disabled={!walletAddress || isPending}
                    onClick={() => {
                        startTransition(async () => {
                            await unlinkWalletAction();
                        });
                    }}
                >
                    {isPending ? 'Unlinking…' : 'Unlink wallet'}
                </Button>
            </CardContent>
        </Card>
    );
}

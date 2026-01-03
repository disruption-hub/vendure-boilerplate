'use client';

import { useActionState, useEffect, useState } from 'react';
import {
    updateCustomerAction,
    unlinkWalletAction,
    linkWalletAction,
    getNonceAction
} from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Wallet, Unlink, Loader2 } from 'lucide-react';
import freighter from "@stellar/freighter-api";

interface EditProfileFormProps {
    customer: {
        firstName: string;
        lastName: string;
        phoneNumber?: string | null;
    } | null;
}

export function EditProfileForm({ customer }: EditProfileFormProps) {
    const [state, formAction, isPending] = useActionState(updateCustomerAction, undefined);
    const [isUnlinking, setIsUnlinking] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);

    const walletAddress = (customer as any)?.customFields?.walletAddress;

    useEffect(() => {
        if (state?.success) {
            toast.success('Profile updated successfully!');
        } else if (state?.error) {
            toast.error(state.error);
        }
    }, [state]);

    const handleUnlink = async () => {
        setIsUnlinking(true);
        setShowUnlinkDialog(false);
        try {
            const res = await unlinkWalletAction();
            if (res.success) {
                toast.success('Wallet unlinked successfully');
            } else {
                toast.error(res.error || 'Failed to unlink wallet');
            }
        } catch (e) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsUnlinking(false);
        }
    };

    const handleLink = async () => {
        setIsLinking(true);
        try {
            // 1. Check Freighter
            const connected = await freighter.isConnected();
            if ((connected as any)?.error) {
                toast.error((connected as any).error?.message || "Freighter error");
                return;
            }
            if (!(connected as any)?.isConnected) {
                toast.error("Freighter wallet extension not found. Please install it first.");
                return;
            }

            // 2. Get Address (with requestAccess fallback)
            const addressObj = await freighter.getAddress();
            if ((addressObj as any)?.error) {
                toast.error((addressObj as any).error?.message || "Failed to get address");
                return;
            }

            let address = (addressObj as any)?.address as string | undefined;
            if (!address) {
                // Request access if address not available
                const accessObj = await freighter.requestAccess();
                if ((accessObj as any)?.error) {
                    const errorMsg = (accessObj as any).error?.message;
                    if (errorMsg?.toLowerCase().includes('rejected') || errorMsg?.toLowerCase().includes('canceled')) {
                        return; // User cancelled, don't show error
                    }
                    toast.error(errorMsg || "Failed to request wallet access");
                    return;
                }
                address = (accessObj as any)?.address as string | undefined;
            }

            if (!address) {
                toast.error("Could not get address from Freighter");
                return;
            }

            // 3. Get Nonce
            const { nonce } = await getNonceAction(address);
            if (!nonce) {
                toast.error("Failed to get nonce from server");
                return;
            }

            // 4. Sign Nonce
            let signResult: any;
            try {
                signResult = await freighter.signMessage(nonce, { address });
            } catch (e: any) {
                const errorMsg = e?.message || String(e);
                if (errorMsg.toLowerCase().includes('rejected') || errorMsg.toLowerCase().includes('canceled')) {
                    return; // User cancelled, don't show error
                }
                toast.error(errorMsg);
                return;
            }

            if (signResult?.error) {
                const errorMsg = signResult.error?.message || String(signResult.error);
                if (errorMsg.toLowerCase().includes('rejected') || errorMsg.toLowerCase().includes('canceled')) {
                    return;
                }
                toast.error(errorMsg);
                return;
            }

            const signature = signResult?.signedMessage || signResult;
            if (!signature) {
                toast.error("Wallet signing failed");
                return;
            }

            // 5. Link in ZKey
            const res = await linkWalletAction(address, signature);
            if (res.success) {
                toast.success('Wallet linked successfully');
            } else {
                toast.error(res.error || 'Failed to link wallet');
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to connect wallet');
        } finally {
            setIsLinking(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                    Update your personal details.
                </CardDescription>
            </CardHeader>
            <form id="edit-profile-form" action={formAction}>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                name="firstName"
                                type="text"
                                placeholder="John"
                                defaultValue={customer?.firstName || ''}
                                required
                                disabled={isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                name="lastName"
                                type="text"
                                placeholder="Doe"
                                defaultValue={customer?.lastName || ''}
                                required
                                disabled={isPending}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            placeholder="+1234567890"
                            defaultValue={customer?.phoneNumber || ''}
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="walletAddress">Stellar Wallet Address</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    id="walletAddress"
                                    name="walletAddress"
                                    value={walletAddress || ''}
                                    placeholder="No wallet linked"
                                    readOnly
                                    className="bg-muted font-mono text-xs pr-10"
                                />
                                {walletAddress && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                                        <Wallet className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                            {walletAddress ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="text-destructive hover:text-destructive border-white/10"
                                    onClick={() => setShowUnlinkDialog(true)}
                                    disabled={isUnlinking}
                                    title="Unlink wallet"
                                >
                                    {isUnlinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="gap-2 border-white/10"
                                    onClick={handleLink}
                                    disabled={isLinking}
                                >
                                    {isLinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                                    Link Wallet
                                </Button>
                            )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            {walletAddress
                                ? "This wallet is linked to your ZKey identity."
                                : "Link your Stellar wallet to enable blockchain features."}
                        </p>
                    </div>

                    <Button type="submit" disabled={isPending} className="w-full md:w-auto">
                        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : 'Update Profile'}
                    </Button>
                </CardContent>
            </form>

            <AlertDialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unlink Wallet?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to unlink your Stellar wallet? This will remove the wallet address from your profile and you'll need to link it again to use blockchain features.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleUnlink}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Unlink Wallet
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}

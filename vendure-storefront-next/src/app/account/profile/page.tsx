import type {Metadata} from 'next';
import { getActiveCustomer } from '@/lib/vendure/actions';

export const metadata: Metadata = {
    title: 'Profile',
};
import { ChangePasswordForm } from './change-password-form';
import { EditProfileForm } from './edit-profile-form';
import { EditEmailForm } from './edit-email-form';
import WalletAddressCard from './wallet-address-card';

function getWalletAddressFromCustomFields(customFields: unknown): string | null {
    if (!customFields) return null;

    if (typeof customFields === 'string') {
        try {
            return getWalletAddressFromCustomFields(JSON.parse(customFields));
        } catch {
            return null;
        }
    }

    if (typeof customFields === 'object') {
        const walletAddress = (customFields as any)?.walletAddress;
        return typeof walletAddress === 'string' && walletAddress.trim() ? walletAddress : null;
    }

    return null;
}

export default async function ProfilePage(_props: PageProps<'/account/profile'>) {
    const customer = await getActiveCustomer();
    const walletAddress = getWalletAddressFromCustomFields((customer as any)?.customFields);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Profile</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account information
                </p>
            </div>

            <EditProfileForm customer={customer} />

            <EditEmailForm currentEmail={customer?.emailAddress || ''} />

            <WalletAddressCard walletAddress={walletAddress} />

            <ChangePasswordForm />
        </div>
    );
}

import { getActiveCustomer } from '@/app/providers/account-data';
import { SignOutButton } from '@/app/components/account/SignOutButton';
import { redirect } from 'next/navigation';

export default async function AccountPage() {
    const customer = await getActiveCustomer();

    if (!customer) {
        redirect('/sign-in');
    }

    const { firstName, lastName, emailAddress } = customer;

    return (
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-24 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:max-w-none">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Account</h1>
                    <SignOutButton />
                </div>

                <div className="mt-10 border-t border-gray-200 pt-10">
                    <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                    <dl className="mt-6 space-y-6 text-sm sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6 sm:space-y-0">
                        <div className="sm:col-span-1">
                            <dt className="font-medium text-gray-500">Full name</dt>
                            <dd className="mt-1 text-gray-900">{firstName} {lastName}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="font-medium text-gray-500">Email address</dt>
                            <dd className="mt-1 text-gray-900">{emailAddress}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
}

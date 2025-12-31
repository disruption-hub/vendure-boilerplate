'use server';

import { mutate } from '@/lib/vendure/api';
import { RegisterCustomerAccountMutation } from '@/lib/vendure/mutations';
import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';

export async function registerAction(prevState: { error?: string } | undefined, formData: FormData) {
    const emailAddress = formData.get('emailAddress') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const countryCode = formData.get('countryCode') as string;
    const rawPhoneNumber = formData.get('phoneNumber') as string;
    const redirectTo = formData.get('redirectTo') as string | null;

    if (!emailAddress || !firstName || !lastName || !rawPhoneNumber) {
        return { error: 'All fields are required' };
    }

    // Combine country code and phone number
    const phoneNumber = `${countryCode}${rawPhoneNumber.replace(/\s+/g, '')}`;

    // Generate a random 32-character hex password
    const password = randomBytes(16).toString('hex');

    const result = await mutate(RegisterCustomerAccountMutation, {
        input: {
            emailAddress,
            firstName,
            lastName,
            phoneNumber,
            password,
        }
    });

    const registerResult = result.data.registerCustomerAccount;

    if (registerResult.__typename !== 'Success') {
        return { error: registerResult.message };
    }

    // Redirect to verification pending page, preserving redirectTo if present
    const verifyUrl = redirectTo
        ? `/verify-pending?redirectTo=${encodeURIComponent(redirectTo)}`
        : '/verify-pending';

    redirect(verifyUrl);
}

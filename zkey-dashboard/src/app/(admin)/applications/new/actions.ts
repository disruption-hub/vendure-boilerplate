"use server";

import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

function processFormDataUrls(formData: FormData, key: string): string[] {
    const raw = formData.getAll(key);
    if (raw.length === 1 && typeof raw[0] === 'string' && raw[0].includes(',')) {
        return (raw[0] as string).split(',').map(s => s.trim()).filter(Boolean);
    }
    return raw.map(s => (s as string).trim()).filter(Boolean);
}

export async function createApplication(formData: FormData) {
    const name = formData.get("name") as string;
    const tenantId = formData.get("tenantId") as string;

    if (!name || !tenantId) {
        throw new Error("Name and Tenant are required");
    }

    const corsOrigins = processFormDataUrls(formData, 'corsOrigins');
    const redirectUris = processFormDataUrls(formData, 'redirectUris');
    const postLogoutRedirectUris = processFormDataUrls(formData, 'postLogoutRedirectUris');

    const vendureEnabled = formData.get('vendureEnabled') === 'on';
    const vendureAdminApiUrl = ((formData.get('vendureAdminApiUrl') as string | null) ?? '').trim();
    const vendureAuthTokenHeader = ((formData.get('vendureAuthTokenHeader') as string | null) ?? '').trim();
    const vendureAdminApiToken = ((formData.get('vendureAdminApiToken') as string | null) ?? '').trim();
    const vendureSuperadminUsername = ((formData.get('vendureSuperadminUsername') as string | null) ?? '').trim();
    const vendureSuperadminPassword = ((formData.get('vendureSuperadminPassword') as string | null) ?? '').trim();

    const vendure: any = {
        enabled: vendureEnabled,
        adminApiUrl: vendureAdminApiUrl || null,
        authTokenHeader: vendureAuthTokenHeader || null,
        adminApiToken: vendureAdminApiToken || null,
        superadminUsername: vendureSuperadminUsername || null,
        superadminPassword: vendureSuperadminPassword || null,
    };

    if (vendureEnabled) {
        if (!vendure.adminApiUrl) throw new Error('Vendure is enabled: Vendure Admin API URL is required');
        const hasToken = !!vendure.adminApiToken;
        const hasUserPass = !!vendure.superadminUsername && !!vendure.superadminPassword;
        if (!hasToken && !hasUserPass) {
            throw new Error('Vendure is enabled: provide either Admin API Token OR Superadmin Username + Password');
        }
    }

    const integrations = {
        brevoApiKey: (formData.get('brevoApiKey') as string) || null,
        brevoSenderEmail: (formData.get('brevoSenderEmail') as string) || null,
        brevoSenderName: (formData.get('brevoSenderName') as string) || null,
        labsmobileApiKey: (formData.get('labsmobileApiKey') as string) || null,
        labsmobileUser: (formData.get('labsmobileUser') as string) || null,
        labsmobileUrl: (formData.get('labsmobileUrl') as string) || null,
        labsmobileSenderId: (formData.get('labsmobileSenderId') as string) || null,
        vendure,
    };

    // Extract branding
    const branding = {
        logo: formData.get("logo") as string || null,
        primaryColor: formData.get("primaryColor") as string || null,
        backgroundColor: formData.get("backgroundColor") as string || null,
        loginTitle: formData.get("loginTitle") as string || null,
        loginSubtitle: formData.get("loginSubtitle") as string || null,
    };

    try {
        const application = await prisma.application.create({
            data: {
                name,
                description: formData.get("description") as string || null,
                tenantId,
                clientId: uuidv4(),
                clientSecret: uuidv4().replace(/-/g, ''), // Simpler secret for now
                corsOrigins,
                redirectUris,
                postLogoutRedirectUris,
                authMethods: { password: true, emailOtp: false, smsOtp: false, wallet: false, registrationOtp: 'email' },
                integrations,
                branding,
                logo: branding.logo,
                primaryColor: branding.primaryColor,
                // Token & Session Settings
                alwaysIssueRefreshToken: formData.get("alwaysIssueRefreshToken") === "on",
                rotateRefreshToken: formData.get("rotateRefreshToken") === "on",
                refreshTokenTtl: parseInt(formData.get("refreshTokenTtl") as string || "14"),
                backchannelLogoutUri: formData.get("backchannelLogoutUri") as string || null,
                isSessionRequired: formData.get("isSessionRequired") === "on",
            },
        });
        return application;
    } catch (error: any) {
        throw new Error(`Failed to create application: ${error.message}`);
    }
}

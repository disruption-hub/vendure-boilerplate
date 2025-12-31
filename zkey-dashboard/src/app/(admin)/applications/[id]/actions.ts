"use server";

import { prisma } from "@/lib/prisma";

export async function updateApplication(id: string, formData: FormData) {
    const name = formData.get("name") as string;
    const tenantId = formData.get("tenantId") as string;
    const corsOriginsStr = formData.getAll("corsOrigins");
    const redirectUrisStr = formData.getAll("redirectUris");
    const postLogoutRedirectUrisStr = formData.getAll("postLogoutRedirectUris");

    if (!name || !tenantId) {
        throw new Error("Name and Tenant are required");
    }

    const corsOrigins = corsOriginsStr.map(s => (s as string).trim()).filter(Boolean);
    const redirectUris = redirectUrisStr.map(s => (s as string).trim()).filter(Boolean);
    const postLogoutRedirectUris = postLogoutRedirectUrisStr.map(s => (s as string).trim()).filter(Boolean);

    // Extract auth methods
    const authMethods = {
        password: formData.get("auth_password") === "on",
        otp: formData.get("auth_otp") === "on",
        wallet: formData.get("auth_wallet") === "on",
    };

    try {
        await prisma.application.update({
            where: { id },
            data: {
                name,
                tenantId,
                corsOrigins,
                redirectUris,
                postLogoutRedirectUris,
                authMethods,
                brevoApiKey: formData.get("brevoApiKey") as string || null,
                brevoSenderEmail: formData.get("brevoSenderEmail") as string || null,
                brevoSenderName: formData.get("brevoSenderName") as string || null,
                labsmobileApiKey: formData.get("labsmobileApiKey") as string || null,
                labsmobileUser: formData.get("labsmobileUser") as string || null,
                labsmobileUrl: formData.get("labsmobileUrl") as string || null,
                labsmobileSenderId: formData.get("labsmobileSenderId") as string || null,
            },
        });
    } catch (error) {
        throw new Error(`Failed to update application: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

export async function createApplication(formData: FormData) {
    const name = formData.get("name") as string;
    const tenantId = formData.get("tenantId") as string;
    const corsOriginsStr = formData.getAll("corsOrigins");
    const redirectUrisStr = formData.getAll("redirectUris");
    const postLogoutRedirectUrisStr = formData.getAll("postLogoutRedirectUris");

    if (!name || !tenantId) {
        throw new Error("Name and Tenant are required");
    }

    const corsOrigins = corsOriginsStr.map(s => (s as string).trim()).filter(Boolean);
    const redirectUris = redirectUrisStr.map(s => (s as string).trim()).filter(Boolean);
    const postLogoutRedirectUris = postLogoutRedirectUrisStr.map(s => (s as string).trim()).filter(Boolean);

    try {
        const application = await prisma.application.create({
            data: {
                name,
                tenantId,
                corsOrigins,
                redirectUris,
                postLogoutRedirectUris,
                authMethods: { password: true, otp: false, wallet: false },
                brevoApiKey: formData.get("brevoApiKey") as string || null,
                brevoSenderEmail: formData.get("brevoSenderEmail") as string || null,
                brevoSenderName: formData.get("brevoSenderName") as string || null,
                labsmobileApiKey: formData.get("labsmobileApiKey") as string || null,
                labsmobileUser: formData.get("labsmobileUser") as string || null,
                labsmobileUrl: formData.get("labsmobileUrl") as string || null,
                labsmobileSenderId: formData.get("labsmobileSenderId") as string || null,
            },
        });
        return application;
    } catch (error) {
        throw new Error(`Failed to create application: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

export async function deleteApplication(id: string) {
    try {
        await prisma.application.delete({
            where: { id },
        });
    } catch (error) {
        throw new Error(`Failed to delete application: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

"use server";

import { prisma } from "@/lib/prisma";

export async function updateTenant(id: string, formData: FormData) {
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;

    if (!name || !slug) {
        throw new Error("Name and Slug are required");
    }

    try {
        await prisma.tenant.update({
            where: { id },
            data: {
                name,
                slug,
                integrations: {
                    brevoApiKey: formData.get("brevoApiKey") as string || null,
                    brevoSenderEmail: formData.get("brevoSenderEmail") as string || null,
                    brevoSenderName: formData.get("brevoSenderName") as string || null,
                    labsmobileApiKey: formData.get("labsmobileApiKey") as string || null,
                    labsmobileUser: formData.get("labsmobileUser") as string || null,
                    labsmobileUrl: formData.get("labsmobileUrl") as string || null,
                    labsmobileSenderId: formData.get("labsmobileSenderId") as string || null,
                },
                sessionSettings: {
                    ssoEnabled: formData.get("ssoEnabled") === "on",
                    sessionTtl: parseInt(formData.get("sessionTtl") as string) || 1440,
                },
                dashboardUrls: {
                    development: formData.get("dashboardUrlDev") as string || null,
                    production: formData.get("dashboardUrlProd") as string || null,
                },
            },
        });
    } catch (error) {
        throw new Error(`Failed to update tenant: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

export async function createTenant(formData: FormData) {
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;

    if (!name || !slug) {
        throw new Error("Name and Slug are required");
    }

    try {
        const tenant = await prisma.tenant.create({
            data: {
                name,
                slug,
                integrations: {
                    brevoApiKey: formData.get("brevoApiKey") as string || null,
                    brevoSenderEmail: formData.get("brevoSenderEmail") as string || null,
                    brevoSenderName: formData.get("brevoSenderName") as string || null,
                    labsmobileApiKey: formData.get("labsmobileApiKey") as string || null,
                    labsmobileUser: formData.get("labsmobileUser") as string || null,
                    labsmobileUrl: formData.get("labsmobileUrl") as string || null,
                    labsmobileSenderId: formData.get("labsmobileSenderId") as string || null,
                },
                sessionSettings: {
                    ssoEnabled: formData.get("ssoEnabled") === "on",
                    sessionTtl: parseInt(formData.get("sessionTtl") as string) || 1440,
                },
                dashboardUrls: {
                    development: formData.get("dashboardUrlDev") as string || null,
                    production: formData.get("dashboardUrlProd") as string || null,
                },
            },
        });
        return tenant;
    } catch (error) {
        throw new Error(`Failed to create tenant: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

export async function deleteTenant(id: string) {
    try {
        await prisma.tenant.delete({
            where: { id },
        });
    } catch (error) {
        throw new Error(`Failed to delete tenant: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

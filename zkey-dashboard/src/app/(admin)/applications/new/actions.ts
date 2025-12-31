"use server";

import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function createApplication(formData: FormData) {
    const name = formData.get("name") as string;
    const tenantId = formData.get("tenantId") as string;
    const corsOriginsStr = formData.get("corsOrigins") as string;
    const redirectUrisStr = formData.get("redirectUris") as string;

    if (!name || !tenantId) {
        throw new Error("Name and Tenant are required");
    }

    const corsOrigins = corsOriginsStr ? corsOriginsStr.split(",").map(s => s.trim()).filter(Boolean) : [];
    const redirectUris = redirectUrisStr ? redirectUrisStr.split(",").map(s => s.trim()).filter(Boolean) : [];

    // Extract auth methods
    const authMethods = {
        password: formData.get("auth_password") === "on",
        otp: formData.get("auth_otp") === "on",
        wallet: formData.get("auth_wallet") === "on",
    };

    try {
        await prisma.application.create({
            data: {
                name,
                tenantId,
                clientId: uuidv4(),
                clientSecret: uuidv4().replace(/-/g, ''), // Simpler secret for now
                corsOrigins,
                redirectUris,
                authMethods,
                brevoApiKey: formData.get("brevoApiKey") as string || null,
                brevoSenderEmail: formData.get("brevoSenderEmail") as string || null,
                brevoSenderName: formData.get("brevoSenderName") as string || null,
            },
        });
    } catch (error: any) {
        throw new Error(`Failed to create application: ${error.message}`);
    }
}

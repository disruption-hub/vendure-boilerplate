"use server";

import { prisma } from "@/lib/prisma";

export async function createTenant(formData: FormData) {
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;

    if (!name || !slug) {
        throw new Error("Name and slug are required");
    }

    // Basic validation for slug (URL friendly)
    if (!/^[a-z0-9-]+$/.test(slug)) {
        throw new Error("Slug must contain only lowercase letters, numbers, and hyphens");
    }

    try {
        await prisma.tenant.create({
            data: {
                name,
                slug,
            },
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new Error("A tenant with this slug already exists");
        }
        throw new Error(`Failed to create tenant: ${error.message}`);
    }
}

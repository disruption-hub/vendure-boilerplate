"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTenantsWithApplications() {
    return prisma.tenant.findMany({
        include: {
            applications: true,
        },
        orderBy: {
            name: 'asc'
        }
    });
}

export async function updateBranding(type: 'tenant' | 'application', id: string, branding: any) {
    if (type === 'tenant') {
        await prisma.tenant.update({
            where: { id },
            data: { branding }
        });
    } else {
        await prisma.application.update({
            where: { id },
            data: {
                branding,
                // Also update legacy fields for compatibility
                logo: branding.logo || undefined,
                primaryColor: branding.primaryColor || undefined,
            }
        });
    }
    revalidatePath('/branding');
}

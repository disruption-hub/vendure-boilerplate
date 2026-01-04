
import type { Metadata } from 'next';
import Link from 'next/link';
import { Package, User, MapPin, Calendar, Wallet } from 'lucide-react';
import { noIndexRobots } from '@/lib/metadata';

export const metadata: Metadata = {
    robots: noIndexRobots(),
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { getZKeyAuthToken } from "@/lib/auth"
import { zkeyClient } from "@/lib/zkey-client"
import { DashboardSwitcher } from "@/components/layout/dashboard-switcher"

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
    const token = await getZKeyAuthToken();
    const user = token ? await zkeyClient.getProfile(token).catch(() => null) : null;

    return (
        <SidebarProvider>
            <AppSidebar user={user} />
            <main className="flex-1 w-full flex flex-col min-h-screen">
                <div className="p-4 border-b flex items-center gap-4">
                    <SidebarTrigger />
                    <DashboardSwitcher user={user} />
                </div>
                <div className="p-4 flex-1">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    );
}

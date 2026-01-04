import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardSwitcher } from "@/components/layout/dashboard-switcher"

import { getZKeyAuthToken } from "@/lib/auth"
import { zkeyClient } from "@/lib/zkey-client"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const token = await getZKeyAuthToken();
    const user = token ? await zkeyClient.getProfile(token).catch(() => null) : null;

    return (
        <SidebarProvider>
            <AppSidebar user={user} />
            <main className="flex-1 w-full flex flex-col">
                <div className="p-4 border-b flex items-center gap-4">
                    <SidebarTrigger />
                    <DashboardSwitcher user={user} />
                </div>
                <div className="p-4 flex-1">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="flex-1 w-full flex flex-col">
                <div className="p-4 border-b flex items-center gap-4">
                    <SidebarTrigger />
                    <h1 className="font-semibold text-lg">Dashboard</h1>
                </div>
                <div className="p-4 flex-1">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}

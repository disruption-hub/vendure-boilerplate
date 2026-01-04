'use client';

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { Calendar, Home, Settings, User, Users, MapPin, Briefcase, Ticket, Network, Globe } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ZKeyUser } from "@/lib/zkey-client"

const personalItems = [
    {
        title: "Profile",
        url: "/account/profile",
        icon: User,
    },
    {
        title: "Orders",
        url: "/account/orders",
        icon: Briefcase,
    },
    {
        title: "Bookings",
        url: "/account/bookings",
        icon: Calendar,
    },
    {
        title: "Wallet",
        url: "/account/wallet",
        icon: Ticket,
    },
    {
        title: "Addresses",
        url: "/account/addresses",
        icon: MapPin,
    },
]

const teacherItems = [
    {
        title: "Teacher Dashboard",
        url: "/dashboard/teacher",
        icon: Home,
    },
]

const adminItems = [
    {
        title: "Admin Overview",
        url: "/dashboard/admin",
        icon: Settings,
    },
    {
        title: "Nodes (Venues)",
        url: "/dashboard/admin/venues",
        icon: MapPin,
    },
    {
        title: "Schedules",
        url: "/dashboard/admin/schedules",
        icon: Calendar,
    },
    {
        title: "Services",
        url: "/dashboard/admin/services",
        icon: Briefcase,
    },
    {
        title: "Pass Templates",
        url: "/dashboard/admin/pass-templates",
        icon: Ticket,
    },
]

const systemAdminItems = [
    {
        title: "Blueprints (Profiles)",
        url: "/dashboard/system-admin/booking-profiles",
        icon: Settings,
    },
    {
        title: "Federations (Networks)",
        url: "/dashboard/system-admin/venue-networks",
        icon: Network,
    },
]


export function AppSidebar({ user }: { user: ZKeyUser | null }) {
    const pathname = usePathname();
    const isSystemAdmin = user?.roles?.includes('system-admin') || user?.roles?.includes('system_admin');
    const isAdmin = user?.roles?.includes('admin') || isSystemAdmin;
    const isTeacher = user?.roles?.includes('teacher') || isAdmin;

    const isSystemAdminPath = pathname?.startsWith('/dashboard/system-admin');
    const isAdminPath = pathname?.startsWith('/dashboard/admin') && !isSystemAdminPath;
    const isTeacherPath = pathname?.startsWith('/dashboard/teacher');
    const isPersonalPath = pathname?.startsWith('/account') || pathname?.startsWith('/dashboard/user');

    return (
        <Sidebar className="border-r pt-8 pl-4">
            <SidebarContent>
                {isPersonalPath && (
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-sm font-semibold mb-2">Personal</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-1">
                                {personalItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild>
                                            <Link href={item.url} className="px-4 py-2">
                                                <item.icon className="w-5 h-5 mr-3" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {isTeacherPath && (
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-sm font-semibold mb-2">Teacher</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-1">
                                {teacherItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild>
                                            <Link href={item.url} className="px-4 py-2">
                                                <item.icon className="w-5 h-5 mr-3" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {isAdminPath && (
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-sm font-semibold mb-2">Administration</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-1">
                                {adminItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild>
                                            <Link href={item.url} className="px-4 py-2">
                                                <item.icon className="w-5 h-5 mr-3" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {isSystemAdminPath && (
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-sm font-semibold mb-2">System Administration</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-1">
                                {systemAdminItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild>
                                            <Link href={item.url} className="px-4 py-2">
                                                <item.icon className="w-5 h-5 mr-3" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}

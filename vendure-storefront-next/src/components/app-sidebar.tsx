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
import {
    Calendar,
    Settings,
    User,
    LogOut,
    ChevronUp,
    LayoutDashboard,
    Network,
    SquareStack,
    Building2,
    Users,
    MapPin,
    CalendarDays,
    Home,
    Briefcase,
    Ticket,
    Globe,
    Plus,
    BarChart3,
    Search,
} from "lucide-react"
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
        title: "My Schedule",
        url: "/dashboard/teacher",
        icon: Calendar,
    },
    {
        title: "My Profile",
        url: "/dashboard/teacher/profile",
        icon: User,
    },
    {
        title: "Offerings",
        url: "/dashboard/teacher/services",
        icon: Briefcase,
    },
]

const adminItems = [
    {
        title: "Admin Overview",
        url: "/dashboard/admin",
        icon: Settings,
    },
    {
        title: "Sites & Nodes",
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
        title: "Overview",
        url: "/dashboard/system-admin",
        icon: LayoutDashboard,
    },
    {
        title: "Platform Analytics",
        url: "/dashboard/system-admin/analytics",
        icon: BarChart3,
    },
    {
        title: "Node Blueprints",
        url: "/dashboard/system-admin/booking-profiles",
        icon: Settings,
    },
    {
        title: "Federations (Networks)",
        url: "/dashboard/system-admin/venue-networks",
        icon: Network,
    },
    {
        title: "Space Presets",
        url: "/dashboard/system-admin/space-presets",
        icon: SquareStack,
    },
]


export function AppSidebar({ user }: { user: ZKeyUser | null }) {
    const pathname = usePathname();
    const isSystemAdmin = user?.roles?.includes('system-admin');
    const isBookingAdmin = user?.roles?.includes('booking-admin') || isSystemAdmin;
    const isAdmin = user?.roles?.includes('admin') || isBookingAdmin;
    const isProvider = user?.roles?.includes('provider') || user?.roles?.includes('teacher') || isAdmin;

    const isSystemAdminPath = pathname?.startsWith('/dashboard/system-admin');
    const isAdminPath = pathname?.startsWith('/dashboard/admin');
    const isProviderPath = pathname?.startsWith('/dashboard/teacher') || pathname?.startsWith('/dashboard/provider');
    const isPersonalPath = pathname?.startsWith('/account');

    return (
        <Sidebar className="border-r pt-8 pl-4">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-sm font-semibold mb-2">Explore</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1">
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === '/discover'}>
                                    <Link href="/discover" className="px-4 py-2">
                                        <Search className="w-5 h-5 mr-3" />
                                        <span>Global Discover</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
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

                {isProviderPath && (
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-sm font-semibold mb-2">Provider Dashboard (Teacher/Coach)</SidebarGroupLabel>
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
                        <SidebarGroupLabel className="text-sm font-semibold mb-2">Unit Admin (Spaces)</SidebarGroupLabel>
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
                        <SidebarGroupLabel className="text-sm font-semibold mb-2">
                            System Admin (Templates)
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-1">
                                {systemAdminItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={pathname === item.url}>
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

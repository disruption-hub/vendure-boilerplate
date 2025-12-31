"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3,
    Users,
    ShieldCheck,
    Settings,
    Layers,
    LogOut,
    ChevronRight,
    Database,
    PanelLeftClose,
    PanelLeftOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/use-ui-store";

const navigation = [
    { name: "Overview", href: "/", icon: BarChart3 },
    { name: "Tenants", href: "/tenants", icon: Layers },
    { name: "Applications", href: "/applications", icon: ShieldCheck },
    { name: "Users", href: "/users", icon: Users },
    { name: "Global Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { sidebarCollapsed, toggleSidebar } = useUIStore();

    return (
        <div className={cn(
            "flex flex-col border-r bg-white transition-all duration-300",
            sidebarCollapsed ? "w-20" : "w-64"
        )}>
            <div className="flex items-center justify-between h-16 px-6 border-b">
                {!sidebarCollapsed && (
                    <div className="flex items-center animate-in fade-in duration-300">
                        <Database className="w-8 h-8 text-blue-600 mr-2" />
                        <span className="text-xl font-bold tracking-tight">ZKey Admin</span>
                    </div>
                )}
                {sidebarCollapsed && (
                    <Database className="w-8 h-8 text-blue-600 mx-auto" />
                )}
                <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    {sidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            title={sidebarCollapsed ? item.name : undefined}
                            className={cn(
                                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group",
                                isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                                sidebarCollapsed && "justify-center px-0"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-colors",
                                !sidebarCollapsed && "mr-3",
                                isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                            )} />
                            {!sidebarCollapsed && item.name}
                            {isActive && !sidebarCollapsed && (
                                <ChevronRight className="w-4 h-4 ml-auto text-blue-400" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t">
                <button className={cn(
                    "flex items-center w-full px-4 py-3 text-sm font-medium text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors group",
                    sidebarCollapsed && "justify-center px-0"
                )}>
                    <LogOut className={cn(
                        "w-5 h-5 text-slate-400 group-hover:text-red-500",
                        !sidebarCollapsed && "mr-3"
                    )} />
                    {!sidebarCollapsed && "Sign Out"}
                </button>
            </div>
        </div>
    );
}

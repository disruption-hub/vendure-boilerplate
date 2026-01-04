'use client';

import {
    ChevronDown,
    Globe,
    ShieldCheck,
    GraduationCap,
    LayoutDashboard,
    Network,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ZKeyUser } from '@/lib/zkey-client';

export function DashboardSwitcher({ user }: { user: ZKeyUser | null }) {
    const pathname = usePathname();

    const dashboards = [
        {
            name: 'Platform Admin (Templates)',
            href: '/dashboard/system-admin',
            icon: Globe,
            roles: ['system-admin', 'system_admin'],
            active: pathname === '/dashboard/system-admin' || pathname?.includes('/booking-profiles') || pathname?.includes('/space-presets'),
        },
        {
            name: 'Booking Admin (Networks)',
            href: '/dashboard/system-admin/venue-networks',
            icon: Network,
            roles: ['booking-admin', 'booking_admin', 'system-admin', 'system_admin'],
            active: pathname?.includes('/venue-networks'),
        },
        {
            name: 'Unit Admin (Spaces)',
            href: '/dashboard/admin',
            icon: ShieldCheck,
            roles: ['admin', 'booking-admin', 'booking_admin', 'system-admin', 'system_admin'],
            active: pathname?.startsWith('/dashboard/admin'),
        },
        {
            name: 'Provider Dashboard (Teacher/Coach)',
            href: '/dashboard/teacher',
            icon: GraduationCap,
            roles: ['provider', 'teacher'],
            active: pathname?.startsWith('/dashboard/teacher'),
        },
        {
            name: 'Personal Account',
            href: '/account/profile',
            icon: LayoutDashboard,
            roles: ['standard', 'user'],
            active: pathname?.startsWith('/account'),
        },
    ];

    const availableDashboards = dashboards.filter(db =>
        db.roles.some(role => user?.roles?.includes(role)) || db.roles.includes('standard')
    );

    const currentDashboard = dashboards.find(db => db.active) || dashboards[dashboards.length - 1];

    if (availableDashboards.length <= 1) {
        return (
            <h1 className="font-semibold text-lg flex items-center gap-2">
                <currentDashboard.icon className="h-5 w-5 text-muted-foreground" />
                {currentDashboard.name}
            </h1>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-3 gap-2 font-semibold text-lg hover:bg-muted/50 -ml-2">
                    <currentDashboard.icon className="h-5 w-5 text-primary" />
                    <span>{currentDashboard.name}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px]">
                {availableDashboards.map((db) => (
                    <DropdownMenuItem key={db.href} asChild className="py-3 cursor-pointer">
                        <Link href={db.href} className="flex items-center gap-3">
                            <db.icon className={`h-5 w-5 ${db.active ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div className="flex flex-col">
                                <span className={`font-medium ${db.active ? 'text-primary' : ''}`}>{db.name}</span>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Calendar, User, Wallet } from "lucide-react";
import Link from "next/link";
import { getZKeyAuthToken } from "@/lib/auth";
import { getActiveCustomer } from "@/lib/vendure/actions";
import { bookingClient } from "@/lib/booking-client";

export default async function UserDashboard() {
    const token = await getZKeyAuthToken();
    const customer = await getActiveCustomer().catch(() => null);

    let bookingsCount = 0;
    if (token) {
        const bookings = await bookingClient.getMyBookings(token).catch(() => []);
        bookingsCount = bookings.length;
    }

    const cards = [
        {
            title: "Recent Orders",
            value: customer?.orders?.items?.length || 0,
            icon: Package,
            href: "/account/orders",
            label: "View all orders"
        },
        {
            title: "My Bookings",
            value: bookingsCount,
            icon: Calendar,
            href: "/account/bookings",
            label: "Manage bookings"
        },
        {
            title: "Wallet & Passes",
            value: "View",
            icon: Wallet,
            href: "/account/wallet",
            label: "Check balance"
        },
        {
            title: "Profile Settings",
            value: "Edit",
            icon: User,
            href: "/account/profile",
            label: "Update info"
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Welcome back, {customer?.firstName || 'User'}!</h2>
                <p className="text-muted-foreground mt-1">Here is a quick overview of your account activity.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <card.icon className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                            <Link
                                href={card.href}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 inline-block"
                            >
                                {card.label} →
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="bg-slate-50 border rounded-xl p-8 text-center">
                <h3 className="text-lg font-semibold">Ready to book a new session?</h3>
                <p className="text-slate-500 mt-2 max-w-md mx-auto">Explore available venues and schedules to find the perfect time for your next activity.</p>
                <Link
                    href="/search"
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg mt-6 hover:bg-blue-700 transition-colors"
                >
                    Browse Schedules
                </Link>
            </div>
        </div>
    );
}

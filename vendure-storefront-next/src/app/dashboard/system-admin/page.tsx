"use client"

import { useState, useEffect } from "react"
import { LayoutDashboard, Settings, Network, SquareStack, ArrowRight, Building2, Users, CalendarDays, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { bookingClient } from "@/lib/booking-client"
import { getZKeyAuthToken } from "@/lib/auth-client"

export default function SystemAdminOverview() {
    const [stats, setStats] = useState({
        blueprints: 0,
        federations: 0,
        sites: 0,
        presets: 0,
        bookings: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = await getZKeyAuthToken()
                if (!token) return

                const [profiles, networks, venues, presets, bookings] = await Promise.all([
                    bookingClient.getAllBookingProfiles(token),
                    bookingClient.getAllVenueNetworks(token),
                    bookingClient.getAllVenues(),
                    bookingClient.getAllSpacePresets(token),
                    bookingClient.getAllBookings(token)
                ])

                setStats({
                    blueprints: profiles.length,
                    federations: networks.length,
                    sites: venues.length,
                    presets: presets.length,
                    bookings: bookings.length
                })
            } catch (error) {
                console.error("Failed to fetch stats", error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    const cards = [
        {
            title: "Node Blueprints",
            value: stats.blueprints,
            description: "Industry-specific templates",
            icon: Settings,
            href: "/dashboard/system-admin/booking-profiles",
            color: "text-blue-600",
            bg: "bg-blue-100"
        },
        {
            title: "Federations",
            value: stats.federations,
            description: "Shared venue networks",
            icon: Network,
            href: "/dashboard/system-admin/venue-networks",
            color: "text-purple-600",
            bg: "bg-purple-100"
        },
        {
            title: "Space Presets",
            value: stats.presets,
            description: "Reusable room templates",
            icon: SquareStack,
            href: "/dashboard/system-admin/space-presets",
            color: "text-emerald-600",
            bg: "bg-emerald-100"
        },
        {
            title: "Total Sites/Nodes",
            value: stats.sites,
            description: "Active locations globally",
            icon: Building2,
            href: "/dashboard/admin/venues",
            color: "text-orange-600",
            bg: "bg-orange-100"
        }
    ]

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
                <p className="text-muted-foreground">Global orchestration and blueprint management.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => (
                    <Card key={card.title} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <div className={`${card.bg} ${card.color} p-2 rounded-lg`}>
                                <card.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? "..." : card.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                            <Button asChild variant="link" size="sm" className="px-0 mt-4 h-auto text-primary">
                                <Link href={card.href} className="flex items-center">
                                    Manage <ArrowRight className="ml-1 h-3 w-3" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Platform Activity</CardTitle>
                        <CardDescription>Consolidated bookings across all sites.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg m-6 mt-0">
                        <div className="text-center">
                            <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                            <div className="text-xl font-bold">{stats.bookings} Total Bookings</div>
                            <p className="text-sm text-muted-foreground">All-time reservation volume</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common orchestration tasks.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Button asChild variant="outline" className="justify-start h-12">
                            <Link href="/dashboard/system-admin/booking-profiles">
                                <Plus className="mr-2 h-4 w-4" /> Define New Industry Blueprint
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="justify-start h-12">
                            <Link href="/dashboard/system-admin/venue-networks">
                                <Plus className="mr-2 h-4 w-4" /> Create Global Federation
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="justify-start h-12">
                            <Link href="/dashboard/system-admin/space-presets">
                                <Plus className="mr-2 h-4 w-4" /> Configure Space Template
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

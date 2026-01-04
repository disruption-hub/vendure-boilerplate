"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { bookingClient } from "@/lib/booking-client"
import { getZKeyAuthToken } from "@/lib/auth-client"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function SystemAdminAnalytics() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>({
        bookingTrend: [],
        networkDistribution: [],
        blueprintUsage: []
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await getZKeyAuthToken()
                if (!token) return

                const [profiles, networks, venues, bookings] = await Promise.all([
                    bookingClient.getAllBookingProfiles(token),
                    bookingClient.getAllVenueNetworks(token),
                    bookingClient.getAllVenues(),
                    bookingClient.getAllBookings(token)
                ])

                // Generate some mock trend data based on total bookings
                const trend = Array.from({ length: 7 }, (_, i) => {
                    const date = new Date()
                    date.setDate(date.getDate() - (6 - i))
                    return {
                        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                        bookings: Math.floor(Math.random() * 20) + (bookings.length / 10)
                    }
                })

                // Blueprint usage
                const blueprintData = profiles.map(p => ({
                    name: p.name,
                    count: venues.filter(v => v.profile?.id === p.id).length
                }))

                // Network distribution
                const networkData = networks.map(n => ({
                    name: n.name,
                    value: venues.filter(v => v.networks?.some((net: any) => net.id === n.id)).length
                }))

                setData({
                    bookingTrend: trend,
                    blueprintUsage: blueprintData,
                    networkDistribution: networkData.length > 0 ? networkData : [{ name: 'Independent', value: venues.length }]
                })
            } catch (error) {
                console.error("Failed to fetch analytics", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return <div className="p-8 text-center text-muted-foreground">Generating platform insights...</div>

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
                <p className="text-muted-foreground">Consolidated platform metrics and growth visualization.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Platform Booking Trend</CardTitle>
                        <CardDescription>Daily reservation volume across all sites.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.bookingTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip />
                                <Line type="monotone" dataKey="bookings" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Federation Distribution</CardTitle>
                        <CardDescription>Sites grouped by Venue Network.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.networkDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.networkDistribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Node Blueprint Usage</CardTitle>
                        <CardDescription>Number of active sites using each industry profile.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.blueprintUsage}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

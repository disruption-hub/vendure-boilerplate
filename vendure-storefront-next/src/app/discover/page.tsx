'use client'

import { useEffect, useState } from 'react'
import { Search, MapPin, Calendar, Clock, ArrowRight, Filter, Star } from 'lucide-react'
import { bookingClient } from '@/lib/booking-client'
import { getZKeyAuthToken } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { toast } from 'sonner'

interface Service {
    id: string
    name: string
    description?: string
    durationMinutes: number
    defaultPrice?: number
    category?: {
        id: string
        name: string
    }
    sessions?: {
        id: string
        startTime: string
        space?: {
            name: string
            venue?: {
                name: string
            }
        }
    }[]
}

export default function DiscoverPage() {
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    useEffect(() => {
        fetchServices()
    }, [])

    const fetchServices = async () => {
        try {
            setLoading(true)
            const data = await bookingClient.getAllServices()
            setServices(data)
        } catch (error) {
            console.error("Failed to fetch services:", error)
            toast.error("Failed to load services")
        } finally {
            setLoading(false)
        }
    }

    const categories = Array.from(new Set(services.filter(s => s.category).map(s => s.category!.name)))

    const filteredServices = services.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.description?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = !selectedCategory || service.category?.name === selectedCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="min-h-screen bg-transparent">
            {/* Hero Section */}
            <div className="relative py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-3xl overflow-hidden mb-12 shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2000&auto=format&fit=crop')] opacity-10 bg-cover bg-center" />
                <div className="relative max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
                        Find Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Experience</span>
                    </h1>
                    <p className="text-xl text-indigo-100/80 mb-10 max-w-2xl mx-auto">
                        Discover and book the best classes, spaces, and services across our global network of venues.
                    </p>
                    <div className="relative max-w-2xl mx-auto">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-6 w-6 text-indigo-300" />
                        </div>
                        <Input
                            type="text"
                            placeholder="Search by name, description, or location..."
                            className="w-full pl-12 pr-4 py-8 bg-white/10 border-white/20 text-white placeholder:text-indigo-200/50 rounded-2xl text-lg backdrop-blur-xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="mb-10 flex flex-wrap gap-3 items-center">
                <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    className="rounded-full px-6"
                    onClick={() => setSelectedCategory(null)}
                >
                    All Services
                </Button>
                {categories.map(category => (
                    <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        className="rounded-full px-6"
                        onClick={() => setSelectedCategory(category)}
                    >
                        {category}
                    </Button>
                ))}
            </div>

            {/* Service Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="h-64 w-full rounded-2xl" />
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    ))
                ) : filteredServices.length > 0 ? (
                    filteredServices.map((service) => (
                        <Card key={service.id} className="group overflow-hidden rounded-2xl border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                            <CardHeader className="p-0">
                                <div className="relative h-56 w-full overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                                    <img
                                        src={`https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop`}
                                        alt={service.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    {service.category && (
                                        <Badge className="absolute top-4 left-4 z-20 bg-indigo-600 hover:bg-indigo-700">
                                            {service.category.name}
                                        </Badge>
                                    )}
                                    <div className="absolute bottom-4 left-4 z-20">
                                        <div className="flex items-center text-white/90 text-sm font-medium">
                                            <Star className="w-4 h-4 text-yellow-500 mr-1 fill-yellow-500" />
                                            4.9 (120 reviews)
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <CardTitle className="text-2xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">
                                    {service.name}
                                </CardTitle>
                                <p className="text-muted-foreground line-clamp-2 mb-4 h-10">
                                    {service.description || "Unforgettable experience at one of our premium partner locations."}
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                                        {service.durationMinutes} minutes
                                    </div>
                                    {service.sessions?.[0]?.space?.venue && (
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <MapPin className="w-4 h-4 mr-2 text-indigo-500" />
                                            {service.sessions[0].space.venue.name}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="p-6 pt-0 flex justify-between items-center">
                                <div>
                                    <span className="text-2xl font-bold">${service.defaultPrice || 25}</span>
                                    <span className="text-sm text-muted-foreground ml-1">/ person</span>
                                </div>
                                <Button asChild className="rounded-full shadow-lg shadow-indigo-500/20 group/btn">
                                    <Link href={`/discover/service/${service.id}`}>
                                        Book Now
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                            <Search className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">No services found</h3>
                        <p className="text-muted-foreground">Try adjusting your search terms or filters.</p>
                        <Button variant="link" className="mt-4" onClick={() => { setSearchTerm(''); setSelectedCategory(null); }}>
                            Clear all filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

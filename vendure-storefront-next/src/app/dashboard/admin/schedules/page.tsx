"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Calendar, Clock, MapPin, Briefcase, Pencil, Trash2 } from "lucide-react"
import { bookingClient } from "@/lib/booking-client"
import { getZKeyAuthToken } from "@/lib/auth-client"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SchedulesPage() {
    const [sessions, setSessions] = useState<any[]>([])
    const [services, setServices] = useState<any[]>([])
    const [venues, setVenues] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Form state
    const [serviceId, setServiceId] = useState("")
    const [venueId, setVenueId] = useState("")
    const [spaceId, setSpaceId] = useState("")
    const [date, setDate] = useState("")
    const [startTime, setStartTime] = useState("10:00")
    const [endTime, setEndTime] = useState("11:00")
    const [capacity, setCapacity] = useState("20")

    // Edit state
    const [editingSession, setEditingSession] = useState<any>(null)
    const [editServiceId, setEditServiceId] = useState("")
    const [editVenueId, setEditVenueId] = useState("")
    const [editSpaceId, setEditSpaceId] = useState("")
    const [editDate, setEditDate] = useState("")
    const [editStartTime, setEditStartTime] = useState("")
    const [editEndTime, setEditEndTime] = useState("")
    const [editCapacity, setEditCapacity] = useState("")
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    const fetchData = async () => {
        try {
            const [sessionsData, servicesData, venuesData] = await Promise.all([
                bookingClient.getAllSessions(),
                bookingClient.getAllServices(),
                bookingClient.getAllVenues()
            ])
            setSessions(sessionsData)
            setServices(servicesData)
            setVenues(venuesData)
        } catch (error) {
            console.error("Failed to fetch data", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = await getZKeyAuthToken()
            if (!token) throw new Error("Not authenticated")

            // Combine date and time
            const startStr = `${date}T${startTime}:00Z`
            const endStr = `${date}T${endTime}:00Z`

            await bookingClient.createSession(token, {
                serviceId,
                startTime: startStr,
                endTime: endStr,
                maxCapacity: parseInt(capacity),
                spaceId: spaceId || undefined
            })
            toast.success("Session scheduled successfully")
            setServiceId("")
            setSpaceId("")
            fetchData()
        } catch (error) {
            toast.error("Failed to schedule session")
        }
    }

    const handleUpdateSession = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingSession) return
        try {
            const token = await getZKeyAuthToken()
            if (!token) throw new Error("Not authenticated")

            const startStr = `${editDate}T${editStartTime}:00Z`
            const endStr = `${editDate}T${editEndTime}:00Z`

            await bookingClient.updateSession(token, {
                id: editingSession.id,
                serviceId: editServiceId,
                startTime: startStr,
                endTime: endStr,
                maxCapacity: parseInt(editCapacity),
                spaceId: editSpaceId || undefined
            })
            toast.success("Session updated successfully")
            setIsEditDialogOpen(false)
            setEditingSession(null)
            fetchData()
        } catch (error) {
            toast.error("Failed to update session")
        }
    }

    const handleDeleteSession = async (id: string) => {
        try {
            const token = await getZKeyAuthToken()
            if (!token) throw new Error("Not authenticated")

            await bookingClient.deleteSession(token, id)
            toast.success("Session deleted successfully")
            fetchData()
        } catch (error) {
            toast.error("Failed to delete session")
        }
    }

    const openEditDialog = (session: any) => {
        setEditingSession(session)
        setEditServiceId(session.service?.id || "")
        setEditVenueId(session.space?.venue?.id || "")
        setEditSpaceId(session.space?.id || "")

        const start = new Date(session.startTime)
        const end = new Date(session.endTime)

        setEditDate(start.toISOString().split('T')[0])
        setEditStartTime(start.getUTCHours().toString().padStart(2, '0') + ":" + start.getUTCMinutes().toString().padStart(2, '0'))
        setEditEndTime(end.getUTCHours().toString().padStart(2, '0') + ":" + end.getUTCMinutes().toString().padStart(2, '0'))
        setEditCapacity(session.maxCapacity.toString())

        setIsEditDialogOpen(true)
    }

    const selectedVenue = venues.find(v => v.id === venueId)
    const selectedEditVenue = venues.find(v => v.id === editVenueId)

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Schedules & Sessions</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Schedule New Session</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateSession} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Service</label>
                                <Select value={serviceId} onValueChange={setServiceId}>
                                    <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                                    <SelectContent>
                                        {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Venue</label>
                                <Select value={venueId} onValueChange={setVenueId}>
                                    <SelectTrigger><SelectValue placeholder="Select venue" /></SelectTrigger>
                                    <SelectContent>
                                        {venues.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedVenue && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Space</label>
                                    <Select value={spaceId} onValueChange={setSpaceId}>
                                        <SelectTrigger><SelectValue placeholder="Select space" /></SelectTrigger>
                                        <SelectContent>
                                            {selectedVenue.spaces.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date</label>
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Start</label>
                                    <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">End</label>
                                    <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Capacity</label>
                                <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required />
                            </div>
                            <div className="pt-8">
                                <Button type="submit" className="w-full">
                                    <Plus className="mr-2 h-4 w-4" /> Schedule Session
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Session</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Bookings</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
                            ) : sessions.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No sessions scheduled.</TableCell></TableRow>
                            ) : sessions.map((session) => (
                                <TableRow key={session.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium flex items-center">
                                                <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                                                {session.service?.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span className="flex items-center">
                                                <MapPin className="mr-1 h-3 w-3 text-muted-foreground" />
                                                {session.space?.venue?.name}
                                            </span>
                                            <span className="text-muted-foreground pl-4">{session.space?.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span className="flex items-center">
                                                <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                                                {new Date(session.startTime).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center text-muted-foreground">
                                                <Clock className="mr-1 h-3 w-3" />
                                                {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {session.bookings?.length || 0} / {session.maxCapacity}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditDialog(session)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="text-red-600">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete this session and all associated bookings. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteSession(session.id)}
                                                            className="bg-red-600 hover:bg-red-700"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Edit Session</DialogTitle>
                        <DialogDescription>
                            Update the session details and schedule.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateSession} className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Service</label>
                                <Select value={editServiceId} onValueChange={setEditServiceId}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Venue</label>
                                <Select value={editVenueId} onValueChange={setEditVenueId}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {venues.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedEditVenue && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Space</label>
                                    <Select value={editSpaceId} onValueChange={setEditSpaceId}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {selectedEditVenue.spaces.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date</label>
                                <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} required />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Start</label>
                                    <Input type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">End</label>
                                    <Input type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)} required />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Capacity</label>
                                <Input type="number" value={editCapacity} onChange={e => setEditCapacity(e.target.value)} required />
                            </div>
                        </div>
                    </form>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" onClick={(e) => handleUpdateSession(e as any)}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Briefcase, Pencil, Trash2, Clock, DollarSign } from "lucide-react"
import { bookingClient } from "@/lib/booking-client"
import { getZKeyAuthToken } from "@/lib/auth-client"
import { toast } from "sonner"
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

export default function ServicesPage() {
    const [services, setServices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [duration, setDuration] = useState("60")
    const [price, setPrice] = useState("0")

    // Edit state
    const [editingService, setEditingService] = useState<any>(null)
    const [editName, setEditName] = useState("")
    const [editDescription, setEditDescription] = useState("")
    const [editDuration, setEditDuration] = useState("60")
    const [editPrice, setEditPrice] = useState("0")
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    const fetchServices = async () => {
        try {
            const data = await bookingClient.getAllServices()
            setServices(data)
        } catch (error) {
            console.error("Failed to fetch services", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchServices()
    }, [])

    const handleCreateService = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = await getZKeyAuthToken()
            if (!token) throw new Error("Not authenticated")

            await bookingClient.createService(token, {
                name,
                description,
                duration: parseInt(duration),
                price: parseFloat(price)
            })
            toast.success("Service created successfully")
            setName("")
            setDescription("")
            setDuration("60")
            setPrice("0")
            fetchServices()
        } catch (error) {
            toast.error("Failed to create service")
        }
    }

    const handleUpdateService = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingService) return
        try {
            const token = await getZKeyAuthToken()
            if (!token) throw new Error("Not authenticated")

            await bookingClient.updateService(token, {
                id: editingService.id,
                name: editName,
                description: editDescription,
                duration: parseInt(editDuration),
                price: parseFloat(editPrice)
            })
            toast.success("Service updated successfully")
            setIsEditDialogOpen(false)
            setEditingService(null)
            fetchServices()
        } catch (error) {
            toast.error("Failed to update service")
        }
    }

    const handleDeleteService = async (id: string) => {
        try {
            const token = await getZKeyAuthToken()
            if (!token) throw new Error("Not authenticated")

            await bookingClient.deleteService(token, id)
            toast.success("Service deleted successfully")
            fetchServices()
        } catch (error) {
            toast.error("Failed to delete service")
        }
    }

    const openEditDialog = (service: any) => {
        setEditingService(service)
        setEditName(service.name)
        setEditDescription(service.description || "")
        setEditDuration(service.durationMinutes?.toString() || "60")
        setEditPrice(service.defaultPrice?.toString() || "0")
        setIsEditDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Booking Services</h1>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Create New Service</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateService} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Service Name</label>
                                <Input
                                    placeholder="e.g. Yoga Class, Consultation"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Input
                                    placeholder="Brief description of the service"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Duration (min)</label>
                                    <Input
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Price</label>
                                    <Input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full">
                                <Plus className="mr-2 h-4 w-4" /> Create Service
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Guidelines</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                        <p>Services define the types of activities users can book.</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Services can be categorized for easier discovery.</li>
                            <li>Each service can have set durations and pricing.</li>
                            <li>Services are linked to sessions in the schedule.</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Existing Services</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                            ) : services.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No services found.</TableCell></TableRow>
                            ) : services.map((service) => (
                                <TableRow key={service.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <div className="flex items-center">
                                                <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                                                {service.name}
                                            </div>
                                            {service.description && (
                                                <span className="text-xs text-muted-foreground ml-6">
                                                    {service.description}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-sm">
                                            <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
                                            {service.durationMinutes} min
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-sm">
                                            <DollarSign className="mr-1 h-3 w-3 text-muted-foreground" />
                                            {service.defaultPrice}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditDialog(service)}
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
                                                            This will permanently delete the service "{service.name}". This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteService(service.id)}
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Service</DialogTitle>
                        <DialogDescription>
                            Update the service details.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateService} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Service Name</label>
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Input
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Duration (min)</label>
                                <Input
                                    type="number"
                                    value={editDuration}
                                    onChange={(e) => setEditDuration(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Price</label>
                                <Input
                                    type="number"
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Network, Globe, MapPin, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { bookingClient, VenueNetwork } from "@/lib/booking-client"
import { getZKeyAuthToken } from "@/lib/auth-client"

export default function VenueNetworksPage() {
    const [networks, setNetworks] = useState<VenueNetwork[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingNetwork, setEditingNetwork] = useState<VenueNetwork | null>(null)

    // Form state
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [type, setType] = useState<'COMPLEX' | 'NETWORK' | 'FEDERATION'>('NETWORK')

    const fetchNetworks = async () => {
        try {
            const token = await getZKeyAuthToken()
            if (!token) return
            const data = await bookingClient.getAllVenueNetworks(token)
            setNetworks(data)
        } catch (error) {
            toast.error("Failed to fetch networks")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNetworks()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = await getZKeyAuthToken()
            if (!token) return
            await bookingClient.createVenueNetwork(token, { name, type, description })
            toast.success("Network created successfully")
            setIsCreateOpen(false)
            resetForm()
            fetchNetworks()
        } catch (error) {
            toast.error("Failed to create network")
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingNetwork) return
        try {
            const token = await getZKeyAuthToken()
            if (!token) return
            await bookingClient.updateVenueNetwork(token, {
                id: editingNetwork.id,
                name,
                type,
                description
            })
            toast.success("Network updated successfully")
            setIsEditOpen(false)
            fetchNetworks()
        } catch (error) {
            toast.error("Failed to update network")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this network?")) return
        try {
            const token = await getZKeyAuthToken()
            if (!token) return
            await bookingClient.deleteVenueNetwork(token, id)
            toast.success("Network deleted successfully")
            fetchNetworks()
        } catch (error) {
            toast.error("Failed to delete network")
        }
    }

    const openEdit = (network: VenueNetwork) => {
        setEditingNetwork(network)
        setName(network.name)
        setType(network.type)
        setDescription(network.description || "")
        setIsEditOpen(true)
    }

    const resetForm = () => {
        setName("")
        setDescription("")
        setType('NETWORK')
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Venue Networks</h1>
                    <p className="text-muted-foreground">Manage federations of venues and shared memberships.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="mr-2 h-4 w-4" /> Create Network
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[550px]">
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>Create Venue Network</DialogTitle>
                                <DialogDescription>Define a new federation for shared passes.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Name</label>
                                    <Input placeholder="e.g. World Wellness Network" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Type</label>
                                    <select
                                        className="w-full p-2 border rounded-md text-sm"
                                        value={type}
                                        onChange={e => setType(e.target.value as any)}
                                    >
                                        <option value="COMPLEX">Complex (Logical Grouping)</option>
                                        <option value="NETWORK">Standard Network</option>
                                        <option value="FEDERATION">Federation</option>
                                    </select>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Textarea placeholder="Describe the federation purpose..." value={description} onChange={e => setDescription(e.target.value)} rows={4} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create Network</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Federations</CardTitle>
                        <Network className="ml-auto h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Connected</div>
                        <p className="text-xs text-muted-foreground">Share memberships across groups</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Global Access</CardTitle>
                        <Globe className="ml-auto h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Universal</div>
                        <p className="text-xs text-muted-foreground">Cross-venue validity for passes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expansion</CardTitle>
                        <MapPin className="ml-auto h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Scalable</div>
                        <p className="text-xs text-muted-foreground">Easily add new venues to networks</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Existing Networks</CardTitle>
                    <CardDescription>Federations currently managing shared venues.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
                            ) : networks.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No networks found.</TableCell></TableRow>
                            ) : (
                                networks.map((network) => (
                                    <TableRow key={network.id}>
                                        <TableCell className="font-medium">{network.name}</TableCell>
                                        <TableCell>{network.type}</TableCell>
                                        <TableCell className="max-w-xs truncate">{network.description || "-"}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => openEdit(network)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(network.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <form onSubmit={handleUpdate}>
                        <DialogHeader>
                            <DialogTitle>Edit Venue Network</DialogTitle>
                            <DialogDescription>Modify the federation configuration.</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input value={name} onChange={e => setName(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type</label>
                                <select
                                    className="w-full p-2 border rounded-md text-sm"
                                    value={type}
                                    onChange={e => setType(e.target.value as any)}
                                >
                                    <option value="COMPLEX">Complex</option>
                                    <option value="NETWORK">Standard Network</option>
                                    <option value="FEDERATION">Federation</option>
                                </select>
                            </div>
                            <div className="space-y-2 col-span-2">
                                <label className="text-sm font-medium">Description</label>
                                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Update Network</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

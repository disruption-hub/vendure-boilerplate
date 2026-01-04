"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, LayoutGrid, Users, Settings } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { bookingClient, SpacePreset } from "@/lib/booking-client"
import { getZKeyAuthToken } from "@/lib/auth-client"

export default function SpacePresetsPage() {
    const [presets, setPresets] = useState<SpacePreset[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    // Form state
    const [name, setName] = useState("")
    const [type, setType] = useState("")
    const [capacity, setCapacity] = useState(1)

    const fetchPresets = async () => {
        try {
            const token = await getZKeyAuthToken()
            if (!token) return
            const data = await bookingClient.getAllSpacePresets(token)
            setPresets(data)
        } catch (error) {
            toast.error("Failed to fetch space presets")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPresets()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = await getZKeyAuthToken()
            if (!token) return
            await bookingClient.createSpacePreset(token, {
                name,
                type,
                capacity: Number(capacity)
            })
            toast.success("Space preset created successfully")
            setIsCreateOpen(false)
            resetForm()
            fetchPresets()
        } catch (error) {
            toast.error("Failed to create space preset")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this preset?")) return
        try {
            const token = await getZKeyAuthToken()
            if (!token) return
            await bookingClient.deleteSpacePreset(token, id)
            toast.success("Space preset deleted successfully")
            fetchPresets()
        } catch (error) {
            toast.error("Failed to delete space preset")
        }
    }

    const resetForm = () => {
        setName("")
        setType("")
        setCapacity(1)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Space Presets</h1>
                    <p className="text-muted-foreground">Reusable room templates for faster site configuration.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="mr-2 h-4 w-4" /> Create Preset
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>Create Space Preset</DialogTitle>
                                <DialogDescription>Define a reusable room template.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Preset Name</label>
                                    <Input placeholder="e.g. Large Yoga Studio" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Type</label>
                                        <Input placeholder="e.g. Studio" value={type} onChange={e => setType(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Capacity</label>
                                        <Input type="number" min="1" value={capacity} onChange={e => setCapacity(Number(e.target.value))} required />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create Preset</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Standardization</CardTitle>
                        <Settings className="ml-auto h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Reusable</div>
                        <p className="text-xs text-muted-foreground">Speed up venue setup</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Presets</CardTitle>
                        <LayoutGrid className="ml-auto h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{presets.length}</div>
                        <p className="text-xs text-muted-foreground">Active templates</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Global Access</CardTitle>
                        <Users className="ml-auto h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Shared</div>
                        <p className="text-xs text-muted-foreground">Available to all Unit Admins</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Capacity</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                            ) : presets.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No presets found.</TableCell></TableRow>
                            ) : (
                                presets.map((preset) => (
                                    <TableRow key={preset.id}>
                                        <TableCell className="font-medium">{preset.name}</TableCell>
                                        <TableCell>{preset.type}</TableCell>
                                        <TableCell>{preset.capacity}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(preset.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Settings, Layout, BarChart, Info } from "lucide-react"
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
import { bookingClient, BookingProfile } from "@/lib/booking-client"
import { getZKeyAuthToken } from "@/lib/auth-client"

export default function BookingProfilesPage() {
    const [profiles, setProfiles] = useState<BookingProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingProfile, setEditingProfile] = useState<BookingProfile | null>(null)

    // Form state
    const [name, setName] = useState("")
    const [slug, setSlug] = useState("")
    const [description, setDescription] = useState("")

    const fetchProfiles = async () => {
        try {
            const token = await getZKeyAuthToken()
            if (!token) return
            const data = await bookingClient.getAllBookingProfiles(token)
            setProfiles(data)
        } catch (error) {
            toast.error("Failed to fetch profiles")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProfiles()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = await getZKeyAuthToken()
            if (!token) return
            await bookingClient.createBookingProfile(token, { name, slug, description })
            toast.success("Profile created successfully")
            setIsCreateOpen(false)
            resetForm()
            fetchProfiles()
        } catch (error) {
            toast.error("Failed to create profile")
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingProfile) return
        try {
            const token = await getZKeyAuthToken()
            if (!token) return
            await bookingClient.updateBookingProfile(token, {
                id: editingProfile.id,
                name,
                slug,
                description
            })
            toast.success("Profile updated successfully")
            setIsEditOpen(false)
            fetchProfiles()
        } catch (error) {
            toast.error("Failed to update profile")
        }
    }

    const openEdit = (profile: BookingProfile) => {
        setEditingProfile(profile)
        setName(profile.name)
        setSlug(profile.slug)
        setDescription(profile.description || "")
        setIsEditOpen(true)
    }

    const resetForm = () => {
        setName("")
        setSlug("")
        setDescription("")
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Node Blueprints (Profiles)</h1>
                    <p className="text-muted-foreground">Manage meta-profiles for different business verticals.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="mr-2 h-4 w-4" /> Create Blueprint
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>Create Node Blueprint</DialogTitle>
                                <DialogDescription>Define a new business vertical template.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Name</label>
                                    <Input placeholder="e.g. Yoga Studio" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Slug</label>
                                    <Input placeholder="e.g. yoga-studio" value={slug} onChange={e => setSlug(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Textarea placeholder="Describe the profile purpose..." value={description} onChange={e => setDescription(e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create Profile</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Industry Standard</CardTitle>
                        <Layout className="ml-auto h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Standardized</div>
                        <p className="text-xs text-muted-foreground">Consistent UI/UX across venues</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Custom Metrics</CardTitle>
                        <BarChart className="ml-auto h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Configurable</div>
                        <p className="text-xs text-muted-foreground">Tailored KPIs for each type</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Branding</CardTitle>
                        <Settings className="ml-auto h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">White-label</div>
                        <p className="text-xs text-muted-foreground">Profile-specific colors and labels</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Existing Profiles</CardTitle>
                    <CardDescription>All defined business templates in the network.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                            ) : profiles.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No profiles found.</TableCell></TableRow>
                            ) : (
                                profiles.map((profile) => (
                                    <TableRow key={profile.id}>
                                        <TableCell className="font-medium">{profile.name}</TableCell>
                                        <TableCell><code className="bg-muted px-1 py-0.5 rounded">{profile.slug}</code></TableCell>
                                        <TableCell className="max-w-xs truncate">{profile.description || "-"}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(profile)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <form onSubmit={handleUpdate}>
                        <DialogHeader>
                            <DialogTitle>Edit Booking Profile</DialogTitle>
                            <DialogDescription>Modify the vertical configuration.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input value={name} onChange={e => setName(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Slug</label>
                                <Input value={slug} onChange={e => setSlug(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Textarea value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Update Profile</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

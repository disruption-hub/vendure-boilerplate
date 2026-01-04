"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, MapPin, Building2, Pencil, Trash2, Clock, Users, ChevronDown, ChevronRight } from "lucide-react"
import { bookingClient, SpacePreset } from "@/lib/booking-client"
import { getZKeyAuthToken } from "@/lib/auth-client"
import { toast } from "sonner"
import { OperationalHoursEditor, OpeningHours } from "@/components/admin/operational-hours-editor"
import { AmenitiesInput } from "@/components/admin/amenities-input"
import { Badge } from "@/components/ui/badge"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function VenuesPage() {
    const [venues, setVenues] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Create state
    const [name, setName] = useState("")
    const [address, setAddress] = useState("")
    const [description, setDescription] = useState("")
    const [timezone, setTimezone] = useState("UTC")
    const [type, setType] = useState<'SITE' | 'UNIT' | 'VIRTUAL'>('UNIT')
    const [openingHours, setOpeningHours] = useState<OpeningHours>({})
    const [amenities, setAmenities] = useState<string[]>([])
    const [profileId, setProfileId] = useState<string | undefined>()
    const [parentId, setParentId] = useState<string | undefined>()
    const [networkIds, setNetworkIds] = useState<string[]>([])

    // Relational data
    const [profiles, setProfiles] = useState<any[]>([])
    const [networks, setNetworks] = useState<any[]>([])
    const [presets, setPresets] = useState<SpacePreset[]>([])

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

    // Edit state
    const [editingVenue, setEditingVenue] = useState<any>(null)
    const [editName, setEditName] = useState("")
    const [editAddress, setEditAddress] = useState("")
    const [editDescription, setEditDescription] = useState("")
    const [editTimezone, setEditTimezone] = useState("UTC")
    const [editType, setEditType] = useState<'SITE' | 'UNIT' | 'VIRTUAL'>('UNIT')
    const [editOpeningHours, setEditOpeningHours] = useState<OpeningHours>({})
    const [editAmenities, setEditAmenities] = useState<string[]>([])
    const [editProfileId, setEditProfileId] = useState<string | undefined>()
    const [editParentId, setEditParentId] = useState<string | undefined>()
    const [editNetworkIds, setEditNetworkIds] = useState<string[]>([])
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    const fetchVenues = async () => {
        try {
            const token = await getZKeyAuthToken()
            if (token) {
                const [venuesData, presetsData, profilesData, networksData] = await Promise.all([
                    bookingClient.getAllVenues(),
                    bookingClient.getAllSpacePresets(token),
                    bookingClient.getAllBookingProfiles(token),
                    bookingClient.getAllVenueNetworks(token)
                ])
                setVenues(venuesData)
                setPresets(presetsData)
                setProfiles(profilesData)
                setNetworks(networksData)
            }
        } catch (error) {
            console.error("Failed to fetch data", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchVenues()
    }, [])

    const handleCreateVenue = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = await getZKeyAuthToken()
            if (!token) throw new Error("Not authenticated")

            await bookingClient.createVenue(token, {
                name,
                type,
                address,
                description,
                timezone,
                openingHours,
                amenities,
                profileId: profileId === "none" ? undefined : profileId,
                parentId: parentId === "none" ? undefined : parentId,
                networkIds: networkIds.filter(id => id !== "none")
            })
            toast.success("Venue created successfully")
            setName("")
            setAddress("")
            setDescription("")
            setTimezone("UTC")
            setOpeningHours({})
            setAmenities([])
            setProfileId(undefined)
            setParentId(undefined)
            setNetworkIds([])
            setType('UNIT')
            fetchVenues()
            setIsCreateDialogOpen(false)
        } catch (error) {
            toast.error("Failed to create venue")
        }
    }

    const handleUpdateVenue = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingVenue) return
        try {
            const token = await getZKeyAuthToken()
            if (!token) throw new Error("Not authenticated")

            await bookingClient.updateVenue(token, {
                id: editingVenue.id,
                name: editName,
                type: editType,
                address: editAddress,
                description: editDescription,
                timezone: editTimezone,
                openingHours: editOpeningHours,
                amenities: editAmenities,
                profileId: editProfileId === "none" ? undefined : editProfileId,
                parentId: editParentId === "none" ? undefined : editParentId,
                networkIds: editNetworkIds.filter(id => id !== "none")
            })
            toast.success("Venue updated successfully")
            setIsEditDialogOpen(false)
            setEditingVenue(null)
            fetchVenues()
        } catch (error) {
            toast.error("Failed to update venue")
        }
    }

    const openEditDialog = (venue: any) => {
        setEditingVenue(venue)
        setEditName(venue.name)
        setEditAddress(venue.address || "")
        setEditDescription(venue.description || "")
        setEditTimezone(venue.timezone || "UTC")
        setEditOpeningHours(venue.openingHours || {})
        setEditAmenities(venue.amenities || [])
        setEditProfileId(venue.profileId || undefined)
        setEditParentId(venue.parentId || undefined)
        setEditNetworkIds(venue.networks?.map((n: any) => n.id) || [])
        setEditType(venue.type || 'UNIT')
        setIsEditDialogOpen(true)
    }

    const handleDeleteVenue = async (id: string) => {
        try {
            const token = await getZKeyAuthToken()
            if (!token) throw new Error("Not authenticated")

            await bookingClient.deleteVenue(token, id)
            toast.success("Venue deleted successfully")
            fetchVenues()
        } catch (error) {
            toast.error("Failed to delete venue")
        }
    }



    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Venues</h1>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create New Venue
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] p-0">
                        <DialogHeader className="px-6 pt-6">
                            <DialogTitle>Create New Venue</DialogTitle>
                            <DialogDescription>Add a new venue to your system.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateVenue}>
                            <ScrollArea className="max-h-[70vh] px-6">
                                <Tabs defaultValue="basic" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 mb-4">
                                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                        <TabsTrigger value="federation">Associations</TabsTrigger>
                                        <TabsTrigger value="ops">Operations</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="basic" className="space-y-4 pb-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Venue Name</label>
                                                <Input
                                                    placeholder="e.g. Downtown Studio"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Node Type</label>
                                                <Select value={type} onValueChange={(v: any) => setType(v)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="SITE">Physical Site (Building)</SelectItem>
                                                        <SelectItem value="UNIT">Business Unit (Studio/Office)</SelectItem>
                                                        <SelectItem value="VIRTUAL">Virtual presence</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Address</label>
                                            <Input
                                                placeholder="123 Main St, City"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Description</label>
                                            <Textarea
                                                placeholder="Describe your venue..."
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                rows={3}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Timezone</label>
                                            <Select value={timezone} onValueChange={setTimezone}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select timezone" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                                                    {/* ... shortcuts ... */}
                                                    <SelectItem value="America/New_York">New York (EST/EDT)</SelectItem>
                                                    <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                                                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="federation" className="space-y-4 pb-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Blueprint (Profile)</label>
                                                <Select value={profileId} onValueChange={setProfileId}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select profile..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        {profiles.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Parent Node</label>
                                                <Select value={parentId} onValueChange={setParentId}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select parent..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">None (Root Node)</SelectItem>
                                                        {venues.map(v => (
                                                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Horizontal Federations (Networks)</label>
                                            <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/20 min-h-[60px]">
                                                {networks.map(n => (
                                                    <Badge
                                                        key={n.id}
                                                        variant={networkIds.includes(n.id) ? "default" : "outline"}
                                                        className="cursor-pointer transition-colors"
                                                        onClick={() => {
                                                            setNetworkIds(prev =>
                                                                prev.includes(n.id) ? prev.filter(id => id !== n.id) : [...prev, n.id]
                                                            )
                                                        }}
                                                    >
                                                        {n.name}
                                                    </Badge>
                                                ))}
                                                {networks.length === 0 && <span className="text-xs text-muted-foreground italic">No networks available.</span>}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="ops" className="space-y-6 pb-4">
                                        <OperationalHoursEditor
                                            value={openingHours}
                                            onChange={setOpeningHours}
                                        />

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Amenities</label>
                                            <AmenitiesInput
                                                value={amenities}
                                                onChange={setAmenities}
                                                placeholder="Add amenities (e.g. WiFi, Parking)"
                                            />
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </ScrollArea>
                            <DialogFooter className="p-6 border-t">
                                <Button type="submit" className="w-full sm:w-auto">Create Venue</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Existing Venues</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Spaces</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                            ) : venues.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No venues found.</TableCell></TableRow>
                            ) : (
                                venues.map((venue) => (
                                    <VenueRow
                                        key={venue.id}
                                        venue={venue}
                                        onEdit={openEditDialog}
                                        onDelete={handleDeleteVenue}
                                        onVenueUpdated={fetchVenues}
                                        presets={presets}
                                        onPresetsUpdated={fetchVenues}
                                    />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[800px] p-0">
                    <DialogHeader className="px-6 pt-6">
                        <DialogTitle>Edit Venue</DialogTitle>
                        <DialogDescription>Update the venue details for "{editName}".</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateVenue}>
                        <ScrollArea className="max-h-[70vh] px-6">
                            <Tabs defaultValue="basic" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-4">
                                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                    <TabsTrigger value="federation">Associations</TabsTrigger>
                                    <TabsTrigger value="ops">Operations</TabsTrigger>
                                </TabsList>

                                <TabsContent value="basic" className="space-y-4 pb-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Venue Name</label>
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Node Type</label>
                                            <Select value={editType} onValueChange={(v: any) => setEditType(v)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="SITE">Physical Site (Building)</SelectItem>
                                                    <SelectItem value="UNIT">Business Unit (Studio/Office)</SelectItem>
                                                    <SelectItem value="VIRTUAL">Virtual presence</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Address</label>
                                        <Input
                                            value={editAddress}
                                            onChange={(e) => setEditAddress(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Description</label>
                                        <Textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            rows={3}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Timezone</label>
                                        <Select value={editTimezone} onValueChange={setEditTimezone}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select timezone" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                                                <SelectItem value="America/New_York">New York (EST/EDT)</SelectItem>
                                                <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                                                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TabsContent>

                                <TabsContent value="federation" className="space-y-4 pb-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Blueprint (Profile)</label>
                                            <Select value={editProfileId} onValueChange={setEditProfileId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select profile..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {profiles.map(p => (
                                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Parent Node</label>
                                            <Select value={editParentId} onValueChange={setEditParentId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select parent..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None (Root Node)</SelectItem>
                                                    {venues.filter(v => v.id !== editingVenue?.id).map(v => (
                                                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Horizontal Federations (Networks)</label>
                                        <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/20 min-h-[60px]">
                                            {networks.map(n => (
                                                <Badge
                                                    key={n.id}
                                                    variant={editNetworkIds.includes(n.id) ? "default" : "outline"}
                                                    className="cursor-pointer transition-colors"
                                                    onClick={() => {
                                                        setEditNetworkIds(prev =>
                                                            prev.includes(n.id) ? prev.filter(id => id !== n.id) : [...prev, n.id]
                                                        )
                                                    }}
                                                >
                                                    {n.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="ops" className="space-y-6 pb-4">
                                    <OperationalHoursEditor
                                        value={editOpeningHours}
                                        onChange={setEditOpeningHours}
                                    />

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Amenities</label>
                                        <AmenitiesInput
                                            value={editAmenities}
                                            onChange={setEditAmenities}
                                            placeholder="Add amenities..."
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </ScrollArea>
                        <DialogFooter className="p-6 border-t">
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

function VenueRow({ venue, onEdit, onDelete, onVenueUpdated, presets, onPresetsUpdated }: {
    venue: any,
    onEdit: (venue: any) => void,
    onDelete: (id: string) => void,
    onVenueUpdated: () => void,
    presets: SpacePreset[],
    onPresetsUpdated: () => void
}) {
    const [expanded, setExpanded] = useState(false)
    const [newSpaceName, setNewSpaceName] = useState("")
    const [newSpaceCapacity, setNewSpaceCapacity] = useState(10)
    const [newSpaceType, setNewSpaceType] = useState("room")
    const [newSpaceAmenities, setNewSpaceAmenities] = useState<string[]>([])

    // Preset Saving State
    const [isSavePresetOpen, setIsSavePresetOpen] = useState(false)
    const [presetName, setPresetName] = useState("")

    const handleCreateSpace = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = await getZKeyAuthToken()
            if (!token) throw new Error("Not authenticated")

            await bookingClient.createSpace(token, {
                venueId: venue.id,
                name: newSpaceName,
                capacity: newSpaceCapacity,
                type: newSpaceType,
                amenities: newSpaceAmenities
            })
            toast.success("Space created successfully")
            setNewSpaceName("")
            setNewSpaceCapacity(10)
            setNewSpaceType("room")
            setNewSpaceAmenities([])
            onVenueUpdated()
        } catch (error) {
            toast.error("Failed to create space")
        }
    }

    const handleDeleteSpace = async (spaceId: string) => {
        try {
            const token = await getZKeyAuthToken()
            if (!token) throw new Error("Not authenticated")

            await bookingClient.deleteSpace(token, spaceId)
            toast.success("Space deleted successfully")
            onVenueUpdated()
        } catch (error) {
            toast.error("Failed to delete space")
        }
    }

    const handleLoadPreset = (presetId: string) => {
        const preset = presets.find(p => p.id === presetId)
        if (preset) {
            setNewSpaceType(preset.type)
            setNewSpaceCapacity(preset.capacity)
            setNewSpaceAmenities(preset.amenities || [])
            toast.success(`Loaded preset: ${preset.name}`)
        }
    }

    const handleSavePreset = async () => {
        if (!presetName) return
        try {
            const token = await getZKeyAuthToken()
            if (!token) throw new Error("Not authenticated")

            await bookingClient.createSpacePreset(token, {
                name: presetName,
                type: newSpaceType,
                capacity: newSpaceCapacity,
                amenities: newSpaceAmenities
            })
            toast.success("Preset saved successfully")
            setIsSavePresetOpen(false)
            setPresetName("")
            onPresetsUpdated()
        } catch (error) {
            toast.error("Failed to save preset")
        }
    }

    return (
        <>
            <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpanded(!expanded)}>
                <TableCell className="font-medium">
                    <div className="flex items-center">
                        {expanded ? <ChevronDown className="mr-2 h-4 w-4 text-muted-foreground" /> : <ChevronRight className="mr-2 h-4 w-4 text-muted-foreground" />}
                        <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                        {venue.name}
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        {venue.address || "N/A"}
                    </div>
                </TableCell>
                <TableCell>{venue.spaces?.length || 0} spaces</TableCell>
                <TableCell className="text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setExpanded(!expanded)}>
                            Spaces
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(venue)}>
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
                                    <AlertDialogTitle>Delete Venue?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete "{venue.name}" and all its spaces.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(venue.id)} className="bg-red-600">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </TableCell>
            </TableRow>
            {expanded && (
                <TableRow>
                    <TableCell colSpan={4} className="bg-muted/30 p-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold">Spaces ({venue.spaces.length})</h4>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {venue.spaces.map((space: any) => (
                                    <Card key={space.id} className="bg-background">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="font-medium flex items-center gap-2">
                                                    {space.name}
                                                    {space.type && <Badge variant="outline" className="text-[10px] h-5">{space.type}</Badge>}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center">
                                                    <Users className="h-3 w-3 mr-1" />
                                                    Capacity: {space.capacity}
                                                </div>
                                                {space.amenities && Array.isArray(space.amenities) && space.amenities.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {space.amenities.map((am: string) => (
                                                            <span key={am} className="text-[10px] bg-secondary px-1 rounded">{am}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 h-8 w-8 p-0"
                                                onClick={() => handleDeleteSpace(space.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}

                                <Card className="bg-background border-dashed col-span-full md:col-span-1 lg:col-span-2">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Add New Space</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center bg-secondary/50 p-2 rounded-md">
                                                <div className="text-xs font-medium text-muted-foreground">Load Preset:</div>
                                                <Select onValueChange={handleLoadPreset}>
                                                    <SelectTrigger className="h-7 text-xs w-[180px]">
                                                        <SelectValue placeholder="Select preset..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {presets.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <form onSubmit={handleCreateSpace} className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Input
                                                        placeholder="Space Name"
                                                        value={newSpaceName}
                                                        onChange={(e) => setNewSpaceName(e.target.value)}
                                                        className="h-8 text-sm"
                                                        required
                                                    />
                                                    <Select value={newSpaceType} onValueChange={setNewSpaceType}>
                                                        <SelectTrigger className="h-8 text-sm">
                                                            <SelectValue placeholder="Type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="room">Room</SelectItem>
                                                            <SelectItem value="studio">Studio</SelectItem>
                                                            <SelectItem value="yoga_studio">Yoga Studio</SelectItem>
                                                            <SelectItem value="office">Office</SelectItem>
                                                            <SelectItem value="cowork">Cowork</SelectItem>
                                                            <SelectItem value="meeting_room">Meeting Room</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="flex gap-3">
                                                    <Input
                                                        type="number"
                                                        placeholder="Capacity"
                                                        value={newSpaceCapacity}
                                                        onChange={(e) => setNewSpaceCapacity(parseInt(e.target.value))}
                                                        className="h-8 text-sm w-24"
                                                        min={1}
                                                    />
                                                    <div className="flex-1">
                                                        <AmenitiesInput
                                                            value={newSpaceAmenities}
                                                            onChange={setNewSpaceAmenities}
                                                            placeholder="Space amenities..."
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center pt-2">
                                                    <Dialog open={isSavePresetOpen} onOpenChange={setIsSavePresetOpen}>
                                                        <DialogTrigger asChild>
                                                            <Button type="button" variant="outline" size="sm" className="h-7 text-xs">
                                                                Save as Preset
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-[425px]">
                                                            <DialogHeader>
                                                                <DialogTitle>Save Space Preset</DialogTitle>
                                                                <DialogDescription>
                                                                    Save current configuration as a reusable preset.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="grid gap-4 py-4">
                                                                <div className="grid grid-cols-4 items-center gap-4">
                                                                    <label htmlFor="name" className="text-right text-sm">
                                                                        Name
                                                                    </label>
                                                                    <Input
                                                                        id="name"
                                                                        value={presetName}
                                                                        onChange={(e) => setPresetName(e.target.value)}
                                                                        className="col-span-3"
                                                                        placeholder="e.g. Standard Yoga Room"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button type="button" onClick={handleSavePreset}>Save Preset</Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>

                                                    <Button type="submit" size="sm" className="h-8">
                                                        <Plus className="mr-2 h-3 w-3" /> Add Space
                                                    </Button>
                                                </div>
                                            </form>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {venue.openingHours && (
                                <div className="mt-4 pt-4 border-t">
                                    <h4 className="text-sm font-semibold mb-2 flex items-center">
                                        <Clock className="h-4 w-4 mr-2" /> Operational Hours
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                        {Object.entries(venue.openingHours).map(([day, hours]: [string, any]) => (
                                            !hours.closed && (
                                                <div key={day} className="bg-background p-2 rounded border">
                                                    <span className="font-medium capitalize">{day}:</span> {hours.open} - {hours.close}
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    )
}

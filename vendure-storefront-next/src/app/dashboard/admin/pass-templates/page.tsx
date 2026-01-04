"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Ticket, ShieldCheck, Zap, Pencil, Trash2 } from "lucide-react"
import { bookingClient, PassTemplate } from "@/lib/booking-client"
import { getZKeyAuthToken } from "@/lib/auth-client"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
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

export default function PassTemplatesPage() {
    const [templates, setTemplates] = useState<PassTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [name, setName] = useState("")
    const [type, setType] = useState<"PACK" | "MEMBERSHIP">("PACK")
    const [credits, setCredits] = useState("")
    const [unlimited, setUnlimited] = useState(false)
    const [duration, setDuration] = useState("")

    // Edit state
    const [editingTemplate, setEditingTemplate] = useState<PassTemplate | null>(null)
    const [editName, setEditName] = useState("")
    const [editType, setEditType] = useState<"PACK" | "MEMBERSHIP">("PACK")
    const [editCredits, setEditCredits] = useState("")
    const [editUnlimited, setEditUnlimited] = useState(false)
    const [editDuration, setEditDuration] = useState("")
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    const fetchTemplates = async () => {
        try {
            const data = await bookingClient.getAllPassTemplates()
            setTemplates(data)
        } catch (error) {
            console.error("Failed to fetch templates", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTemplates()
    }, [])

    const handleCreateTemplate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = await getZKeyAuthToken()
            if (!token) throw new Error("Not authenticated")

            await bookingClient.createPassTemplate(token, {
                name,
                type,
                creditsAmount: credits ? parseInt(credits) : undefined,
                unlimited,
                validDurationDays: duration ? parseInt(duration) : undefined
            })
            toast.success("Pass template created successfully")
            setName("")
            setCredits("")
            setDuration("")
            setUnlimited(false)
            fetchTemplates()
        } catch (error) {
            toast.error("Failed to create template")
        }
    }

    const handleUpdateTemplate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingTemplate) return
        try {
            const token = await getZKeyAuthToken()
            if (!token) throw new Error("Not authenticated")

            await bookingClient.updatePassTemplate(token, {
                id: editingTemplate.id,
                name: editName,
                type: editType,
                creditsAmount: editCredits ? parseInt(editCredits) : undefined,
                unlimited: editUnlimited,
                validDurationDays: editDuration ? parseInt(editDuration) : undefined
            })
            toast.success("Pass template updated successfully")
            setIsEditDialogOpen(false)
            setEditingTemplate(null)
            fetchTemplates()
        } catch (error) {
            toast.error("Failed to update template")
        }
    }

    const handleDeleteTemplate = async (id: string) => {
        try {
            const token = await getZKeyAuthToken()
            if (!token) throw new Error("Not authenticated")

            await bookingClient.deletePassTemplate(token, id)
            toast.success("Pass template deleted successfully")
            fetchTemplates()
        } catch (error) {
            toast.error("Failed to delete template")
        }
    }

    const openEditDialog = (template: PassTemplate) => {
        setEditingTemplate(template)
        setEditName(template.name)
        setEditType(template.type as any)
        setEditCredits(template.creditsAmount?.toString() || "")
        setEditUnlimited(template.unlimited)
        setEditDuration(template.validDurationDays?.toString() || "")
        setIsEditDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Pass Templates</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Create New Pass Template</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateTemplate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Template Name</label>
                                <Input
                                    placeholder="e.g. 10 Entry Pack, Gold Membership"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Pass Type</label>
                                <Select value={type} onValueChange={(val: any) => setType(val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PACK">Pack (Credit-based)</SelectItem>
                                        <SelectItem value="MEMBERSHIP">Membership (Time-based)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2 py-2">
                                <Switch checked={unlimited} onCheckedChange={setUnlimited} id="unlimited" />
                                <label htmlFor="unlimited" className="text-sm font-medium">Unlimited Credits</label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {!unlimited && type === "PACK" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Credits Amount</label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 10"
                                        value={credits}
                                        onChange={(e) => setCredits(e.target.value)}
                                        required={!unlimited}
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Validity (Days)</label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 30"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Days until expiry after activation</p>
                            </div>
                            <Button type="submit" className="w-full mt-2">
                                <Plus className="mr-2 h-4 w-4" /> Create Pass Template
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Existing Templates</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                            ) : templates.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No templates found.</TableCell></TableRow>
                            ) : templates.map((template) => (
                                <TableRow key={template.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center">
                                            <Ticket className="mr-2 h-4 w-4 text-muted-foreground" />
                                            {template.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center">
                                            {template.type === "MEMBERSHIP" ? <ShieldCheck className="mr-1 h-3 w-3 text-blue-500" /> : <Zap className="mr-1 h-3 w-3 text-amber-500" />}
                                            {template.type}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {template.unlimited ? "Unlimited" : template.creditsAmount ? `${template.creditsAmount} Credits` : "N/A"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditDialog(template)}
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
                                                            This will permanently delete the pass template "{template.name}". This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteTemplate(template.id)}
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
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Pass Template</DialogTitle>
                        <DialogDescription>
                            Update the pass template details.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateTemplate} className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Template Name</label>
                                <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Pass Type</label>
                                <Select value={editType} onValueChange={(val: any) => setEditType(val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PACK">Pack (Credit-based)</SelectItem>
                                        <SelectItem value="MEMBERSHIP">Membership (Time-based)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2 py-2">
                                <Switch checked={editUnlimited} onCheckedChange={setEditUnlimited} id="edit-unlimited" />
                                <label htmlFor="edit-unlimited" className="text-sm font-medium">Unlimited Credits</label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {!editUnlimited && editType === "PACK" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Credits Amount</label>
                                    <Input
                                        type="number"
                                        value={editCredits}
                                        onChange={(e) => setEditCredits(e.target.value)}
                                        required={!editUnlimited}
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Validity (Days)</label>
                                <Input
                                    type="number"
                                    value={editDuration}
                                    onChange={(e) => setEditDuration(e.target.value)}
                                />
                            </div>
                        </div>
                    </form>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" onClick={(e) => handleUpdateTemplate(e as any)}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

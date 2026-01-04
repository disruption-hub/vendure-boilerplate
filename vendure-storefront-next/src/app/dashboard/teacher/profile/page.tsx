"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { User, Briefcase, Award } from "lucide-react"
import { toast } from "sonner"
import { bookingClient, ServiceProvider } from "@/lib/booking-client"
import { getZKeyAuthToken } from "@/lib/auth-client"

export default function ProviderProfilePage() {
    const [profile, setProfile] = useState<ServiceProvider | null>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)

    const [bio, setBio] = useState("")
    const [specialties, setSpecialties] = useState<string[]>([])
    const [newSpecialty, setNewSpecialty] = useState("")

    const fetchProfile = async () => {
        try {
            const token = await getZKeyAuthToken()
            if (!token) return
            const data = await bookingClient.getMyProviderProfile(token)
            setProfile(data)
            setBio(data?.bio || "")
            setSpecialties(data?.specialties || [])
        } catch (error) {
            toast.error("Failed to fetch profile")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProfile()
    }, [])

    const handleSave = async () => {
        try {
            const token = await getZKeyAuthToken()
            if (!token) return
            await bookingClient.updateMyProviderProfile(token, { bio, specialties })
            toast.success("Profile updated successfully")
            setEditing(false)
            fetchProfile()
        } catch (error) {
            toast.error("Failed to update profile")
        }
    }

    const addSpecialty = () => {
        if (newSpecialty && !specialties.includes(newSpecialty)) {
            setSpecialties([...specialties, newSpecialty])
            setNewSpecialty("")
        }
    }

    const removeSpecialty = (spec: string) => {
        setSpecialties(specialties.filter(s => s !== spec))
    }

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>

    if (!profile) {
        return (
            <div className="p-8 text-center">
                <p className="text-muted-foreground">No provider profile found. Please contact an administrator.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Provider Profile</h1>
                    <p className="text-muted-foreground">Manage your professional information and specialties.</p>
                </div>
                {!editing ? (
                    <Button onClick={() => setEditing(true)}>Edit Profile</Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => {
                            setEditing(false)
                            setBio(profile.bio || "")
                            setSpecialties(profile.specialties || [])
                        }}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </div>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Profile Type</CardTitle>
                        <User className="ml-auto h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Service Provider</div>
                        <p className="text-xs text-muted-foreground">Teacher / Coach</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Blueprint</CardTitle>
                        <Briefcase className="ml-auto h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{profile.profile?.name || "None"}</div>
                        <p className="text-xs text-muted-foreground">Industry vertical</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Specialties</CardTitle>
                        <Award className="ml-auto h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{specialties.length}</div>
                        <p className="text-xs text-muted-foreground">Areas of expertise</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Professional Bio</CardTitle>
                    <CardDescription>Tell clients about your experience and approach.</CardDescription>
                </CardHeader>
                <CardContent>
                    {editing ? (
                        <Textarea
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            placeholder="Share your background, certifications, and teaching philosophy..."
                            rows={6}
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {bio || "No bio provided yet."}
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Specialties & Expertise</CardTitle>
                    <CardDescription>Tags that help clients find you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {specialties.map(spec => (
                            <Badge key={spec} variant="secondary" className="text-sm">
                                {spec}
                                {editing && (
                                    <button
                                        onClick={() => removeSpecialty(spec)}
                                        className="ml-2 text-muted-foreground hover:text-foreground"
                                    >
                                        ×
                                    </button>
                                )}
                            </Badge>
                        ))}
                        {specialties.length === 0 && (
                            <span className="text-sm text-muted-foreground italic">No specialties added yet.</span>
                        )}
                    </div>
                    {editing && (
                        <div className="flex gap-2">
                            <Input
                                placeholder="e.g. Vinyasa Yoga, Meditation"
                                value={newSpecialty}
                                onChange={e => setNewSpecialty(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && addSpecialty()}
                            />
                            <Button onClick={addSpecialty} variant="outline">Add</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

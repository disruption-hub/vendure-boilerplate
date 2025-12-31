"use client";

import { useEffect, useState } from 'react';
import { User, Wallet, Mail, ShieldCheck, Loader2, Camera, UserCircle, FileDigit, Globe, Calendar, MapPin, Building, Save, Phone, Edit2, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import CountryCodeSelect from '../../components/CountryCodeSelect';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

interface UserProfile {
    name: string;
    email: string;
    isVerified: boolean;
    walletAddress?: string;
    profilePicture?: string;
    phoneNumber?: string;
    countryCode?: string;
    documentId?: string;
    nationality?: string;
    birthDate?: string;
    address?: string;
    city?: string;
    country?: string;
    kycStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
    pendingProfileData?: any; // Contains potential updates
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<UserProfile>>({});

    const fetchProfile = async () => {
        const token = localStorage.getItem('investor_token');

        if (!token) {
            toast.error('Please log in to view your profile.');
            window.location.href = '/investor-portal/login';
            return;
        }

        try {
            const res = await fetch(`${API_URL}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.removeItem('investor_token');
                    window.location.href = '/investor-portal/login';
                    return;
                }
                throw new Error('Failed to fetch profile');
            }
            const data = await res.json();
            setProfile(data);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
            </div>
        );
    }

    if (!profile && !isLoading) {
        return (
            <div className="text-center p-8 bg-slate-900 rounded-xl border border-white/5 text-slate-400">
                Failed to load profile. Please refresh or log in again.
            </div>
        );
    }

    if (!profile) return null;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limit size to 1MB
        if (file.size > 1024 * 1024) {
            toast.error('File size too large. Please select an image under 1MB.');
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            const token = localStorage.getItem('investor_token');

            try {
                const res = await fetch(`${API_URL}/auth/profile-picture`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ profilePicture: base64String })
                });

                if (!res.ok) throw new Error('Failed to upload picture');

                const updatedProfile = await res.json();
                localStorage.setItem('investor_picture', updatedProfile.profilePicture || base64String);
                window.dispatchEvent(new Event('profile-update'));

                setProfile(updatedProfile);
                toast.success('Profile picture updated');
            } catch (err: any) {
                console.error(err);
                toast.error('Failed to update profile picture');
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        const token = localStorage.getItem('investor_token');
        try {
            // Simple cleaning: just trim whitespace
            let cleanPhone = (editData.phoneNumber || '').trim();
            // Remove all spaces from phone number for consistency
            cleanPhone = cleanPhone.replace(/\s+/g, '');

            // Note: We do NOT strip the country code here anymore to prevent accidental data loss.
            // If the user explicitly typed the country code in the phone field, we leave it.
            // But optimal UX is they just type the number.

            const dataToSend = {
                ...editData,
                phoneNumber: cleanPhone
            };

            const res = await fetch(`${API_URL}/auth/kyc`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend)
            });

            if (!res.ok) throw new Error('Failed to update profile');

            const result = await res.json();

            if (result.status === 'PENDING_VERIFICATION') {
                toast.success(result.message || 'Verification email sent. Please confirm changes via email.');
                setIsEditing(false);
                fetchProfile();
                return;
            }

            const updatedProfile = result;

            if (updatedProfile.name) {
                localStorage.setItem('investor_name', updatedProfile.name);
            }
            window.dispatchEvent(new Event('profile-update'));

            setProfile(updatedProfile);
            setIsEditing(false);
            toast.success('Profile updated successfully');
        } catch (err: any) {
            console.error(err);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const startEditing = () => {
        if (!profile) return;

        // Date safety check
        let formattedDate = '';
        if (profile.birthDate) {
            try {
                const d = new Date(profile.birthDate);
                if (!isNaN(d.getTime())) {
                    formattedDate = d.toISOString().split('T')[0];
                }
            } catch (e) {
                console.error("Invalid date format", e);
            }
        }

        // Phone logic:
        // We trust the backend `phoneNumber` is the number and `countryCode` is the code.
        // We only strip explicitly if we detect a double-prefix (e.g. phone starts with country code).
        let cleanPhone = (profile.phoneNumber || '').trim();
        const countryCode = (profile.countryCode || '+1').trim();

        // If phone number explicitly replicates the country code, strip it for the inputs
        // This handles cases where backend might have stored concatenated string
        if (countryCode.length > 1 && cleanPhone.startsWith(countryCode)) {
            cleanPhone = cleanPhone.substring(countryCode.length).trim();
        }

        setEditData({
            name: profile.name || '',
            phoneNumber: cleanPhone,
            countryCode: countryCode,
            documentId: profile.documentId || '',
            nationality: profile.nationality || '',
            birthDate: formattedDate,
            address: profile.address || '',
            city: profile.city || '',
            country: profile.country || '',
        });
        setIsEditing(true);
    };

    const renderPending = (field: keyof UserProfile, label?: string) => {
        if (!profile?.pendingProfileData) return null;
        const pendingValue = profile.pendingProfileData[field];
        // Skip if values match (loose comparison for numbers/strings)
        if (pendingValue == profile[field] || (pendingValue === undefined && !profile[field])) return null;

        // Date formatting check
        let displayValue = pendingValue;
        if (field === 'birthDate' && pendingValue) {
            try { displayValue = new Date(pendingValue).toLocaleDateString(); } catch { }
        }

        return (
            <div className="mt-1.5 flex items-start gap-1.5 text-xs text-brand-gold bg-brand-gold/5 px-2.5 py-1.5 rounded-md border border-brand-gold/10">
                <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span><span className="opacity-70">Pending change:</span> <span className="font-medium text-white">{displayValue}</span></span>
            </div>
        );
    };

    const renderPendingPhone = () => {
        if (!profile?.pendingProfileData) return null;
        const pendingCC = profile.pendingProfileData.countryCode;
        const pendingPhone = profile.pendingProfileData.phoneNumber;

        const ccChanged = pendingCC && pendingCC !== profile.countryCode;
        const phoneChanged = pendingPhone && pendingPhone !== profile.phoneNumber;

        if (!ccChanged && !phoneChanged) return null;

        return (
            <div className="mt-1.5 flex items-start gap-1.5 text-xs text-brand-gold bg-brand-gold/5 px-2.5 py-1.5 rounded-md border border-brand-gold/10">
                <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                    <span className="opacity-70">Pending change:</span>{' '}
                    <span className="font-medium text-white">
                        {pendingCC || profile.countryCode} {pendingPhone || profile.phoneNumber}
                    </span>
                </span>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
                <div className="flex items-center gap-3">
                    {isEditing ? (
                        <>
                            <Button
                                variant="outline"
                                className="bg-white text-black border-white hover:bg-white/90"
                                onClick={() => setIsEditing(false)}
                                disabled={isSaving}
                            >
                                <X className="w-4 h-4 mr-2 text-black" />
                                Cancel
                            </Button>
                            <Button
                                className="bg-brand-gold text-brand-blue font-bold hover:bg-brand-gold/90"
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <Button
                            className="bg-brand-gold text-brand-blue font-bold hover:bg-brand-gold/90"
                            onClick={startEditing}
                        >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit Profile
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 text-center">
                        <div className="relative w-32 h-32 mx-auto mb-6 group">
                            <div className="w-32 h-32 bg-brand-gold/10 rounded-full flex items-center justify-center border-2 border-brand-gold/20 overflow-hidden">
                                {profile.profilePicture ? (
                                    <img
                                        src={profile.profilePicture}
                                        alt={profile.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-16 h-16 text-brand-gold" />
                                )}
                            </div>

                            <label className="absolute bottom-0 right-0 p-2 bg-brand-gold rounded-full cursor-pointer hover:bg-brand-gold/90 transition-all shadow-lg text-brand-blue group-hover:scale-110">
                                {isUploading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Camera className="w-5 h-5" />
                                )}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                            </label>
                        </div>

                        <h2 className="text-xl font-bold text-white mb-1">{profile.name}</h2>
                        <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                            <ShieldCheck className="w-3 h-3" />
                            {profile.kycStatus === 'VERIFIED' ? 'Verified Investor' : profile.kycStatus === 'PENDING' ? 'KYC Pending' : 'KYC Rejected'}
                        </div>

                        {profile.kycStatus === 'PENDING' && (
                            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <p className="text-[10px] text-amber-500 uppercase tracking-widest font-bold">
                                    Verification in Progress
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Details */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <UserCircle className="w-5 h-5 text-brand-slate" />
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pt-2">
                            <div className="md:col-span-2">
                                <label className="text-xs text-brand-slate uppercase tracking-wider block mb-1">Full Name</label>
                                {isEditing ? (
                                    <Input
                                        name="name"
                                        value={editData.name || ''}
                                        onChange={handleInputChange}
                                        className="bg-black/20 border-white/10 text-white"
                                        placeholder="Your Name"
                                    />
                                ) : (
                                    <div className="p-3 bg-black/20 rounded-lg text-white border border-white/5">
                                        {profile.name}
                                    </div>
                                )}
                                {renderPending('name')}
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-brand-slate" />
                            Contact Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-brand-slate uppercase tracking-wider block mb-1">Email Address</label>
                                <div className="p-3 bg-black/20 rounded-lg text-white/50 border border-white/5 cursor-not-allowed">
                                    {profile.email}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">Email cannot be changed.</p>
                            </div>
                            <div>
                                <label className="text-xs text-brand-slate uppercase tracking-wider block mb-1">Phone Number</label>
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <div className="shrink-0">
                                            <CountryCodeSelect
                                                value={editData.countryCode || '+1'}
                                                onChange={(code) => setEditData(prev => ({ ...prev, countryCode: code }))}
                                            />
                                        </div>
                                        <Input
                                            name="phoneNumber"
                                            value={editData.phoneNumber || ''}
                                            onChange={handleInputChange}
                                            className="flex-1 bg-black/20 border-white/10 text-white"
                                            placeholder="555-0123"
                                        />
                                    </div>
                                ) : (
                                    <div className="p-3 bg-black/20 rounded-lg text-white border border-white/5 flex items-center gap-2">
                                        <Phone className="w-3 h-3 text-brand-gold" />
                                        {profile.countryCode} {profile.phoneNumber}
                                    </div>
                                )}
                                {renderPendingPhone()}
                            </div>
                        </div>
                    </div>

                    {/* KYC Section */}
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <FileDigit className="w-5 h-5 text-brand-slate" />
                            KYC Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-brand-slate uppercase tracking-wider block mb-1">Document ID (DNI/Passport)</label>
                                {isEditing ? (
                                    <Input
                                        name="documentId"
                                        value={editData.documentId || ''}
                                        onChange={handleInputChange}
                                        className="bg-black/20 border-white/10 text-white"
                                    />
                                ) : (
                                    <div className="p-3 bg-black/20 rounded-lg text-white border border-white/5">
                                        {profile.documentId || 'Not provided'}
                                    </div>
                                )}
                                {renderPending('documentId')}
                            </div>
                            <div>
                                <label className="text-xs text-brand-slate uppercase tracking-wider block mb-1">Nationality</label>
                                {isEditing ? (
                                    <Input
                                        name="nationality"
                                        value={editData.nationality || ''}
                                        onChange={handleInputChange}
                                        className="bg-black/20 border-white/10 text-white"
                                    />
                                ) : (
                                    <div className="p-3 bg-black/20 rounded-lg text-white border border-white/5 flex items-center gap-2">
                                        <Globe className="w-3 h-3 text-brand-slate" />
                                        {profile.nationality || 'Not provided'}
                                    </div>
                                )}
                                {renderPending('nationality')}
                            </div>
                            <div>
                                <label className="text-xs text-brand-slate uppercase tracking-wider block mb-1">Date of Birth</label>
                                {isEditing ? (
                                    <Input
                                        name="birthDate"
                                        type="date"
                                        value={editData.birthDate || ''}
                                        onChange={handleInputChange}
                                        className="bg-black/20 border-white/10 text-white"
                                    />
                                ) : (
                                    <div className="p-3 bg-black/20 rounded-lg text-white border border-white/5 flex items-center gap-2">
                                        <Calendar className="w-3 h-3 text-brand-slate" />
                                        {profile.birthDate ? new Date(profile.birthDate).toLocaleDateString() : 'Not provided'}
                                    </div>
                                )}
                                {renderPending('birthDate')}
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-brand-gold" />
                                Residential Address
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-xs text-brand-slate uppercase tracking-wider block mb-1">Full Address</label>
                                    {isEditing ? (
                                        <Input
                                            name="address"
                                            value={editData.address || ''}
                                            onChange={handleInputChange}
                                            className="bg-black/20 border-white/10 text-white"
                                        />
                                    ) : (
                                        <div className="p-3 bg-black/20 rounded-lg text-white border border-white/5">
                                            {profile.address || 'Not provided'}
                                        </div>
                                    )}
                                    {renderPending('address')}
                                </div>
                                <div>
                                    <label className="text-xs text-brand-slate uppercase tracking-wider block mb-1">City</label>
                                    {isEditing ? (
                                        <Input
                                            name="city"
                                            value={editData.city || ''}
                                            onChange={handleInputChange}
                                            className="bg-black/20 border-white/10 text-white"
                                        />
                                    ) : (
                                        <div className="p-3 bg-black/20 rounded-lg text-white border border-white/5 flex items-center gap-2">
                                            <Building className="w-3 h-3 text-brand-slate" />
                                            {profile.city || 'Not provided'}
                                        </div>
                                    )}
                                    {renderPending('city')}
                                </div>
                                <div>
                                    <label className="text-xs text-brand-slate uppercase tracking-wider block mb-1">Country</label>
                                    {isEditing ? (
                                        <Input
                                            name="country"
                                            value={editData.country || ''}
                                            onChange={handleInputChange}
                                            className="bg-black/20 border-white/10 text-white"
                                        />
                                    ) : (
                                        <div className="p-3 bg-black/20 rounded-lg text-white border border-white/5">
                                            {profile.country || 'Not provided'}
                                        </div>
                                    )}
                                    {renderPending('country')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Wallet */}
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-brand-slate" />
                            Connected Wallet
                        </h3>

                        {profile.walletAddress ? (
                            <div className="p-4 bg-brand-gold/5 rounded-xl border border-brand-gold/20">
                                <label className="text-xs text-brand-gold uppercase tracking-wider block mb-1">Stellar Address</label>
                                <div className="font-mono text-sm text-white break-all">
                                    {profile.walletAddress}
                                </div>
                                <div className="mt-2 text-xs text-brand-slate flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    Active Connection
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-8 bg-black/20 rounded-xl border border-white/5 border-dashed">
                                <p className="text-brand-slate text-sm mb-4">No wallet connected yet.</p>
                                {/* We could add a connect button here later */}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

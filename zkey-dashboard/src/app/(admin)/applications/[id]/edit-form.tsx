"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateApplication, deleteApplication, regenerateClientSecret } from "./actions";
import { Trash2, Plus, Copy, Check, ExternalLink, Save, Loader2, Smartphone, Mail, Globe, Shield, Activity, Share2, Settings, Palette, Key, Eye, EyeOff, RefreshCw, Lock, Settings2, Terminal, AlertTriangle, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Tenant {
    id: string;
    name: string;
}

interface Application {
    id: string;
    name: string;
    description?: string;
    clientId: string;
    clientSecret: string;
    tenantId: string;
    corsOrigins: string[];
    redirectUris: string[];
    postLogoutRedirectUris: string[];
    authMethods: any;
    logo?: string;
    primaryColor?: string;
    alwaysIssueRefreshToken: boolean;
    rotateRefreshToken: boolean;
    refreshTokenTtl: number;
    backchannelLogoutUri?: string;
    isSessionRequired: boolean;
    customData?: any;
    branding?: {
        logo?: string;
        primaryColor?: string;
        backgroundColor?: string;
        loginTitle?: string;
        loginSubtitle?: string;
    };
    integrations?: {
        brevoApiKey?: string;
        brevoSenderEmail?: string;
        brevoSenderName?: string;
        labsmobileApiKey?: string;
        labsmobileUser?: string;
        labsmobileUrl?: string;
        labsmobileSenderId?: string;
        vendure?: {
            enabled?: boolean;
            adminApiUrl?: string;
            authTokenHeader?: string;
            adminApiToken?: string;
            superadminUsername?: string;
            superadminPassword?: string;
        };
    };
}

export function EditApplicationForm({ application, tenants }: { application: any; tenants: Tenant[] }) {
    const [isPending, startTransition] = useTransition();
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'auth' | 'branding' | 'settings' | 'endpoints' | 'providers'>('general');
    const [copied, setCopied] = useState<string | null>(null);
    const router = useRouter();

    // Endpoints
    const issuerUrl = process.env.NEXT_PUBLIC_ZKEY_URL || 'https://zkey-backend-production.up.railway.app';

    // State for dynamic lists
    const [corsOrigins, setCorsOrigins] = useState<string[]>(application.corsOrigins.length > 0 ? application.corsOrigins : ['']);
    const [redirectUris, setRedirectUris] = useState<string[]>(application.redirectUris.length > 0 ? application.redirectUris : ['']);
    const [postLogoutRedirectUris, setPostLogoutRedirectUris] = useState<string[]>(
        application.postLogoutRedirectUris && application.postLogoutRedirectUris.length > 0
            ? application.postLogoutRedirectUris
            : ['']
    );

    const [showSecret, setShowSecret] = useState(false);
    const [currentSecret, setCurrentSecret] = useState(application.clientSecret || "");
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [showRegenerateModal, setShowRegenerateModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [newlyGeneratedSecret, setNewlyGeneratedSecret] = useState<string | null>(null);

    const [vendureEnabled, setVendureEnabled] = useState<boolean>(!!(application.integrations as any)?.vendure?.enabled);

    // Branding State
    const [logoPreview, setLogoPreview] = useState<string | null>(application.logo || application.branding?.logo || null);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Logo file size must be less than 2MB");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setLogoPreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRegenerateSecret = async () => {
        setIsRegenerating(true);
        try {
            const result = await regenerateClientSecret(application.id);
            if (result.success) {
                setCurrentSecret(result.secret);
                setNewlyGeneratedSecret(result.secret);
                setShowRegenerateModal(false);
                setShowSuccessModal(true);
                toast.success("Client secret regenerated successfully");
            }
        } catch (error) {
            toast.error("Failed to regenerate secret");
        } finally {
            setIsRegenerating(false);
        }
    };

    const authMethods = typeof application.authMethods === 'string'
        ? JSON.parse(application.authMethods)
        : (application.authMethods || { password: true, emailOtp: false, smsOtp: false, wallet: false });

    const registrationOtp =
        authMethods.registrationOtp ??
        (authMethods.emailOtp && authMethods.smsOtp ? 'both' : authMethods.emailOtp ? 'email' : authMethods.smsOtp ? 'sms' : 'email');

    function copyToClipboard(text: string, id: string) {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    }

    function addUrl(type: 'cors' | 'redirect' | 'logout') {
        if (type === 'cors') {
            setCorsOrigins([...corsOrigins, '']);
        } else if (type === 'redirect') {
            setRedirectUris([...redirectUris, '']);
        } else {
            setPostLogoutRedirectUris([...postLogoutRedirectUris, '']);
        }
    }

    function removeUrl(type: 'cors' | 'redirect' | 'logout', index: number) {
        if (type === 'cors') {
            const newOrigins = [...corsOrigins];
            newOrigins.splice(index, 1);
            setCorsOrigins(newOrigins.length > 0 ? newOrigins : ['']);
        } else if (type === 'redirect') {
            const newUris = [...redirectUris];
            newUris.splice(index, 1);
            setRedirectUris(newUris.length > 0 ? newUris : ['']);
        } else {
            const newUris = [...postLogoutRedirectUris];
            newUris.splice(index, 1);
            setPostLogoutRedirectUris(newUris.length > 0 ? newUris : ['']);
        }
    }

    function updateUrl(type: 'cors' | 'redirect' | 'logout', index: number, value: string) {
        if (type === 'cors') {
            const newOrigins = [...corsOrigins];
            newOrigins[index] = value;
            setCorsOrigins(newOrigins);
        } else if (type === 'redirect') {
            const newUris = [...redirectUris];
            newUris[index] = value;
            setRedirectUris(newUris);
        } else {
            const newUris = [...postLogoutRedirectUris];
            newUris[index] = value;
            setPostLogoutRedirectUris(newUris);
        }
    }

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            try {
                await updateApplication(application.id, formData);
                toast.success("Application updated successfully");
                router.refresh();
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to update application");
            }
        });
    }

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this application? This action cannot be undone.")) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteApplication(application.id);
            toast.success("Application deleted successfully");
            router.push("/applications");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete application");
            setIsDeleting(false);
        }
    }

    const tabs = [
        { id: 'general', name: 'General', icon: Globe },
        { id: 'branding', name: 'Branding', icon: Palette },
        { id: 'auth', name: 'Authentication', icon: Lock },
        { id: 'settings', name: 'Settings', icon: Settings2 },
        { id: 'endpoints', name: 'Endpoints', icon: Terminal },
        { id: 'providers', name: 'Providers', icon: Mail },
    ];

    return (
        <>
            <form action={handleSubmit} className="space-y-8 pb-12">
                <div className="flex border-b overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                                activeTab === tab.id
                                    ? "border-blue-600 text-blue-600 bg-blue-50/50"
                                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            )}
                        >
                            <tab.icon className="w-4 h-4 mr-2" />
                            {tab.name}
                        </button>
                    ))}
                </div>

                <div className="min-h-[400px]">
                    {/* General Tab */}
                    <div className={cn("space-y-6 animate-in fade-in slide-in-from-left-2 duration-300", activeTab === 'general' ? "block" : "hidden")}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="tenantId" className="text-sm font-semibold text-slate-700">Owner Tenant</label>
                                <select
                                    id="tenantId"
                                    name="tenantId"
                                    required
                                    defaultValue={application.tenantId}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                                >
                                    {tenants.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-semibold text-slate-700">Application Name</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    defaultValue={application.name}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-semibold text-slate-700">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                defaultValue={application.description || ""}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm h-20"
                                placeholder="A brief description of this application..."
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-slate-700">CORS Origins</label>
                                    <button
                                        type="button"
                                        onClick={() => addUrl('cors')}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center text-xs font-medium"
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add Origin
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {corsOrigins.map((origin, index) => (
                                        <div key={`cors - ${index} `} className="flex items-center gap-2">
                                            <input
                                                name="corsOrigins"
                                                type="text"
                                                value={origin}
                                                onChange={(e) => updateUrl('cors', index, e.target.value)}
                                                placeholder="https://example.com"
                                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm font-mono text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeUrl('cors', index)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                disabled={corsOrigins.length === 1 && corsOrigins[0] === ''}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-slate-700">Redirect URIs</label>
                                    <button
                                        type="button"
                                        onClick={() => addUrl('redirect')}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center text-xs font-medium"
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add URI
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {redirectUris.map((uri, index) => (
                                        <div key={`redirect - ${index} `} className="flex items-center gap-2">
                                            <input
                                                name="redirectUris"
                                                type="text"
                                                value={uri}
                                                onChange={(e) => updateUrl('redirect', index, e.target.value)}
                                                placeholder="https://example.com/callback"
                                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm font-mono text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeUrl('redirect', index)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                disabled={redirectUris.length === 1 && redirectUris[0] === ''}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-slate-700">Post Logout Redirect URIs</label>
                                    <button
                                        type="button"
                                        onClick={() => addUrl('logout')}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center text-xs font-medium"
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add URI
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {postLogoutRedirectUris.map((uri, index) => (
                                        <div key={`logout - ${index} `} className="flex items-center gap-2">
                                            <input
                                                name="postLogoutRedirectUris"
                                                type="text"
                                                value={uri}
                                                onChange={(e) => updateUrl('logout', index, e.target.value)}
                                                placeholder="https://example.com/logout-callback"
                                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm font-mono text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeUrl('logout', index)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                disabled={postLogoutRedirectUris.length === 1 && postLogoutRedirectUris[0] === ''}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Branding Tab */}
                    <div className={cn("space-y-6 animate-in fade-in slide-in-from-left-2 duration-300", activeTab === 'branding' ? "block" : "hidden")}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Hidden input to store base64 string */}
                            <input type="hidden" name="logo" value={logoPreview || ''} />

                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Application Logo</label>
                                <div className="flex items-center gap-6">
                                    <div className="flex-shrink-0">
                                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden relative group transition-colors hover:border-blue-400">
                                            {logoPreview ? (
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo preview"
                                                    className="w-full h-full object-contain p-2"
                                                />
                                            ) : (
                                                <div className="text-slate-300 group-hover:text-blue-400 transition-colors">
                                                    <Palette className="w-8 h-8 mx-auto mb-1" />
                                                    <span className="text-[10px] block text-center font-medium">No Logo</span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        {logoPreview && (
                                            <button
                                                type="button"
                                                onClick={() => setLogoPreview(null)}
                                                className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium flex items-center justify-center w-full"
                                            >
                                                <Trash2 className="w-3 h-3 mr-1" /> Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-2 text-sm text-slate-500">
                                        <p>Upload your application logo to be displayed on the login screen and emails.</p>
                                        <p className="text-xs text-slate-400">Recommended size: 512x512px. Max size: 2MB. formats: PNG, JPG, WEBP.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="primaryColor" className="text-sm font-semibold text-slate-700">Primary Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        id="primaryColorPicker"
                                        defaultValue={application.branding?.primaryColor || application.primaryColor || "#3b82f6"}
                                        className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                                        onChange={(e) => {
                                            const next = e.target.nextElementSibling as HTMLInputElement;
                                            if (next) next.value = e.target.value;
                                        }}
                                    />
                                    <input
                                        id="primaryColor"
                                        name="primaryColor"
                                        type="text"
                                        defaultValue={application.branding?.primaryColor || application.primaryColor || "#3b82f6"}
                                        placeholder="#3b82f6"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm font-mono"
                                        onChange={(e) => {
                                            const prev = e.target.previousElementSibling as HTMLInputElement;
                                            if (prev) prev.value = e.target.value;
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="backgroundColor" className="text-sm font-semibold text-slate-700">Page Background Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        id="backgroundColorPicker"
                                        defaultValue={application.branding?.backgroundColor || "#0f172a"}
                                        className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                                        onChange={(e) => {
                                            const next = e.target.nextElementSibling as HTMLInputElement;
                                            if (next) next.value = e.target.value;
                                        }}
                                    />
                                    <input
                                        id="backgroundColor"
                                        name="backgroundColor"
                                        type="text"
                                        defaultValue={application.branding?.backgroundColor || "#0f172a"}
                                        placeholder="#0f172a"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm font-mono"
                                        onChange={(e) => {
                                            const prev = e.target.previousElementSibling as HTMLInputElement;
                                            if (prev) prev.value = e.target.value;
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="loginTitle" className="text-sm font-semibold text-slate-700">Login Form Title</label>
                                <input
                                    id="loginTitle"
                                    name="loginTitle"
                                    type="text"
                                    defaultValue={application.branding?.loginTitle || ""}
                                    placeholder="Sign in to your account"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                                />
                            </div>

                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <label htmlFor="loginSubtitle" className="text-sm font-semibold text-slate-700">Login Form Subtitle</label>
                                <textarea
                                    id="loginSubtitle"
                                    name="loginSubtitle"
                                    defaultValue={application.branding?.loginSubtitle || ""}
                                    placeholder="Enter your credentials to continue"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm h-24 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Authentication Tab */}
                    <div className={cn("space-y-6 animate-in fade-in slide-in-from-left-2 duration-300", activeTab === 'auth' ? "block" : "hidden")}>
                        <div className="rounded-xl border bg-white p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Sign-in methods</h3>
                                    <p className="text-xs text-slate-500 mt-1">Controls what options are shown on the hosted login UI.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                                <label className="flex items-center p-4 border rounded-xl hover:bg-slate-50 cursor-pointer transition-all shadow-sm group">
                                    <input type="checkbox" name="auth_password" defaultChecked={authMethods.password} className="w-4 h-4 text-blue-600 rounded border-slate-300 mr-4 focus:ring-blue-500" />
                                    <div>
                                        <span className="text-sm font-bold text-slate-700 block">Password</span>
                                        <span className="text-[11px] text-slate-400">Email + password</span>
                                    </div>
                                </label>

                                <label className="flex items-center p-4 border rounded-xl hover:bg-slate-50 cursor-pointer transition-all shadow-sm group">
                                    <input type="checkbox" name="auth_emailOtp" defaultChecked={authMethods.emailOtp} className="w-4 h-4 text-blue-600 rounded border-slate-300 mr-4 focus:ring-blue-500" />
                                    <div>
                                        <span className="text-sm font-bold text-slate-700 block">Email</span>
                                        <span className="text-[11px] text-slate-400">OTP to inbox</span>
                                    </div>
                                </label>

                                <label className="flex items-center p-4 border rounded-xl hover:bg-slate-50 cursor-pointer transition-all shadow-sm group">
                                    <input type="checkbox" name="auth_smsOtp" defaultChecked={authMethods.smsOtp} className="w-4 h-4 text-blue-600 rounded border-slate-300 mr-4 focus:ring-blue-500" />
                                    <div>
                                        <span className="text-sm font-bold text-slate-700 block">Mobile (SMS)</span>
                                        <span className="text-[11px] text-slate-400">OTP to phone</span>
                                    </div>
                                </label>

                                <label className="flex items-center p-4 border rounded-xl hover:bg-slate-50 cursor-pointer transition-all shadow-sm group">
                                    <input type="checkbox" name="auth_wallet" defaultChecked={authMethods.wallet} className="w-4 h-4 text-blue-600 rounded border-slate-300 mr-4 focus:ring-blue-500" />
                                    <div>
                                        <span className="text-sm font-bold text-slate-700 block">Stellar Wallet</span>
                                        <span className="text-[11px] text-slate-400">Freighter signing</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-white p-5">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Registration OTP channel</h3>
                                <p className="text-xs text-slate-500 mt-1">Only applies to the Create Account flow.</p>
                            </div>

                            {authMethods.emailOtp && authMethods.smsOtp ? (
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <label className="flex items-center p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition-all">
                                        <input
                                            type="radio"
                                            name="registrationOtp"
                                            value="both"
                                            defaultChecked={registrationOtp === 'both'}
                                            className="w-4 h-4 text-blue-600 border-slate-300 mr-3 focus:ring-blue-500"
                                        />
                                        <div>
                                            <span className="text-sm font-bold text-slate-700 block">Email + SMS</span>
                                            <span className="text-[11px] text-slate-400">User can choose</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition-all">
                                        <input
                                            type="radio"
                                            name="registrationOtp"
                                            value="email"
                                            defaultChecked={registrationOtp === 'email'}
                                            className="w-4 h-4 text-blue-600 border-slate-300 mr-3 focus:ring-blue-500"
                                        />
                                        <div>
                                            <span className="text-sm font-bold text-slate-700 block">Email only</span>
                                            <span className="text-[11px] text-slate-400">Default for sign-up</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition-all">
                                        <input
                                            type="radio"
                                            name="registrationOtp"
                                            value="sms"
                                            defaultChecked={registrationOtp === 'sms'}
                                            className="w-4 h-4 text-blue-600 border-slate-300 mr-3 focus:ring-blue-500"
                                        />
                                        <div>
                                            <span className="text-sm font-bold text-slate-700 block">SMS only</span>
                                            <span className="text-[11px] text-slate-400">Force SMS on sign-up</span>
                                        </div>
                                    </label>
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="hidden"
                                        name="registrationOtp"
                                        value={authMethods.emailOtp ? 'email' : authMethods.smsOtp ? 'sms' : 'email'}
                                    />
                                    <div className="mt-4 text-xs text-slate-500 rounded-xl border bg-slate-50 px-4 py-3">
                                        {authMethods.emailOtp
                                            ? 'Registration will use Email OTP (only channel enabled).'
                                            : authMethods.smsOtp
                                                ? 'Registration will use SMS OTP (only channel enabled).'
                                                : 'No OTP channel enabled for registration.'}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Settings Tab */}
                    <div className={cn("space-y-6 animate-in fade-in slide-in-from-left-2 duration-300", activeTab === 'settings' ? "block" : "hidden")}>
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6">
                            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Refresh Token Management</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label className="flex items-start p-4 bg-white border rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                                    <input
                                        type="checkbox"
                                        name="alwaysIssueRefreshToken"
                                        defaultChecked={application.alwaysIssueRefreshToken}
                                        className="w-4 h-4 mt-1 text-blue-600 rounded border-slate-300 mr-4"
                                    />
                                    <div>
                                        <span className="text-sm font-bold text-slate-700 block">Always issue refresh token</span>
                                        <span className="text-xs text-slate-500 mt-1 block">Logto will always issue refresh tokens, regardless of consent prompt.</span>
                                    </div>
                                </label>

                                <label className="flex items-start p-4 bg-white border rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                                    <input
                                        type="checkbox"
                                        name="rotateRefreshToken"
                                        defaultChecked={application.rotateRefreshToken}
                                        className="w-4 h-4 mt-1 text-blue-600 rounded border-slate-300 mr-4"
                                    />
                                    <div>
                                        <span className="text-sm font-bold text-slate-700 block">Rotate refresh token</span>
                                        <span className="text-xs text-slate-500 mt-1 block">Issue a new refresh token when 70% of TTL has passed.</span>
                                    </div>
                                </label>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Refresh token TTL (days)</label>
                                    <input
                                        name="refreshTokenTtl"
                                        type="number"
                                        defaultValue={application.refreshTokenTtl || 14}
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6">
                            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Backchannel Logout</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Backchannel logout URI</label>
                                    <input
                                        name="backchannelLogoutUri"
                                        type="url"
                                        defaultValue={application.backchannelLogoutUri || ""}
                                        placeholder="https://your.website.com/backchannel_logout"
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <label className="flex items-start p-4 bg-white border rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                                    <input
                                        type="checkbox"
                                        name="isSessionRequired"
                                        defaultChecked={application.isSessionRequired}
                                        className="w-4 h-4 mt-1 text-blue-600 rounded border-slate-300 mr-4"
                                    />
                                    <div>
                                        <span className="text-sm font-bold text-slate-700 block">Is session required?</span>
                                        <span className="text-xs text-slate-500 mt-1 block">Include `sid` claim in the logout token.</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="customData" className="text-sm font-semibold text-slate-700">Custom Data (JSON)</label>
                            <textarea
                                id="customData"
                                name="customData"
                                defaultValue={JSON.stringify(application.customData || {}, null, 2)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm font-mono text-xs h-32"
                                placeholder="{}"
                            />
                        </div>
                    </div>

                    {/* Endpoints Tab */}
                    <div className={cn("space-y-6 animate-in fade-in slide-in-from-left-2 duration-300", activeTab === 'endpoints' ? "block" : "hidden")}>
                        <div className="bg-slate-900 text-slate-300 p-6 rounded-xl border border-slate-800 space-y-6">
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Endpoints</label>

                                {[
                                    { label: 'Logto endpoint', value: issuerUrl },
                                    { label: 'Issuer endpoint', value: `${issuerUrl}/oidc` },
                                    { label: 'JWKS URI', value: `${issuerUrl}/oidc/jwks` }
                                ].map((item) => (
                                    <div key={item.label} className="space-y-1">
                                        <span className="text-xs text-slate-400">{item.label}</span>
                                        <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                                            <code className="flex-1 text-blue-400 text-xs truncate">{item.value}</code>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(item.value, item.label)}
                                                className="text-slate-500 hover:text-white transition-colors"
                                            >
                                                {copied === item.label ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                            <a href={item.value} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div >

                            <div className="space-y-4 border-t border-slate-800 pt-6">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Credentials</label>

                                <div className="space-y-1">
                                    <span className="text-xs text-slate-400">App ID</span>
                                    <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                                        <code className="flex-1 text-white text-xs">{application.clientId}</code>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(application.clientId, 'id')}
                                            className="text-slate-500 hover:text-white transition-colors"
                                        >
                                            {copied === 'id' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-xs text-slate-400">App Secret</span>
                                    <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                                        <code className="flex-1 text-white text-xs font-mono">
                                            {currentSecret ? (showSecret ? currentSecret : "••••••••••••••••") : "No secret set"}
                                        </code>
                                        <div className="flex items-center gap-1">
                                            {currentSecret && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowSecret(!showSecret)}
                                                        className="p-1.5 text-slate-500 hover:text-white transition-colors rounded-md hover:bg-slate-900"
                                                        title={showSecret ? "Hide secret" : "Show secret"}
                                                    >
                                                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(currentSecret, 'secret')}
                                                        className="p-1.5 text-slate-500 hover:text-white transition-colors rounded-md hover:bg-slate-900"
                                                    >
                                                        {copied === 'secret' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setShowRegenerateModal(true)}
                                                disabled={isRegenerating}
                                                className="p-1.5 text-slate-500 hover:text-white transition-colors rounded-md hover:bg-slate-900"
                                                title="Regenerate secret"
                                            >
                                                <RefreshCw className={cn("w-4 h-4", isRegenerating && "animate-spin")} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        The Client Secret is used for confidential client authentication. Keep it secure.
                                    </p>
                                </div>
                            </div>
                        </div >
                    </div >

                    {/* Providers Tab */}
                    < div className={cn("space-y-6 animate-in fade-in slide-in-from-left-2 duration-300", activeTab === 'providers' ? "block" : "hidden")}>
                        <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center">
                                <Globe className="w-4 h-4 mr-2 text-blue-500" />
                                Vendure (Admin API)
                            </h4>

                            <label className="flex items-start p-4 bg-white border rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                                <input
                                    type="checkbox"
                                    name="vendureEnabled"
                                    checked={vendureEnabled}
                                    onChange={(e) => setVendureEnabled(e.target.checked)}
                                    className="w-4 h-4 mt-1 text-blue-600 rounded border-slate-300 mr-4"
                                />
                                <div>
                                    <span className="text-sm font-bold text-slate-700 block">Enable Vendure</span>
                                    <span className="text-xs text-slate-500 mt-1 block">Used for syncing/deleting users via Vendure Admin API.</span>
                                </div>
                            </label>

                            {vendureEnabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-semibold text-slate-500">Admin API URL</label>
                                        <input
                                            name="vendureAdminApiUrl"
                                            type="url"
                                            defaultValue={(application.integrations as any)?.vendure?.adminApiUrl || ''}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="http://localhost:3000/admin-api"
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-semibold text-slate-500">Auth Token Header (optional)</label>
                                        <input
                                            name="vendureAuthTokenHeader"
                                            type="text"
                                            defaultValue={(application.integrations as any)?.vendure?.authTokenHeader || ''}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="vendure-auth-token"
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-semibold text-slate-500">Admin API Token (recommended)</label>
                                        <input
                                            name="vendureAdminApiToken"
                                            type="password"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder={(application.integrations as any)?.vendure?.adminApiToken ? '••••••••••••' : 'Leave empty to use username/password'}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">Superadmin Username</label>
                                        <input
                                            name="vendureSuperadminUsername"
                                            type="text"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder={(application.integrations as any)?.vendure?.superadminUsername || 'superadmin'}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">Superadmin Password</label>
                                        <input
                                            name="vendureSuperadminPassword"
                                            type="password"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder={(application.integrations as any)?.vendure?.superadminPassword ? '••••••••••••' : 'superadmin'}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center">
                                <Mail className="w-4 h-4 mr-2 text-blue-500" />
                                Brevo (Email / OTP)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">API Key</label>
                                    <input name="brevoApiKey" type="password" defaultValue={application.integrations?.brevoApiKey || ""} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="xkeysib-..." />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Sender Email</label>
                                    <input name="brevoSenderEmail" type="email" defaultValue={application.integrations?.brevoSenderEmail || ""} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="noreply@acme.com" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Sender Name</label>
                                    <input name="brevoSenderName" type="text" defaultValue={application.integrations?.brevoSenderName || ""} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Acme Inc." />
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center">
                                <Smartphone className="w-4 h-4 mr-2 text-emerald-500" />
                                LabsMobile (SMS / OTP)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">API Token / Key</label>
                                    <input name="labsmobileApiKey" type="password" defaultValue={application.integrations?.labsmobileApiKey || ""} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Your API Key" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">API User / Email</label>
                                    <input name="labsmobileUser" type="email" defaultValue={application.integrations?.labsmobileUser || ""} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="user@example.com" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Sender ID</label>
                                    <input name="labsmobileSenderId" type="text" defaultValue={application.integrations?.labsmobileSenderId || ""} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ACME" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">API URL</label>
                                    <input name="labsmobileUrl" type="url" defaultValue={application.integrations?.labsmobileUrl || "https://api.labsmobile.com/json/send"} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://api.labsmobile.com/json/send" />
                                </div>
                            </div>
                        </div>
                    </div >
                </div >

                <div className="pt-6 border-t flex items-center justify-between">
                    <button
                        type="button"
                        disabled={isPending || isDeleting}
                        onClick={handleDelete}
                        className="flex items-center px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                        {isDeleting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Delete Application
                    </button>

                    <button
                        type="submit"
                        disabled={isPending || isDeleting}
                        className="flex items-center justify-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md active:scale-[0.98]"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Saving Changes...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Update Application
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Modal Overlay Components */}
            <AnimatePresence>
                {/* Confirmation Modal */}
                {showRegenerateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowRegenerateModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 overflow-hidden"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Regenerate Client Secret?</h3>
                                    <p className="text-sm text-slate-500">This action cannot be undone.</p>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 mb-8 leading-relaxed">
                                Regenerating the client secret will immediately invalidate the existing one. All applications using the current secret will lose access until they are updated with the new one.
                            </p>

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowRegenerateModal(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRegenerateSecret}
                                    disabled={isRegenerating}
                                    className="px-6 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all flex items-center shadow-lg shadow-red-500/20"
                                >
                                    {isRegenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Regenerating...
                                        </>
                                    ) : "Yes, Regenerate Secret"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Success Modal - Showing the new secret */}
                {showSuccessModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSuccessModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-8"
                        >
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="text-center mb-8">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">New Client Secret Generated</h3>
                                <p className="text-sm text-slate-500 mt-2">
                                    Please copy this secret and store it in a secure location.
                                </p>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3 mb-6 relative group">
                                <code className="flex-1 font-mono text-sm text-slate-800 break-all select-all">
                                    {newlyGeneratedSecret}
                                </code>
                                <button
                                    onClick={() => {
                                        if (newlyGeneratedSecret) {
                                            copyToClipboard(newlyGeneratedSecret, 'new-secret');
                                            toast.success("Secret copied to clipboard");
                                        }
                                    }}
                                    className="p-2 text-slate-400 hover:text-blue-600 rounded-lg bg-white border border-slate-200 shadow-sm transition-all"
                                    title="Copy to clipboard"
                                >
                                    {copied === 'new-secret' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>

                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-8">
                                <p className="text-sm text-amber-800 flex items-start gap-2 leading-relaxed">
                                    <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <span>
                                        <strong>Important:</strong> For security reasons, this secret will not be displayed again. If you lose it, you will have to regenerate a new one.
                                    </span>
                                </p>
                            </div>

                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-slate-900/20"
                            >
                                I've stored it safely
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateApplication, deleteApplication } from "./actions";
import { Loader2, Save, Mail, Smartphone, Globe, Lock, Trash2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Tenant {
    id: string;
    name: string;
}

interface Application {
    id: string;
    name: string;
    tenantId: string;
    corsOrigins: string[];
    redirectUris: string[];
    postLogoutRedirectUris: string[];
    authMethods: any;
    brevoApiKey?: string;
    brevoSenderEmail?: string;
    brevoSenderName?: string;
    labsmobileApiKey?: string;
    labsmobileUser?: string;
    labsmobileUrl?: string;
    labsmobileSenderId?: string;
}

export function EditApplicationForm({ application, tenants }: { application: any; tenants: Tenant[] }) {
    const [isPending, startTransition] = useTransition();
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'auth' | 'providers'>('general');
    const router = useRouter();

    // State for dynamic lists
    const [corsOrigins, setCorsOrigins] = useState<string[]>(application.corsOrigins.length > 0 ? application.corsOrigins : ['']);
    const [redirectUris, setRedirectUris] = useState<string[]>(application.redirectUris.length > 0 ? application.redirectUris : ['']);
    const [postLogoutRedirectUris, setPostLogoutRedirectUris] = useState<string[]>(
        application.postLogoutRedirectUris && application.postLogoutRedirectUris.length > 0
            ? application.postLogoutRedirectUris
            : ['']
    );

    const authMethods = typeof application.authMethods === 'string'
        ? JSON.parse(application.authMethods)
        : (application.authMethods || { password: true, otp: false, wallet: false });

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
        { id: 'auth', name: 'Authentication', icon: Lock },
        { id: 'providers', name: 'Providers', icon: Mail },
    ];

    return (
        <form action={handleSubmit} className="space-y-8">
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
                                    <div key={`cors-${index}`} className="flex items-center gap-2">
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
                            <p className="text-[10px] text-slate-400">Allowed origins for CORS requests. Use * for wildcards (not recommended for production).</p>
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
                                    <div key={`redirect-${index}`} className="flex items-center gap-2">
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
                            <p className="text-[10px] text-slate-400">Allowed callback URLs for OAuth/OIDC flows.</p>
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
                                    <div key={`logout-${index}`} className="flex items-center gap-2">
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
                            <p className="text-[10px] text-slate-400">Allowed redirect URLs after successful logout.</p>
                        </div>
                    </div>
                </div>

                <div className={cn("space-y-6 animate-in fade-in slide-in-from-left-2 duration-300", activeTab === 'auth' ? "block" : "hidden")}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <label className="flex items-center p-4 border rounded-xl hover:bg-slate-50 cursor-pointer transition-all shadow-sm group">
                            <input type="checkbox" name="auth_password" defaultChecked={authMethods.password} className="w-4 h-4 text-blue-600 rounded border-slate-300 mr-4 focus:ring-blue-500" />
                            <div>
                                <span className="text-sm font-bold text-slate-700 block">Password</span>
                                <span className="text-[10px] text-slate-400">Standard credentials</span>
                            </div>
                        </label>
                        <label className="flex items-center p-4 border rounded-xl hover:bg-slate-50 cursor-pointer transition-all shadow-sm group">
                            <input type="checkbox" name="auth_otp" defaultChecked={authMethods.otp} className="w-4 h-4 text-blue-600 rounded border-slate-300 mr-4 focus:ring-blue-500" />
                            <div>
                                <span className="text-sm font-bold text-slate-700 block">OTP</span>
                                <span className="text-[10px] text-slate-400">Email or SMS verification</span>
                            </div>
                        </label>
                        <label className="flex items-center p-4 border rounded-xl hover:bg-slate-50 cursor-pointer transition-all shadow-sm group">
                            <input type="checkbox" name="auth_wallet" defaultChecked={authMethods.wallet} className="w-4 h-4 text-blue-600 rounded border-slate-300 mr-4 focus:ring-blue-500" />
                            <div>
                                <span className="text-sm font-bold text-slate-700 block">Stellar Wallet</span>
                                <span className="text-[10px] text-slate-400">Stellar wallet signing</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div className={cn("space-y-6 animate-in fade-in slide-in-from-left-2 duration-300", activeTab === 'providers' ? "block" : "hidden")}>
                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-blue-500" />
                            Brevo (Email / OTP)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">API Key</label>
                                <input name="brevoApiKey" type="password" defaultValue={application.brevoApiKey || ""} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="xkeysib-..." />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Sender Email</label>
                                <input name="brevoSenderEmail" type="email" defaultValue={application.brevoSenderEmail || ""} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="noreply@acme.com" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Sender Name</label>
                                <input name="brevoSenderName" type="text" defaultValue={application.brevoSenderName || ""} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Acme Inc." />
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
                                <input name="labsmobileApiKey" type="password" defaultValue={application.labsmobileApiKey || ""} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Your API Key" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">API User / Email</label>
                                <input name="labsmobileUser" type="email" defaultValue={application.labsmobileUser || ""} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="user@example.com" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Sender ID</label>
                                <input name="labsmobileSenderId" type="text" defaultValue={application.labsmobileSenderId || ""} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ACME" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">API URL</label>
                                <input name="labsmobileUrl" type="url" defaultValue={application.labsmobileUrl || "https://api.labsmobile.com/json/send"} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://api.labsmobile.com/json/send" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
    );
}

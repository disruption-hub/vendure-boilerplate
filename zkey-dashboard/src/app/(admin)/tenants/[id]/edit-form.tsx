"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTenant, deleteTenant } from "./actions";
import { Loader2, Save, Mail, Smartphone, Globe, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Tenant {
    id: string;
    name: string;
    slug: string;
    integrations?: {
        brevoApiKey?: string;
        brevoSenderEmail?: string;
        brevoSenderName?: string;
        labsmobileApiKey?: string;
        labsmobileUser?: string;
        labsmobileUrl?: string;
        labsmobileSenderId?: string;
    };
    sessionSettings?: {
        ssoEnabled?: boolean;
        sessionTtl?: number;
    };
}

export function EditTenantForm({ tenant }: { tenant: any }) {
    const [isPending, startTransition] = useTransition();
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'providers' | 'settings'>('general');
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            try {
                await updateTenant(tenant.id, formData);
                toast.success("Tenant updated successfully");
                router.refresh();
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to update tenant");
            }
        });
    }

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this tenant? This will also delete all associated applications and data. This action cannot be undone.")) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteTenant(tenant.id);
            toast.success("Tenant deleted successfully");
            router.push("/tenants");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete tenant");
            setIsDeleting(false);
        }
    }

    const tabs = [
        { id: 'general', name: 'General', icon: Globe },
        { id: 'settings', name: 'ZKey SSO', icon: Save },
        { id: 'providers', name: 'Global Providers', icon: Mail },
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


            <div className={cn("space-y-6 animate-in fade-in slide-in-from-left-2 duration-300", activeTab === 'general' ? "block" : "hidden")}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-semibold text-slate-700">Organization Name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            defaultValue={tenant.name}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="slug" className="text-sm font-semibold text-slate-700">Organization Slug</label>
                        <input
                            id="slug"
                            name="slug"
                            type="text"
                            required
                            defaultValue={tenant.slug}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm font-mono"
                        />
                    </div>
                </div>
            </div>

            <div className={cn("space-y-6 animate-in fade-in slide-in-from-left-2 duration-300", activeTab === 'settings' ? "block" : "hidden")}>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6">
                    <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Single Sign-On (SSO) Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className="flex items-start p-4 bg-white border rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                            <input
                                type="checkbox"
                                name="ssoEnabled"
                                defaultChecked={tenant.sessionSettings?.ssoEnabled !== false}
                                className="w-4 h-4 mt-1 text-blue-600 rounded border-slate-300 mr-4"
                            />
                            <div>
                                <span className="text-sm font-bold text-slate-700 block">Enable SSO (Global Cookies)</span>
                                <span className="text-xs text-slate-500 mt-1 block">Allow users to stay logged in across all applications of this tenant.</span>
                            </div>
                        </label>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Global Session TTL (minutes)</label>
                            <input
                                name="sessionTtl"
                                type="number"
                                defaultValue={tenant.sessionSettings?.sessionTtl || 1440}
                                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className={cn("space-y-6 animate-in fade-in slide-in-from-left-2 duration-300", activeTab === 'providers' ? "block" : "hidden")}>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg mb-4">
                    <p className="text-xs text-amber-800 leading-relaxed">
                        <strong>Note:</strong> These settings will be used as defaults for all applications within this organization. Applications can still override them with their own specific keys.
                    </p>
                </div>

                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-blue-500" />
                        Brevo (Default Email / OTP)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">API Key</label>
                            <input name="brevoApiKey" type="password" defaultValue={tenant.integrations?.brevoApiKey || ""} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="xkeysib-..." />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Sender Email</label>
                            <input name="brevoSenderEmail" type="email" defaultValue={tenant.integrations?.brevoSenderEmail || ""} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="noreply@acme.com" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Sender Name</label>
                            <input name="brevoSenderName" type="text" defaultValue={tenant.integrations?.brevoSenderName || ""} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Acme Inc." />
                        </div>
                    </div>
                </div>

                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center">
                        <Smartphone className="w-4 h-4 mr-2 text-emerald-500" />
                        LabsMobile (Default SMS / OTP)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">API Token / Key</label>
                            <input name="labsmobileApiKey" type="password" defaultValue={tenant.integrations?.labsmobileApiKey || ""} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Your API Key" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">API User / Email</label>
                            <input name="labsmobileUser" type="email" defaultValue={tenant.integrations?.labsmobileUser || ""} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="user@example.com" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Sender ID</label>
                            <input name="labsmobileSenderId" type="text" defaultValue={tenant.integrations?.labsmobileSenderId || ""} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ACME" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">API URL</label>
                            <input name="labsmobileUrl" type="url" defaultValue={tenant.integrations?.labsmobileUrl || "https://api.labsmobile.com/json/send"} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://api.labsmobile.com/json/send" />
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
                    Delete Tenant
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
                            Update Tenant
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

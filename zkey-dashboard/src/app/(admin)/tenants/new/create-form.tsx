"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Loader2, Globe, Mail, MessageSquare } from "lucide-react";
import { createTenant } from "../[id]/actions";

export default function CreateTenantForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            try {
                const tenant = await createTenant(formData);
                toast.success("Tenant created successfully");
                router.push(`/tenants/${tenant.id}`);
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to create tenant");
            }
        });
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="border-b bg-slate-50/50 px-6 py-4 flex items-center">
                    <Globe className="w-5 h-5 text-blue-500 mr-2" />
                    <h3 className="font-semibold text-slate-900">General Information</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Display Name</label>
                        <input
                            name="name"
                            required
                            placeholder="e.g. Acme Corp"
                            className="w-full px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Slug (Unique Identifier)</label>
                        <input
                            name="slug"
                            required
                            placeholder="e.g. acme-corp"
                            className="w-full px-4 py-2 bg-white border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="border-b bg-slate-50/50 px-6 py-4 flex items-center">
                    <Save className="w-5 h-5 text-indigo-500 mr-2" />
                    <h3 className="font-semibold text-slate-900">ZKey SSO Settings</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className="flex items-start p-4 bg-slate-50 border rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                            <input
                                type="checkbox"
                                name="ssoEnabled"
                                defaultChecked
                                className="w-4 h-4 mt-1 text-blue-600 rounded border-slate-300 mr-4"
                            />
                            <div>
                                <span className="text-sm font-bold text-slate-700 block">Enable SSO (Global Cookies)</span>
                                <span className="text-xs text-slate-500 mt-1 block">Allow users to stay logged in across all applications.</span>
                            </div>
                        </label>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Global Session TTL (minutes)</label>
                            <input
                                name="sessionTtl"
                                type="number"
                                defaultValue={1440}
                                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="border-b bg-slate-50/50 px-6 py-4 flex items-center">
                    <Mail className="w-5 h-5 text-blue-500 mr-2" />
                    <h3 className="font-semibold text-slate-900">Email Provider (Brevo)</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Brevo API Key</label>
                        <input
                            name="brevoApiKey"
                            type="password"
                            placeholder="xkeysib-..."
                            className="w-full px-4 py-2 bg-white border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Sender Email</label>
                            <input
                                name="brevoSenderEmail"
                                type="email"
                                placeholder="auth@yourdomain.com"
                                className="w-full px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Sender Name</label>
                            <input
                                name="brevoSenderName"
                                placeholder="ZKey Auth"
                                className="w-full px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="border-b bg-slate-50/50 px-6 py-4 flex items-center">
                    <MessageSquare className="w-5 h-5 text-blue-500 mr-2" />
                    <h3 className="font-semibold text-slate-900">SMS Provider (Mobile Labs)</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Mobile Labs API Key</label>
                        <input
                            name="labsmobileApiKey"
                            type="password"
                            placeholder="Your LabsMobile API Key"
                            className="w-full px-4 py-2 bg-white border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Sender ID</label>
                        <input
                            name="labsmobileSenderId"
                            placeholder="ZKEY"
                            className="w-full px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    disabled={isPending}
                    type="submit"
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold shadow-md active:scale-95"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5 mr-2" />
                            Create Tenant
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

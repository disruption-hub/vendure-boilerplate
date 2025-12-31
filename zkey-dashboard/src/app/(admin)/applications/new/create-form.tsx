"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Loader2, ShieldCheck, Globe, Mail, MessageSquare } from "lucide-react";
import { createApplication } from "../[id]/actions";

export default function CreateApplicationForm({ tenants }: { tenants: any[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            try {
                const application = await createApplication(formData);
                toast.success("Application created successfully");
                router.push(`/applications/${application.id}`);
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to create application");
            }
        });
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="border-b bg-slate-50/50 px-6 py-4 flex items-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 mr-2" />
                    <h3 className="font-semibold text-slate-900">General Information</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Owner Tenant</label>
                        <select
                            name="tenantId"
                            required
                            className="w-full px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                            <option value="">Select a tenant...</option>
                            {tenants.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Application Name</label>
                        <input
                            name="name"
                            required
                            placeholder="e.g. My Next.js Frontend"
                            className="w-full px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="border-b bg-slate-50/50 px-6 py-4 flex items-center">
                    <Globe className="w-5 h-5 text-blue-500 mr-2" />
                    <h3 className="font-semibold text-slate-900">Connectivity</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">CORS Origins (comma separated)</label>
                        <input
                            name="corsOrigins"
                            placeholder="http://localhost:3000, https://app.example.com"
                            className="w-full px-4 py-2 bg-white border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Redirect URIs (comma separated)</label>
                        <input
                            name="redirectUris"
                            placeholder="http://localhost:3000/callback, https://app.example.com/api/auth/callback"
                            className="w-full px-4 py-2 bg-white border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="border-b bg-slate-50/50 px-6 py-4 flex items-center">
                    <Mail className="w-5 h-5 text-blue-500 mr-2" />
                    <h3 className="font-semibold text-slate-900">Override Email Provider (Optional)</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Brevo API Key</label>
                        <input
                            name="brevoApiKey"
                            type="password"
                            placeholder="Leave empty to use tenant default"
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
                                placeholder="App Specific Auth"
                                className="w-full px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="border-b bg-slate-50/50 px-6 py-4 flex items-center">
                    <MessageSquare className="w-5 h-5 text-blue-500 mr-2" />
                    <h3 className="font-semibold text-slate-900">Override SMS Provider (Optional)</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Mobile Labs API Key</label>
                        <input
                            name="mobileLabsApiKey"
                            type="password"
                            placeholder="Leave empty to use tenant default"
                            className="w-full px-4 py-2 bg-white border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Sender ID</label>
                        <input
                            name="mobileLabsSenderId"
                            placeholder="APP_SMS"
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
                            Register Application
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

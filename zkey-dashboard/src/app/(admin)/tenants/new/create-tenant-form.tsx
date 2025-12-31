"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTenant } from "./actions";
import { Loader2, Send } from "lucide-react";

export function CreateTenantForm() {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            try {
                await createTenant(formData);
                router.push("/tenants");
                router.refresh();
            } catch (error) {
                alert(error instanceof Error ? error.message : "Failed to create tenant");
            }
        });
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold text-slate-700">Organization Name</label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="e.g. Acme Corp"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                />
                <p className="text-xs text-slate-400">The display name for the tenant.</p>
            </div>

            <div className="space-y-2">
                <label htmlFor="slug" className="text-sm font-semibold text-slate-700">Tenant Slug (ID)</label>
                <input
                    id="slug"
                    name="slug"
                    type="text"
                    placeholder="e.g. acme-corp"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm font-mono"
                />
                <p className="text-xs text-slate-400">Used for URL identification (must be unique).</p>
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md active:scale-[0.98]"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4 mr-2" />
                            Create Tenant
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

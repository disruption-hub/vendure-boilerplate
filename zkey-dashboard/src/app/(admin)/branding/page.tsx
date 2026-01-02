import { getTenantsWithApplications } from "./actions";
import BrandingPageClient from "./branding-client";
import { Palette } from "lucide-react";

export default async function BrandingPage() {
    const tenants = await getTenantsWithApplications();

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8 border-slate-200">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-200 ring-4 ring-blue-50">
                            <Palette className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Login Branding</h1>
                    </div>
                    <p className="text-slate-500 text-lg">Customize the look and feel of the authentication experience for your tenants and applications.</p>
                </div>
            </div>

            <BrandingPageClient tenants={tenants} />
        </div>
    );
}

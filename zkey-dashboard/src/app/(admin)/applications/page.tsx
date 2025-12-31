import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
    Plus,
    Search,
    ShieldCheck,
    Globe,
    Building,
    Key,
    Settings
} from "lucide-react";

export default async function ApplicationsPage() {
    const applications = await prisma.application.findMany({
        include: {
            tenant: true
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
                    <p className="text-slate-500 mt-1">Manage OIDC clients and microservice integrations.</p>
                </div>
                <Link
                    href="/applications/new"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Application
                </Link>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-slate-50/50 flex items-center">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search applications..."
                            className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b bg-slate-50/30">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Application</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Origins</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider sr-only">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {applications.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <ShieldCheck className="w-12 h-12 text-slate-200 mb-3" />
                                            <p className="text-slate-500 font-medium">No applications found</p>
                                            <p className="text-xs text-slate-400 mt-1">Register your first microservice to start using SSO.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                applications.map((app) => (
                                    <tr key={app.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold mr-3">
                                                    <ShieldCheck className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-900 block">{app.name}</span>
                                                    <span className="text-xs text-slate-500">ID: {app.id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-slate-600">
                                                <Building className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                                {app.tenant.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">
                                                <Key className="w-3 h-3 mr-1.5" />
                                                {app.clientId}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {app.corsOrigins.slice(0, 2).map((origin) => (
                                                    <div key={origin} className="flex items-center text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                                        <Globe className="w-2.5 h-2.5 mr-1" />
                                                        {origin}
                                                    </div>
                                                ))}
                                                {app.corsOrigins.length > 2 && (
                                                    <span className="text-[10px] text-slate-400">+{app.corsOrigins.length - 2} more</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/applications/${app.id}`}
                                                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all"
                                            >
                                                <Settings className="w-3.5 h-3.5 mr-1.5" />
                                                Configure
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
    Plus,
    Search,
    MoreHorizontal,
    Layers,
    Calendar,
    Users as UsersIcon,
    ShieldCheck,
    Settings
} from "lucide-react";

export default async function TenantsPage() {
    const tenants = await prisma.tenant.findMany({
        include: {
            _count: {
                select: {
                    users: true,
                    applications: true,
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
                    <p className="text-slate-500 mt-1">Manage organizations and their isolated data environments.</p>
                </div>
                <Link
                    href="/tenants/new"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tenant
                </Link>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-slate-50/50 flex items-center">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search tenants..."
                            className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b bg-slate-50/30">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Slug</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Users</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Apps</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider sr-only">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {tenants.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <Layers className="w-12 h-12 text-slate-200 mb-3" />
                                            <p className="text-slate-500 font-medium">No tenants found</p>
                                            <p className="text-xs text-slate-400 mt-1">Get started by creating your first organization.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                tenants.map((tenant) => (
                                    <tr key={tenant.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                                                    {tenant.name.charAt(0)}
                                                </div>
                                                <span className="font-medium text-slate-900">{tenant.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">{tenant.slug}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                                                <UsersIcon className="w-3 h-3 mr-1" />
                                                {tenant._count.users}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                                <ShieldCheck className="w-3 h-3 mr-1" />
                                                {tenant._count.applications}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-slate-500">
                                                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                                {new Date(tenant.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/tenants/${tenant.id}`}
                                                className="p-2 inline-block hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                                            >
                                                <MoreHorizontal className="w-5 h-5 text-slate-400 hover:text-slate-600" />
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

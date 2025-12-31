import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
    Plus,
    Search,
    MoreHorizontal,
    Users as UsersIcon,
    Mail,
    Building,
    CheckCircle2,
    XCircle
} from "lucide-react";

export default async function UsersPage() {
    const users = await prisma.user.findMany({
        include: {
            tenant: true
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-slate-500 mt-1">Manage users across all tenants and monitor their status.</p>
                </div>
                <Link
                    href="/users/new"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                </Link>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-slate-50/50 flex items-center">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b bg-slate-50/30">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider sr-only">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <UsersIcon className="w-12 h-12 text-slate-200 mb-3" />
                                            <p className="text-slate-500 font-medium">No users found</p>
                                            <p className="text-xs text-slate-400 mt-1">Start building your global user directory.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold mr-3 border overflow-hidden">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={`${user.firstName || ""} ${user.lastName || ""}`} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{((user.firstName || user.primaryEmail || "?").charAt(0)).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-900 block">
                                                        {user.firstName ? `${user.firstName} ${user.lastName || ""}` : "Unnamed User"}
                                                    </span>
                                                    <span className="text-xs text-slate-500 flex items-center">
                                                        <Mail className="w-3 h-3 mr-1" />
                                                        {user.primaryEmail}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.tenant ? (
                                                <div className="flex items-center text-sm text-slate-600">
                                                    <Building className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                                    {user.tenant.name}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Global Admin</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-600">
                                                {user.phoneNumber || <span className="text-xs text-slate-400 italic">No phone</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${user.emailVerified
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                : "bg-amber-50 text-amber-700 border border-amber-100"
                                                }`}>
                                                {user.emailVerified ? (
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                ) : (
                                                    <XCircle className="w-3 h-3 mr-1" />
                                                )}
                                                {user.emailVerified ? "Verified" : "Pending"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500" suppressHydrationWarning>
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all">
                                                <MoreHorizontal className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                                            </button>
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

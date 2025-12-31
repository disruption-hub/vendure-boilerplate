import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Layers, ShieldCheck } from "lucide-react";
import { EditTenantForm } from "./edit-form";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function TenantPage({ params }: Props) {
    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    users: true,
                    applications: true
                }
            }
        }
    });

    if (!tenant) {
        notFound();
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/tenants"
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors border shadow-sm bg-white"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-500" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">Organization</span>
                        </div>
                        <p className="text-slate-500 mt-1">Manage tenant settings and organization-wide protocols.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <div className="p-6 border-b bg-slate-50/50">
                            <h2 className="text-lg font-semibold flex items-center">
                                <Layers className="w-5 h-5 mr-2 text-blue-600" />
                                Organization Details
                            </h2>
                        </div>
                        <div className="p-6">
                            <EditTenantForm tenant={tenant as any} />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl border shadow-sm p-6">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Statistics</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-lg border">
                                <div className="text-xs font-medium text-slate-400 mb-1">Total Users</div>
                                <div className="text-2xl font-bold text-slate-900">{tenant._count.users}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg border">
                                <div className="text-xs font-medium text-slate-400 mb-1">Applications</div>
                                <div className="text-2xl font-bold text-slate-900">{tenant._count.applications}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6">
                        <h3 className="text-sm font-semibold text-emerald-800 flex items-center mb-2">
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Security Status
                        </h3>
                        <p className="text-xs text-emerald-700 leading-relaxed">
                            This tenant is currently operating under standard security protocols. Organization-wide provider keys will be inherited by all associated applications.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

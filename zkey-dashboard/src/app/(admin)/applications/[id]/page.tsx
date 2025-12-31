import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { EditApplicationForm } from "./edit-form";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ApplicationPage({ params }: Props) {
    const { id } = await params;

    const [application, tenants] = await Promise.all([
        prisma.application.findUnique({
            where: { id },
            include: { tenant: true }
        }),
        prisma.tenant.findMany({ select: { id: true, name: true } })
    ]);

    if (!application) {
        notFound();
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/applications"
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors border shadow-sm bg-white"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-500" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">{application.name}</h1>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">Active</span>
                        </div>
                        <p className="text-slate-500 mt-1">Manage application settings and security protocols.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <div className="p-6 border-b bg-slate-50/50">
                            <h2 className="text-lg font-semibold flex items-center">
                                <ShieldCheck className="w-5 h-5 mr-2 text-blue-600" />
                                Application Details
                            </h2>
                        </div>
                        <div className="p-6">
                            <EditApplicationForm application={application} tenants={tenants} />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl border shadow-sm p-6">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Credentials</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-slate-400 block mb-1">Client ID</label>
                                <div className="p-3 bg-slate-50 border rounded-lg font-mono text-xs break-all">
                                    {application.clientId}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-400 block mb-1">Client Secret</label>
                                <div className="p-3 bg-slate-50 border rounded-lg font-mono text-xs break-all blur-[2px] hover:blur-none transition-all cursor-pointer">
                                    {application.clientSecret || "No secret configured"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

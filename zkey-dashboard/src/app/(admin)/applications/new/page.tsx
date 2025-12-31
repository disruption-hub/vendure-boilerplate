import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight, Home, ShieldCheck, Plus } from "lucide-react";
import CreateApplicationForm from "./create-form";

export default async function NewApplicationPage() {
    const tenants = await prisma.tenant.findMany({
        orderBy: { name: 'asc' }
    });

    return (
        <div className="space-y-6">
            <nav className="flex items-center text-sm text-slate-500 mb-6">
                <Link href="/" className="hover:text-blue-600 transition-colors flex items-center">
                    <Home className="w-4 h-4 mr-1" />
                    Dashboard
                </Link>
                <ChevronRight className="w-4 h-4 mx-2 text-slate-300" />
                <Link href="/applications" className="hover:text-blue-600 transition-colors flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-1" />
                    Applications
                </Link>
                <ChevronRight className="w-4 h-4 mx-2 text-slate-300" />
                <span className="text-slate-900 font-medium flex items-center">
                    <Plus className="w-4 h-4 mr-1" />
                    New Application
                </span>
            </nav>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Register New Application</h1>
                    <p className="text-slate-500 mt-1">Create an OIDC client for your microservice.</p>
                </div>
            </div>

            <CreateApplicationForm tenants={tenants} />
        </div>
    );
}

"use server";

import Link from "next/link";
import { ChevronRight, Home, Layers, Plus } from "lucide-react";
import CreateTenantForm from "./create-form";

export default async function NewTenantPage() {
    return (
        <div className="space-y-6">
            <nav className="flex items-center text-sm text-slate-500 mb-6">
                <Link href="/" className="hover:text-blue-600 transition-colors flex items-center">
                    <Home className="w-4 h-4 mr-1" />
                    Dashboard
                </Link>
                <ChevronRight className="w-4 h-4 mx-2 text-slate-300" />
                <Link href="/tenants" className="hover:text-blue-600 transition-colors flex items-center">
                    <Layers className="w-4 h-4 mr-1" />
                    Tenants
                </Link>
                <ChevronRight className="w-4 h-4 mx-2 text-slate-300" />
                <span className="text-slate-900 font-medium flex items-center">
                    <Plus className="w-4 h-4 mr-1" />
                    New Tenant
                </span>
            </nav>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Add New Tenant</h1>
                    <p className="text-slate-500 mt-1">Create a new organizational environment.</p>
                </div>
            </div>

            <CreateTenantForm />
        </div>
    );
}

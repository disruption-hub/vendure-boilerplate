"use client";

import { useState } from "react";
import { Layers, ShieldCheck, ChevronRight, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import BrandingEditor from "./branding-editor";

export default function BrandingPageClient({ tenants }: { tenants: any[] }) {
    const [selectedId, setSelectedId] = useState<{ type: 'tenant' | 'application', id: string } | null>(null);
    const [selectedObject, setSelectedObject] = useState<any>(null);

    const handleSelect = (type: 'tenant' | 'application', obj: any) => {
        setSelectedId({ type, id: obj.id });
        setSelectedObject(obj);
    };

    if (selectedId && selectedObject) {
        return (
            <div className="animate-in slide-in-from-right-4 duration-500">
                <button
                    onClick={() => setSelectedId(null)}
                    className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 mb-6 group transition-colors"
                >
                    <ChevronRight className="w-4 h-4 mr-1 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    Back to Selection
                </button>
                <BrandingEditor
                    type={selectedId.type}
                    id={selectedId.id}
                    initialBranding={selectedObject.branding || {}}
                    name={selectedObject.name}
                />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map(tenant => (
                <div key={tenant.id} className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <Layers className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{tenant.name}</span>
                    </div>

                    <div className="space-y-3">
                        {/* Tenant Level Branding */}
                        <button
                            onClick={() => handleSelect('tenant', tenant)}
                            className="w-full text-left group"
                        >
                            <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all group-active:scale-95">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                        <Palette className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    </div>
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">Organization</span>
                                </div>
                                <h3 className="font-bold text-slate-900 mb-1">Global Branding</h3>
                                <p className="text-sm text-slate-500 line-clamp-2">Default branding for all applications under {tenant.name}.</p>
                            </div>
                        </button>

                        {/* Application Level Branding */}
                        {tenant.applications.map((app: any) => (
                            <button
                                key={app.id}
                                onClick={() => handleSelect('application', app)}
                                className="w-full text-left group"
                            >
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all group-active:scale-95">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-emerald-50 transition-colors">
                                            <ShieldCheck className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                                        </div>
                                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">Application</span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 mb-1">{app.name}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-1">Custom override for this app.</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

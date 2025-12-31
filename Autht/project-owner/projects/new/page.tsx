"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Building2, Save, ArrowLeft, Loader2, Upload } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

type ProjectForm = {
    name: string;
    slug: string;
    description: string;
    tokenSymbol: string;
    hardCap: number;
    minTicket: number;
    irr: number;
    maturityMonths: number;
};

export default function NewProjectPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm<ProjectForm>();

    const onSubmit = async (data: ProjectForm) => {
        setIsLoading(true);
        const token = localStorage.getItem('project_owner_token');

        try {
            const res = await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...data,
                    hardCap: Number(data.hardCap),
                    minTicket: Number(data.minTicket),
                    irr: Number(data.irr),
                    maturityMonths: Number(data.maturityMonths)
                }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Failed to create project');

            toast.success('Project created successfully!');
            router.push('/project-owner/dashboard');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex items-center gap-4">
                <Link href="/project-owner/dashboard">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">New Infrastructure Project</h1>
                    <p className="text-slate-400">Create a new tokenized asset offering.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Details */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-purple-500" />
                        Project Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Project Name</label>
                            <input
                                {...register('name', { required: 'Project name is required' })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                placeholder="e.g. Solar Farm Alpha"
                            />
                            {errors.name && <span className="text-xs text-red-400">{errors.name.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Project Slug (URL)</label>
                            <input
                                {...register('slug', { required: 'Slug is required', pattern: { value: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers and hyphens only' } })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                placeholder="e.g. solar-farm-alpha"
                            />
                            {errors.slug && <span className="text-xs text-red-400">{errors.slug.message}</span>}
                        </div>

                        <div className="col-span-full space-y-2">
                            <label className="text-sm font-medium text-slate-300">Description</label>
                            <textarea
                                {...register('description', { required: 'Description is required' })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none min-h-[120px]"
                                placeholder="Describe the infrastructure project, location, and value proposition."
                            />
                            {errors.description && <span className="text-xs text-red-400">{errors.description.message}</span>}
                        </div>
                    </div>
                </div>

                {/* Financials */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border-2 border-green-500 flex items-center justify-center text-[10px] font-bold text-green-500">$</div>
                        Financial Parameters
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Hard Cap (USD)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                <input
                                    type="number"
                                    {...register('hardCap', { required: true, min: 1000 })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                    placeholder="1000000"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Token Symbol</label>
                            <input
                                {...register('tokenSymbol', { required: true, maxLength: 5 })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none uppercase"
                                placeholder="e.g. SOLA"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Minimum Ticket (USD)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                <input
                                    type="number"
                                    {...register('minTicket', { required: true, min: 10 })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                    defaultValue={100}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Target IRR (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    {...register('irr', { required: true })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                    placeholder="12.5"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Maturity (Months)</label>
                            <input
                                type="number"
                                {...register('maturityMonths', { required: true })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                placeholder="24"
                            />
                        </div>
                    </div>
                </div>

                {/* Media Placeholder */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 space-y-6 opacity-50 pointer-events-none">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Upload className="w-5 h-5 text-blue-500" />
                        Media & Documents (Coming Soon)
                    </h2>
                    <div className="h-32 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-slate-500 text-sm">
                        File upload will be available after initial creation.
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link href="/project-owner/dashboard">
                        <Button type="button" variant="ghost" className="text-slate-400 hover:text-white">
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 h-12"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                        Create Project
                    </Button>
                </div>
            </form>
        </div>
    );
}

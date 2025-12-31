"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, MapPin, FileText, Lock, Search } from 'lucide-react';

const projects = [
    {
        id: 'turboducto',
        title: "Turboducto AIJCH",
        location: "Callao, Peru",
        type: "Energy Infrastructure",
        irr: "14.5%",
        status: "funding" as const,
        image: "/project-hero.png",
        fundingProgress: 42
    },
    {
        id: 'solar-arequipa',
        title: "Solar Park Arequipa",
        location: "Arequipa, Peru",
        type: "Renewable Energy",
        irr: "12.8%",
        status: "upcoming" as const,
        image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=3264&auto=format&fit=crop",
        fundingProgress: 0
    },
    {
        id: 'logistics-hub',
        title: "Logistics Hub T2",
        location: "Lurín, Peru",
        type: "Industrial Real Estate",
        irr: "13.2%",
        status: "upcoming" as const,
        image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=3270&auto=format&fit=crop",
        fundingProgress: 0
    }
];

export default function MarketplacePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');

    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || project.status === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Live Offerings</h1>
                <p className="text-slate-400 max-w-2xl mx-auto">
                    Curated infrastructure opportunities compliant with the Bermuda Digital Asset Business Act.
                </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-center">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-brand-gold/50"
                    />
                </div>
                <div className="flex gap-2 justify-center">
                    {['all', 'funding', 'upcoming'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                                    ? 'bg-brand-gold text-brand-blue'
                                    : 'bg-slate-800/50 text-slate-400 hover:text-white'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Projects Grid - Same style as homepage */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map((project, index) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative rounded-2xl overflow-hidden bg-slate-900/50 border border-white/10 hover:border-brand-gold/30 transition-all duration-300"
                    >
                        <div className="aspect-[16/9] relative overflow-hidden">
                            <div className={`absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${project.status === 'funding' ? 'bg-green-500 text-white' : 'bg-slate-600 text-white'
                                }`}>
                                {project.status}
                            </div>
                            <img
                                src={project.image}
                                alt={project.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-80" />
                        </div>

                        <div className="p-6 relative">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-brand-gold uppercase tracking-widest mb-1">
                                        <MapPin className="w-3 h-3" /> {project.location}
                                    </div>
                                    <h4 className="text-xl font-bold text-white group-hover:text-brand-gold transition-colors">
                                        {project.title}
                                    </h4>
                                </div>
                                <Link
                                    href={project.status === 'funding' ? `/investor-portal/marketplace/${project.id}` : '#'}
                                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <ArrowUpRight className="w-5 h-5 text-white" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Asset Type</p>
                                    <p className="text-sm font-bold text-white">{project.type}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Target IRR</p>
                                    <p className="text-sm font-bold text-green-400">{project.irr}</p>
                                </div>
                            </div>

                            {project.fundingProgress > 0 && (
                                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-6">
                                    <div className="h-full bg-brand-gold" style={{ width: `${project.fundingProgress}%` }} />
                                </div>
                            )}

                            <div className="mt-4">
                                {project.status === 'funding' ? (
                                    <Link href={`/investor-portal/marketplace/${project.id}`} className="block w-full">
                                        <button className="w-full py-3 rounded-xl bg-brand-gold hover:bg-brand-gold/90 text-brand-blue text-sm font-bold transition-all flex items-center justify-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            View Project Details
                                        </button>
                                    </Link>
                                ) : (
                                    <button disabled className="w-full py-3 rounded-xl bg-white/5 text-slate-400 text-sm font-bold flex items-center justify-center gap-2 border border-white/5 cursor-not-allowed opacity-50">
                                        <Lock className="w-4 h-4" />
                                        Coming Soon
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredProjects.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-slate-400">No projects found matching your criteria.</p>
                </div>
            )}
        </div>
    );
}

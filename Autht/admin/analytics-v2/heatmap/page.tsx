"use client";

import { useState, useEffect } from 'react';
import { Flame, ArrowLeft, MousePointer2, AlertCircle, Loader2, Activity, Eye, Calendar, TrendingUp, Users, Smartphone, Monitor, Tablet } from 'lucide-react';
import Link from 'next/link';
import { HeatmapSnapshot } from '@infrabricks/analytics-dashboard/components/HeatmapSnapshot';

interface PageOption {
    path: string;
    interactionCount: number;
}

interface HeatmapStats {
    totalInteractions: number;
    uniqueVisitors: number;
    avgScrollDepth: number;
}

type InteractionFilter = 'all' | 'click' | 'scroll';
type DatePreset = '7d' | '30d' | '90d';
type DeviceType = 'all' | 'desktop' | 'mobile' | 'tablet';

export default function HeatmapPage() {
    const [pages, setPages] = useState<PageOption[]>([]);
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(false);
    const [filter, setFilter] = useState<InteractionFilter>('all');
    const [datePreset, setDatePreset] = useState<DatePreset>('30d');
    const [deviceType, setDeviceType] = useState<DeviceType>('all');
    const [stats, setStats] = useState<HeatmapStats | null>(null);
    const [config] = useState({
        apiKey: localStorage.getItem('ib_v2_api_key') || 'ib_1766976243766_u9dfl',
        adminSecret: localStorage.getItem('ib_v2_api_secret') || '661prgjevle',
        endpoint: 'https://dishubanalitics-production.up.railway.app/api/v1',
        siteUrl: 'https://infrabricks.lat'
    });

    const getDateRange = (preset: DatePreset) => {
        const end = new Date();
        const start = new Date();
        switch (preset) {
            case '7d':
                start.setDate(start.getDate() - 7);
                break;
            case '30d':
                start.setDate(start.getDate() - 30);
                break;
            case '90d':
                start.setDate(start.getDate() - 90);
                break;
        }
        return { start: start.toISOString(), end: end.toISOString() };
    };

    useEffect(() => {
        const fetchPages = async () => {
            setLoading(true);
            try {
                const { start, end } = getDateRange(datePreset);
                const response = await fetch(`${config.endpoint}/heatmap/pages?startDate=${start}&endDate=${end}&deviceType=${deviceType}`, {
                    headers: {
                        'x-tenant-key': config.apiKey,
                        'x-tenant-secret': config.adminSecret
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setPages(data);
                    if (data.length > 0 && !selectedPath) {
                        setSelectedPath(data[0].path);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch heatmap pages:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPages();
    }, [datePreset, deviceType]);

    useEffect(() => {
        if (!selectedPath) return;

        const fetchStats = async () => {
            setStatsLoading(true);
            try {
                const { start, end } = getDateRange(datePreset);
                const response = await fetch(`${config.endpoint}/heatmap/stats?path=${encodeURIComponent(selectedPath)}&startDate=${start}&endDate=${end}&deviceType=${deviceType}`, {
                    headers: {
                        'x-tenant-key': config.apiKey,
                        'x-tenant-secret': config.adminSecret
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch heatmap stats:', error);
            } finally {
                setStatsLoading(false);
            }
        };

        fetchStats();
    }, [selectedPath, datePreset, deviceType]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/analytics-v2">
                        <button className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Flame className="w-8 h-8 text-red-500" />
                            User Heatmaps
                        </h1>
                        <p className="text-slate-500 mt-1">Visualize high-engagement zones and interaction patterns.</p>
                    </div>
                </div>

                {/* Date Range Selector */}
                <div className="flex items-center gap-2 bg-slate-900 border border-white/5 p-1 rounded-xl">
                    <Calendar className="w-4 h-4 text-slate-500 ml-2" />
                    {(['7d', '30d', '90d'] as DatePreset[]).map((preset) => (
                        <button
                            key={preset}
                            onClick={() => setDatePreset(preset)}
                            className={`
                                px-4 py-2 rounded-lg text-xs font-bold transition-all
                                ${datePreset === preset
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }
                            `}
                        >
                            {preset === '7d' && 'Last 7 Days'}
                            {preset === '30d' && 'Last 30 Days'}
                            {preset === '90d' && 'Last 90 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Device Type Filter */}
            <div className="flex items-center gap-3 bg-slate-900 border border-white/5 p-4 rounded-2xl">
                <span className="text-white font-medium text-sm">Device:</span>
                {[
                    { value: 'all', label: 'All Devices', icon: Monitor },
                    { value: 'desktop', label: 'Desktop', icon: Monitor },
                    { value: 'mobile', label: 'Mobile', icon: Smartphone },
                    { value: 'tablet', label: 'Tablet', icon: Tablet }
                ].map(({ value, label, icon: Icon }) => (
                    <button
                        key={value}
                        onClick={() => setDeviceType(value as DeviceType)}
                        className={`
                            px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2
                            ${deviceType === value
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                            }
                        `}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                </div>
            ) : pages.length === 0 ? (
                <div className="bg-slate-900 border border-white/5 rounded-3xl p-12 text-center">
                    <div className="w-20 h-20 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">No Interaction Data Yet</h2>
                    <p className="text-slate-400 max-w-lg mx-auto mb-8">
                        The heatmap engine is tracking multiple interaction types across your site.
                        Visit your pages and the system will automatically capture:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                        <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4 text-left">
                            <MousePointer2 className="w-5 h-5 text-blue-400 mb-2" />
                            <h4 className="text-white font-bold text-sm mb-1">Click Events</h4>
                            <p className="text-xs text-slate-500">Every user tap and click with coordinates</p>
                        </div>
                        <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4 text-left">
                            <Activity className="w-5 h-5 text-green-400 mb-2" />
                            <h4 className="text-white font-bold text-sm mb-1">Scroll Depth</h4>
                            <p className="text-xs text-slate-500">How far users scroll on each page</p>
                        </div>
                        <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4 text-left">
                            <Eye className="w-5 h-5 text-purple-400 mb-2" />
                            <h4 className="text-white font-bold text-sm mb-1">Engagement Zones</h4>
                            <p className="text-xs text-slate-500">High-activity areas and hotspots</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 justify-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-slate-400">Multi-interaction tracking is active and running</span>
                    </div>
                </div>
            ) : (
                <>
                    {/* Quick Stats Bar */}
                    {stats && selectedPath && (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">Total Interactions</p>
                                        <p className="text-2xl font-bold text-white">{statsLoading ? '...' : stats.totalInteractions.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                                        <Users className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">Unique Visitors</p>
                                        <p className="text-2xl font-bold text-white">{statsLoading ? '...' : stats.uniqueVisitors.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                        <Activity className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">Avg. Scroll Depth</p>
                                        <p className="text-2xl font-bold text-white">{statsLoading ? '...' : `${stats.avgScrollDepth}%`}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Interaction Type Filter */}
                    <div className="flex items-center gap-3">
                        <span className="text-white font-medium text-sm">Interaction type:</span>
                        {[
                            { value: 'all', label: 'All Interactions', icon: Flame },
                            { value: 'click', label: 'Clicks Only', icon: MousePointer2 },
                            { value: 'scroll', label: 'Scroll Depth', icon: Activity }
                        ].map(({ value, label, icon: Icon }) => (
                            <button
                                key={value}
                                onClick={() => setFilter(value as InteractionFilter)}
                                className={`
                                    px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2
                                    ${filter === value
                                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                    }
                                `}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Page Selector */}
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <MousePointer2 className="w-5 h-5 text-blue-400" />
                            Select a Page to Analyze
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {pages.map((page) => (
                                <button
                                    key={page.path}
                                    onClick={() => setSelectedPath(page.path)}
                                    className={`
                                        text-left p-4 rounded-xl border transition-all
                                        ${selectedPath === page.path
                                            ? 'bg-red-500/10 border-red-500/30 ring-1 ring-red-500/20'
                                            : 'bg-slate-800/50 border-white/5 hover:bg-slate-800 hover:border-white/10'
                                        }
                                    `}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-white font-mono text-sm font-medium truncate flex-1">
                                            {page.path || '/'}
                                        </span>
                                        <div className={`
                                            px-2 py-0.5 rounded-full text-xs font-bold
                                            ${selectedPath === page.path
                                                ? 'bg-red-500 text-white'
                                                : 'bg-slate-700 text-slate-300'
                                            }
                                        `}>
                                            {page.interactionCount}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {page.interactionCount} {page.interactionCount === 1 ? 'interaction' : 'interactions'}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Heatmap Snapshot Visualizer */}
                    {selectedPath && (
                        <HeatmapSnapshot
                            path={selectedPath}
                            config={config as any}
                            startDate={getDateRange(datePreset).start}
                            endDate={getDateRange(datePreset).end}
                            deviceType={deviceType}
                            filterType={filter}
                        />
                    )}
                </>
            )}
        </div>
    );
}

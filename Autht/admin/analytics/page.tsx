"use client";

import { useState, useEffect } from 'react';
import {
    BarChart3, Users, MousePointer2, Globe, Laptop, Smartphone, Tablet, ExternalLink, Loader2, Calendar, Activity,
    TrendingDown, ArrowRight, ChevronRight, ChevronDown, LogOut, ShieldCheck, Wallet, Bot, Monitor, Languages, Compass
} from 'lucide-react';
import { toast } from 'sonner';
import Pusher from 'pusher-js';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

export default function AnalyticsDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [funnel, setFunnel] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'custom'>('24h');
    const [segment, setSegment] = useState<'all' | 'front' | 'investor'>('all');
    const [trafficType, setTrafficType] = useState<'all' | 'users' | 'bots'>('users'); // Added trafficType state
    const [expandedSession, setExpandedSession] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const fetchStats = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

        if (!token) {
            console.warn('[Analytics] No admin token found, skipping fetch');
            return;
        }

        setLoading(true);
        try {
            const segmentParam = segment !== 'all' ? `&segment=${segment}` : '';
            const trafficParam = `&trafficType=${trafficType}`;
            let url = `${API_URL}/analytics/stats?`;

            if (timeframe === 'custom' && startDate && endDate) {
                url += `startDate=${startDate}&endDate=${endDate}${segmentParam}${trafficParam}`;
            } else {
                url += `timeframe=${timeframe}${segmentParam}${trafficParam}`;
            }

            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token.trim()}`,
                    'Cache-Control': 'no-cache'
                }
            });

            if (res.status === 401) {
                toast.error('Session expired. Please log in again.');
                localStorage.removeItem('admin_token');
                window.location.href = '/admin/login';
                return;
            }

            if (res.ok) {
                const data = await res.json();
                setStats(data);
            } else {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to fetch analytics stats');
            }
        } catch (err: any) {
            console.error('[Analytics] fetch error:', err);
            toast.error(err.message || 'Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const fetchFunnel = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        if (!token) return;

        try {
            const segmentParam = segment !== 'all' ? `&segment=${segment}` : '';
            const trafficParam = `&trafficType=${trafficType}`;
            let start = startDate;
            let end = endDate;

            // Default to 30 days if no custom range
            if (!start || !end) {
                const now = new Date();
                const past = new Date();
                if (timeframe === '7d') past.setDate(now.getDate() - 7);
                else if (timeframe === '30d') past.setDate(now.getDate() - 30);
                else past.setHours(now.getHours() - 24);
                start = past.toISOString().split('T')[0];
                end = now.toISOString().split('T')[0];
            }

            const res = await fetch(
                `${API_URL}/analytics/funnel?startDate=${start}&endDate=${end}${segmentParam}${trafficParam}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token.trim()}`,
                        'Cache-Control': 'no-cache'
                    }
                }
            );

            if (res.ok) {
                const data = await res.json();
                setFunnel(data);
            }
        } catch (err: any) {
            console.error('[Analytics] funnel fetch error:', err);
        }
    };


    useEffect(() => {
        fetchStats();
        fetchFunnel();

        // 30s background sync to keep "Active Now" accurate without refresh
        const syncInterval = setInterval(() => {
            fetchStats();
        }, 30000);

        return () => clearInterval(syncInterval);
    }, [timeframe, segment, startDate, endDate, trafficType]);

    // Real-time Updates via Soketi
    useEffect(() => {
        const pusher = new Pusher(process.env.NEXT_PUBLIC_SOKETI_APP_KEY || 'infrabricks_key', {
            wsHost: process.env.NEXT_PUBLIC_SOKETI_HOST || 'soketi.railway.internal',
            wsPort: Number(process.env.NEXT_PUBLIC_SOKETI_PORT) || 6001,
            forceTLS: false, // Set to true if using HTTPS/WSS publicly
            cluster: 'mt1',
            enabledTransports: ['ws', 'wss'],
        });

        const channel = pusher.subscribe('analytics');

        channel.bind('new_session', (data: any) => {
            // Only update if it matches current segment
            if (segment !== 'all' && data.segment !== segment) return;

            setStats((prev: any) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    summary: {
                        ...prev.summary,
                        sessions: (prev.summary.sessions || 0) + 1,
                        activeNow: (prev.summary.activeNow || 0) + 1,
                    }
                };
            });

            const visitorType = data.isReturning
                ? `🔄 Returning Visitor (${data.previousVisits} previous visit${data.previousVisits > 1 ? 's' : ''})`
                : '✨ New Visitor';

            toast(`${visitorType} from ${data.city || data.country || 'Unknown'}`, {
                description: `Context: ${data.segment} | Device: ${data.deviceType}`,
                icon: <Users className={`w-4 h-4 ${data.isReturning ? 'text-green-500' : 'text-blue-500'}`} />,
            });
        });

        channel.bind('page_view', (data: any) => {
            setStats((prev: any) => {
                if (!prev) return prev;

                // Increment realtimeActivity for the last minute bin
                const newActivity = [...(prev?.summary?.realtimeActivity || [])];
                const newDetails = [...(prev?.summary?.realtimeActivityDetails || [])];

                if (newActivity.length > 0) {
                    newActivity[29] = (newActivity[29] || 0) + 1;

                    // Update details for the last bin (index 29)
                    if (newDetails[29]) {
                        const existingDetail = newDetails[29].find((d: any) =>
                            d.country === (data.country || 'Unknown') &&
                            d.city === (data.city || null)
                        );

                        if (existingDetail) {
                            existingDetail.count++;
                        } else {
                            if (!newDetails[29]) newDetails[29] = [];
                            newDetails[29].push({
                                country: data.country || 'Unknown',
                                city: data.city || null,
                                count: 1
                            });
                        }
                        // Keep details sorted
                        newDetails[29].sort((a: any, b: any) => b.count - a.count);
                    }
                }

                return {
                    ...prev,
                    summary: {
                        ...prev.summary,
                        pageViews: (prev.summary.pageViews || 0) + 1,
                        realtimeActivity: newActivity,
                        realtimeActivityDetails: newDetails
                    }
                };
            });
        });

        channel.bind('custom_event', (data: any) => {
            fetchStats();
            toast(`${data.name.replace(/_/g, ' ')}`, {
                description: `Category: ${data.category}`,
                icon: <Activity className="w-4 h-4 text-brand-gold" />,
            });
        });

        // Periodic shift every minute to keep the "Live" timeline moving
        const shiftInterval = setInterval(() => {
            setStats((prev: any) => {
                if (!prev?.summary?.realtimeActivity) return prev;
                const shifted = [...prev.summary.realtimeActivity.slice(1), 0];
                return {
                    ...prev,
                    summary: {
                        ...prev.summary,
                        realtimeActivity: shifted
                    }
                };
            });
        }, 60000);

        return () => {
            pusher.unsubscribe('analytics');
            pusher.disconnect();
            clearInterval(shiftInterval);
        };
    }, [segment, trafficType]);

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                <p className="text-slate-400">
                    {loading ? 'Loading your analytics data...' : 'Failed to load analytics data. Please refresh.'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Traffic Analytics</h1>
                    <p className="text-slate-400">Measure visitor behavior and traffic sources in real-time.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    {/* Segment Selector */}
                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 backdrop-blur-sm">
                        {(['all', 'front', 'investor'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setSegment(s)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${segment === s
                                    ? 'bg-white/10 text-white shadow-lg'
                                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {s === 'all' ? 'All Pools' : s === 'front' ? 'Front Page' : 'Investor Portal'}
                            </button>
                        ))}
                    </div>

                    {/* Traffic Type Selector (Added) */}
                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 backdrop-blur-sm">
                        {(['all', 'users', 'bots'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setTrafficType(type)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${trafficType === type
                                    ? type === 'bots' ? 'bg-orange-500/20 text-orange-400 shadow-lg border border-orange-500/20' : 'bg-white/10 text-white shadow-lg'
                                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {type === 'all' ? 'All Traffic' : type === 'users' ? 'Visitors' : 'Bots'}
                            </button>
                        ))}
                    </div>

                    {/* Timeframe Selector */}
                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 backdrop-blur-sm ml-auto sm:ml-0">
                        {(['24h', '7d', '30d', 'custom'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTimeframe(t)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeframe === t
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {t === 'custom' ? 'Custom' : t.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Custom Date Range Picker */}
            {timeframe === 'custom' && (
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <div className="flex items-center gap-2">
                        <label className="text-slate-400 text-sm">From:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 hidden sm:block" />
                    <div className="flex items-center gap-2">
                        <label className="text-slate-400 text-sm">To:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    {startDate && endDate && (
                        <span className="text-xs text-blue-400 ml-auto">
                            Showing data from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                        </span>
                    )}
                </div>
            )}

            {/* Real-time Activity Monitor */}
            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-400" />
                            Page Views per Minute
                        </h2>
                        <p className="text-slate-500 text-sm">Real-time activity for the last 30 minutes</p>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-black text-white">
                            {stats?.summary?.realtimeActivity?.[29] || 0}
                        </span>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Views in last minute</p>
                    </div>
                </div>

                <div className="flex items-end gap-1.5 h-32">
                    {stats?.summary?.realtimeActivity?.map((count: number, i: number) => {
                        const max = Math.max(...(stats?.summary?.realtimeActivity || [1]), 1);
                        const height = (count / max) * 100;
                        const details = stats?.summary?.realtimeActivityDetails?.[i] || [];
                        return (
                            <div
                                key={i}
                                className={`flex-1 transition-all duration-500 rounded-t-lg relative group ${i === 29 ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-blue-500/20 hover:bg-blue-500/40'
                                    }`}
                                style={{ height: `${Math.max(height, 4)}%` }}
                            >
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-slate-800 text-white text-[10px] py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10 border border-white/10 shadow-2xl backdrop-blur-md transition-opacity min-w-[120px]">
                                    <div className="font-bold mb-1">{count} views • {29 - i}m ago</div>
                                    {details.length > 0 && (
                                        <div className="space-y-0.5 border-t border-white/10 pt-1.5 mt-1">
                                            {details.slice(0, 3).map((d: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-1.5">
                                                    <span className="text-sm">{getFlag(d.country)}</span>
                                                    <span className="text-slate-300 truncate max-w-[80px]">
                                                        {d.city || d.country}
                                                    </span>
                                                    <span className="text-slate-500 ml-auto">({d.count})</span>
                                                </div>
                                            ))}
                                            {details.length > 3 && (
                                                <div className="text-slate-500 text-[9px]">+{details.length - 3} more</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-between mt-4">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">30 minutes ago</span>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">Live</span>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard
                    label="Active Now"
                    value={stats?.summary?.activeNow || 0}
                    icon={<Users className="w-5 h-5" />}
                    color="blue"
                    showPulse
                />
                <StatCard
                    label="Units Sessions"
                    value={stats?.summary?.sessions || 0}
                    icon={<MousePointer2 className="w-5 h-5" />}
                    color="purple"
                />
                <StatCard
                    label="Unique Visitors"
                    value={stats?.summary?.uniqueVisitors || 0}
                    icon={<Users className="w-5 h-5" />}
                    color="green"
                />
                <StatCard
                    label="Page Views"
                    value={stats?.summary?.pageViews || 0}
                    icon={<BarChart3 className="w-5 h-5" />}
                    color="orange"
                />
                <StatCard
                    label="Bounce Rate"
                    value={`${stats?.summary?.bounceRate || 0}%`}
                    icon={<Calendar className="w-5 h-5" />}
                    color="red"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Pages */}
                <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <ExternalLink className="w-5 h-5 text-blue-400" />
                            Most Visited Pages
                        </h2>
                    </div>
                    <div className="space-y-4">
                        {stats?.topPages?.map((page: any, i: number) => (
                            <div key={i} className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/10">
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-slate-500 w-4">{i + 1}</span>
                                    <span className="text-slate-300 font-medium group-hover:text-blue-400 transition-colors uppercase tracking-wider text-xs">
                                        {page.path === '/' ? 'Home' : page.path.replace('/', '').replace(/-/g, ' ')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-white font-bold">{page.count}</span>
                                    <div className="w-16 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-blue-500 h-full rounded-full"
                                            style={{ width: `${(page.count / (stats.summary.pageViews || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Geo Distribution */}
                <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Globe className="w-5 h-5 text-purple-400" />
                            Top Locations
                        </h2>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Countries</p>
                            <div className="space-y-3">
                                {stats?.geo?.map((g: any, i: number) => (g.country !== 'Unknown' && i < 5 &&
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-transparent">
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg">{getFlag(g.country)}</span>
                                            <span className="text-slate-300 font-medium text-sm">{g.country}</span>
                                        </div>
                                        <span className="text-white font-bold text-sm">{g.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Cities</p>
                            <div className="grid grid-cols-2 gap-3">
                                {stats?.cities?.map((c: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                        <span className="text-slate-300 text-sm truncate">{c.city}</span>
                                        <span className="text-blue-400 font-bold text-sm">{c.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {(!stats || !stats.geo || stats.geo.length === 0) && (
                            <p className="text-center text-slate-500 py-12 italic">Waiting for more traffic data...</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Device Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                    <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-orange-400" />
                        Traffic Sources (UTM)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stats?.sources?.map((s: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-slate-300 font-medium">{s.source}</span>
                                <span className="text-white font-bold">{s.count}</span>
                            </div>
                        ))}
                        {(!stats || !stats.sources || stats.sources.length === 0) && (
                            <p className="text-slate-500 italic text-sm">No UTM parameters detected yet.</p>
                        )}
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                    <h2 className="text-xl font-bold text-white mb-8">Top Referrers</h2>
                    <div className="space-y-4">
                        {stats?.referrers?.map((r: any, i: number) => (
                            <div key={i} className="flex flex-col gap-1">
                                <span className="text-slate-400 text-xs truncate max-w-full italic">{r.url || 'Direct'}</span>
                                <div className="flex items-center justify-between">
                                    <span className="text-white font-medium text-sm">
                                        {r.url ? new URL(r.url).hostname : 'Direct Entry'}
                                    </span>
                                    <span className="text-blue-400 font-bold">{r.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                <h2 className="text-xl font-bold text-white mb-8">Recent Visitors</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 pb-4">
                                <th className="pb-4 w-10"></th>
                                <th className="pb-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center px-2">Live</th>
                                <th className="pb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Visitor / IP</th>
                                <th className="pb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Location</th>
                                <th className="pb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Source</th>
                                <th className="pb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Exit Page</th>
                                <th className="pb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Device</th>
                                <th className="pb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Views</th>
                                <th className="pb-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right pr-4">Last Activity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {stats?.recentSessions?.map((s: any) => {
                                const isRecent = (new Date().getTime() - new Date(s.lastActive).getTime()) < 300000; // 5 mins
                                const isExpanded = expandedSession === s.id;
                                return (
                                    <div key={s.id} style={{ display: 'contents' }}>
                                        <tr
                                            className={`group hover:bg-white/5 transition-colors cursor-pointer ${isExpanded ? 'bg-white/5' : ''}`}
                                            onClick={() => setExpandedSession(isExpanded ? null : s.id)}
                                        >
                                            <td className="py-4 pl-4">
                                                {isExpanded ? (
                                                    <ChevronDown className="w-4 h-4 text-blue-500" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-500 transition-colors" />
                                                )}
                                            </td>
                                            <td className="py-4 text-center px-2">
                                                {isRecent && (
                                                    <span className="relative flex h-2 w-2 mx-auto">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-bold text-sm truncate max-w-[120px]" title={s.ip}>
                                                            {s.user ? s.user.name || s.user.email : 'Anonymous'}
                                                        </span>
                                                        {s.isReturning && (
                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-wide whitespace-nowrap">
                                                                🔄 Returning{s.previousVisits > 0 && ` (${s.previousVisits})`}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-slate-500 text-[10px] font-mono">{s.ip}</span>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{getFlag(s.country || 'Unknown')}</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-white text-xs">{s.country || 'Unknown'}</span>
                                                        <span className="text-slate-500 text-[10px]">{s.city}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${s.source?.includes('organic') ? 'text-green-400 border-green-500/20 bg-green-500/10' :
                                                    s.source?.includes('social') ? 'text-blue-400 border-blue-500/20 bg-blue-500/10' :
                                                        'text-slate-400 border-slate-500/20 bg-slate-500/10'
                                                    }`}>
                                                    {s.source || 'Direct'}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <span className="text-slate-300 text-xs font-mono truncate max-w-[150px] block" title={s.exitPage}>
                                                    {s.exitPage}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                {s.device === 'bot' ? (
                                                    <div className="flex items-center gap-1.5 text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20 w-fit">
                                                        <Bot className="w-3 h-3" />
                                                        <span className="text-[10px] uppercase font-bold tracking-wider">Bot</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs px-2 py-1 bg-white/5 rounded-lg border border-white/5 uppercase font-bold tracking-tighter">
                                                        {s.device || 'Desktop'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.pageViewsCount > 1 ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                                    {s.pageViewsCount} View{s.pageViewsCount !== 1 && 's'}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right pr-4">
                                                <span className="text-slate-400 text-xs">
                                                    {new Date(s.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-white/[0.02] no-hover">
                                                <td colSpan={9} className="p-0 border-b border-white/5">
                                                    <SessionTimeline session={s} />
                                                </td>
                                            </tr>
                                        )}
                                    </div>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl mb-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white">Recent Events</h2>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/20">
                        <Activity className="w-4 h-4 text-brand-gold" />
                        <span className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">Live Feed</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 pb-4">
                                <th className="pb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Time</th>
                                <th className="pb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Event</th>
                                <th className="pb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Category</th>
                                <th className="pb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">User</th>
                                <th className="pb-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {stats?.recentEvents?.map((e: any) => {
                                let Icon = Activity;
                                let colorClass = 'text-slate-400 bg-slate-500/10';

                                if (e.category === 'auth') { Icon = ShieldCheck; colorClass = 'text-purple-400 bg-purple-500/10'; }
                                else if (e.category === 'investment') { Icon = BarChart3; colorClass = 'text-brand-gold bg-brand-gold/10'; }
                                else if (e.category === 'wallet') { Icon = Wallet; colorClass = 'text-blue-400 bg-blue-500/10'; }

                                return (
                                    <tr key={e.id} className="group hover:bg-white/5 transition-colors animate-in slide-in-from-left-2 duration-300">
                                        <td className="py-4 pl-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-sm uppercase tracking-tight">{e.name?.replace(/_/g, ' ')}</span>
                                                <span className="text-slate-500 text-[10px] font-mono mt-0.5">
                                                    {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border border-white/5 ${colorClass}`}>
                                                {e.category || 'General'}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white text-sm font-medium">{e.user?.name || 'Anonymous'}</span>
                                                {e.user?.email && <span className="text-slate-500 text-xs">{e.user.email}</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 text-right pr-4">
                                            {e.metadata && Object.keys(e.metadata).length > 0 && (
                                                <div className="flex flex-wrap justify-end gap-1.5 max-w-md ml-auto">
                                                    {Object.entries(e.metadata).slice(0, 3).map(([k, v]: [string, any]) => (
                                                        <div key={k} className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded border border-white/5">
                                                            <span className="text-[10px] text-slate-500 font-bold uppercase">{k}:</span>
                                                            <span className="text-[10px] text-slate-300 font-mono" title={typeof v === 'object' ? JSON.stringify(v) : String(v)}>
                                                                {typeof v === 'string' && v.length > 20 ? v.substring(0, 20) + '...' :
                                                                    typeof v === 'object' ? 'Object' : String(v)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {Object.keys(e.metadata).length > 3 && (
                                                        <span className="text-[10px] text-slate-500 self-center">+{Object.keys(e.metadata).length - 3} more</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {(!stats?.recentEvents || stats.recentEvents.length === 0) && (
                        <div className="text-center py-12">
                            <p className="text-slate-500 text-sm italic">No events recorded in this timeframe.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                <h2 className="text-xl font-bold text-white mb-8">Device Breakdown</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DeviceCard label="Desktop" icon={<Laptop />} count={stats?.devices?.find((d: any) => d.device?.toLowerCase() === 'desktop')?.count || 0} percentage={45} color="blue" />
                    <DeviceCard label="Mobile" icon={<Smartphone />} count={stats?.devices?.find((d: any) => d.device?.toLowerCase() === 'mobile')?.count || 0} percentage={52} color="green" />
                    <DeviceCard label="Tablet" icon={<Tablet />} count={stats?.devices?.find((d: any) => d.device?.toLowerCase() === 'tablet')?.count || 0} percentage={3} color="purple" />
                </div>
            </div>

            {/* Conversion Funnel */}
            {
                funnel && funnel.steps && (
                    <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <TrendingDown className="w-5 h-5 text-brand-gold" />
                                    Investor Conversion Funnel
                                </h2>
                                <p className="text-slate-500 text-sm">Track the journey from visitor to investor</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-brand-gold">{funnel.overallConversion}%</span>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Overall Conversion</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {funnel.steps.map((step: any, i: number) => {
                                const maxCount = funnel.steps[0].count || 1;
                                const widthPercent = Math.max((step.count / maxCount) * 100, 8);
                                const nextStep = funnel.steps[i + 1];
                                const dropoff = nextStep ? step.count - nextStep.count : 0;

                                return (
                                    <div key={step.name} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-white font-medium">{step.name}</span>
                                            <span className="text-slate-400">{step.count.toLocaleString()} users</span>
                                        </div>
                                        <div className="relative h-10 bg-slate-800/50 rounded-lg overflow-hidden">
                                            <div
                                                className={`h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3 ${i === 0 ? 'bg-blue-500' :
                                                    i === funnel.steps.length - 1 ? 'bg-green-500' :
                                                        'bg-blue-500/60'
                                                    }`}
                                                style={{ width: `${widthPercent}%` }}
                                            >
                                                {step.rate < 100 && (
                                                    <span className="text-xs font-bold text-white/80">{step.rate}%</span>
                                                )}
                                            </div>
                                        </div>
                                        {nextStep && dropoff > 0 && (
                                            <div className="flex items-center justify-center text-[10px] text-red-400 py-1">
                                                <TrendingDown className="w-3 h-3 mr-1" />
                                                {dropoff.toLocaleString()} dropped ({100 - nextStep.rate}% loss)
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
            }
        </div >
    );
}

function StatCard({ label, value, icon, color, showPulse }: { label: string; value: string | number; icon: any; color: string; showPulse?: boolean }) {
    const colors: any = {
        blue: 'text-blue-400 bg-blue-500/10',
        purple: 'text-purple-400 bg-purple-500/10',
        green: 'text-green-400 bg-green-500/10',
        orange: 'text-orange-400 bg-orange-500/10',
        red: 'text-red-400 bg-red-500/10',
    };

    return (
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl backdrop-blur-xl group hover:border-white/10 transition-all relative overflow-hidden">
            {showPulse && (
                <div className="absolute top-4 right-4 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </div>
            )}
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${colors[color]}`}>
                {icon}
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
            <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        </div>
    );
}

function DeviceCard({ label, icon, count, percentage, color }: { label: string; icon: any; count: number; percentage: number; color: string }) {
    return (
        <div className="bg-white/5 p-6 rounded-2xl flex items-center justify-between gap-6 border border-white/5">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 text-white`}>
                    {icon}
                </div>
                <div>
                    <p className="text-white font-bold">{label}</p>
                    <p className="text-slate-400 text-sm">{count} sessions</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-xl font-bold text-white">{Math.round((count / 10) * 100) || 0}%</p>
            </div>
        </div>
    );
}

const COUNTRY_FLAGS: Record<string, string> = {
    'Ascension Island': '🇦🇨', 'Andorra': '🇦🇩', 'United Arab Emirates': '🇦🇪', 'Afghanistan': '🇦🇫',
    'Antigua & Barbuda': '🇦🇬', 'Anguilla': '🇦🇮', 'Albania': '🇦🇱', 'Armenia': '🇦🇲', 'Angola': '🇦🇴',
    'Antarctica': '🇦🇶', 'Argentina': '🇦🇷', 'American Samoa': '🇦🇸', 'Austria': '🇦🇹', 'Australia': '🇦🇺',
    'Aruba': '🇦🇼', 'Åland Islands': '🇦🇽', 'Azerbaijan': '🇦🇿', 'Bosnia & Herzegovina': '🇧🇦',
    'Barbados': '🇧🇧', 'Bangladesh': '🇧🇩', 'Belgium': '🇧🇪', 'Burkina Faso': '🇧🇫', 'Bulgaria': '🇧🇬',
    'Bahrain': '🇧🇭', 'Burundi': '🇧🇮', 'Benin': '🇧🇯', 'St. Barthélemy': '🇧🇱', 'Bermuda': '🇧🇲',
    'Brunei': '🇧🇳', 'Bolivia': '🇧🇴', 'Caribbean Netherlands': '🇧🇶', 'Brazil': '🇧🇷', 'Bahamas': '🇧🇸',
    'Bhutan': '🇧🇹', 'Bouvet Island': '🇧🇻', 'Botswana': '🇧🇼', 'Belarus': '🇧🇾', 'Belize': '🇧🇿',
    'Canada': '🇨🇦', 'Cocos (Keeling) Islands': '🇨🇨', 'Congo - Kinshasa': '🇨🇩', 'Central African Republic': '🇨🇫',
    'Congo - Brazzaville': '🇨🇬', 'Switzerland': '🇨🇭', 'Côte d’Ivoire': '🇨🇮', 'Cook Islands': '🇨🇰',
    'Chile': '🇨🇱', 'Cameroon': '🇨🇲', 'China': '🇨🇳', 'Colombia': '🇨🇴', 'Clipperton Island': '🇨🇵',
    'Costa Rica': '🇨🇷', 'Cuba': '🇨🇺', 'Cape Verde': '🇨🇻', 'Curaçao': '🇨🇼', 'Christmas Island': '🇨🇽',
    'Cyprus': '🇨🇾', 'Czechia': '🇨🇿', 'Germany': '🇩🇪', 'Diego Garcia': '🇩🇬', 'Djibouti': '🇩🇯',
    'Denmark': '🇩🇰', 'Dominica': '🇩🇲', 'Dominican Republic': '🇩🇴', 'Algeria': '🇩🇿', 'Ceuta & Melilla': '🇪🇦',
    'Ecuador': '🇪🇨', 'Estonia': '🇪🇪', 'Egypt': '🇪🇬', 'Western Sahara': '🇪🇭', 'Eritrea': '🇪🇷',
    'Spain': '🇪🇸', 'Ethiopia': '🇪🇹', 'European Union': '🇪🇺', 'Finland': '🇫🇮', 'Fiji': '🇫🇯',
    'Falkland Islands': '🇫🇰', 'Micronesia': '🇫🇲', 'Faroe Islands': '🇫🇴', 'France': '🇫🇷', 'Gabon': '🇬🇦',
    'United Kingdom': '🇬🇧', 'Grenada': '🇬🇩', 'Georgia': '🇬🇪', 'French Guiana': '🇬🇫', 'Guernsey': '🇬🇬',
    'Ghana': '🇬🇭', 'Gibraltar': '🇬🇮', 'Greenland': '🇬🇱', 'Gambia': '🇬🇲', 'Guinea': '🇬🇳',
    'Guadeloupe': '🇬🇵', 'Equatorial Guinea': '🇬🇶', 'Greece': '🇬🇷', 'South Georgia & South Sandwich Islands': '🇬🇸',
    'Guatemala': '🇬🇹', 'Guam': '🇬🇺', 'Guinea-Bissau': '🇬🇼', 'Guyana': '🇬🇾', 'Hong Kong SAR China': '🇭🇰',
    'Heard & McDonald Islands': '🇭🇲', 'Honduras': '🇭🇳', 'Croatia': '🇭🇷', 'Haiti': '🇭🇹', 'Hungary': '🇭🇺',
    'Canary Islands': '🇮🇨', 'Indonesia': '🇮🇩', 'Ireland': '🇮🇪', 'Israel': '🇮🇱', 'Isle of Man': '🇮🇲',
    'India': '🇮🇳', 'British Indian Ocean Territory': '🇮🇴', 'Iraq': '🇮🇶', 'Iran': '🇮🇷', 'Iceland': '🇮🇸',
    'Italy': '🇮🇹', 'Jersey': '🇯🇪', 'Jamaica': '🇯🇲', 'Jordan': '🇯🇴', 'Japan': '🇯🇵', 'Kenya': '🇰🇪',
    'Kyrgyzstan': '🇰🇬', 'Cambodia': '🇰🇭', 'Kiribati': '🇰🇮', 'Comoros': '🇰🇲', 'St. Kitts & Nevis': '🇰🇳',
    'North Korea': '🇰🇵', 'South Korea': '🇰🇷', 'Kuwait': '🇰🇼', 'Cayman Islands': '🇰�', 'Kazakhstan': '🇰🇿',
    'Laos': '🇱🇦', 'Lebanon': '🇱🇧', 'St. Lucia': '🇱🇨', 'Liechtenstein': '🇱🇮', 'Sri Lanka': '🇱🇰',
    'Liberia': '🇱🇷', 'Lesotho': '🇱🇸', 'Lithuania': '🇱🇹', 'Luxembourg': '🇱�🇺', 'Latvia': '🇱�',
    'Libya': '🇱🇾', 'Morocco': '🇲🇦', 'Monaco': '🇲🇨', 'Moldova': '🇲🇩', 'Montenegro': '�🇪', 'St. Martin': '🇲🇫',
    'Madagascar': '🇲🇬', 'Marshall Islands': '🇲🇭', 'North Macedonia': '🇲🇰', 'Mali': '🇲🇱', 'Myanmar (Burma)': '🇲🇲',
    'Mongolia': '🇲🇳', 'Macao SAR China': '🇲🇴', 'Northern Mariana Islands': '🇲🇵', 'Martinique': '🇲🇶',
    'Mauritania': '�🇷', 'Montserrat': '🇲🇸', 'Malta': '🇲🇹', 'Mauritius': '🇲🇺', 'Maldives': '🇲🇻',
    'Malawi': '🇲🇼', 'Mexico': '🇲🇽', 'Malaysia': '🇲🇾', 'Mozambique': '🇲🇿', 'Namibia': '🇳🇦',
    'New Caledonia': '🇳🇨', 'Niger': '🇳🇪', 'Norfolk Island': '🇳🇫', 'Nigeria': '🇳🇬', 'Nicaragua': '🇳🇮',
    'Netherlands': '🇳🇱', 'Norway': '🇳🇴', 'Nepal': '🇳🇵', 'Nauru': '🇳🇷', 'Niue': '🇳🇺', 'New Zealand': '🇳🇿',
    'Oman': '🇴🇲', 'Panama': '🇵🇦', 'Peru': '🇵🇪', 'French Polynesia': '🇵🇫', 'Papua New Guinea': '🇵🇬',
    'Philippines': '🇵🇭', 'Pakistan': '🇵🇰', 'Poland': '🇵🇱', 'St. Pierre & Miquelon': '🇵🇲',
    'Pitcairn Islands': '🇵🇳', 'Puerto Rico': '🇵🇷', 'Palestinian Territories': '🇵🇸', 'Portugal': '🇵🇹',
    'Palau': '🇵🇼', 'Paraguay': '🇵🇾', 'Qatar': '🇶🇦', 'Réunion': '🇷🇪', 'Romania': '🇷🇴', 'Serbia': '🇷🇸',
    'Russia': '🇷🇺', 'Rwanda': '🇷🇼', 'Saudi Arabia': '🇸🇦', 'Solomon Islands': '🇸🇧', 'Seychelles': '🇸🇨',
    'Sudan': '🇸🇩', 'Sweden': '🇸🇪', 'Singapore': '🇸🇬', 'St. Helena': '🇸🇭', 'Slovenia': '🇸🇮',
    'Svalbard & Jan Mayen': '🇸🇯', 'Slovakia': '🇸🇰', 'Sierra Leone': '🇸🇱', 'San Marino': '🇸🇲',
    'Senegal': '🇸🇳', 'Somalia': '🇸🇴', 'Suriname': '🇸🇷', 'South Sudan': '🇸�', 'São Tomé & Príncipe': '🇸🇹',
    'El Salvador': '🇸🇻', 'Sint Maarten': '🇸🇽', 'Syria': '🇸🇾', 'Eswatini': '🇸🇿', 'Tristan da Cunha': '🇹🇦',
    'Turks & Caicos Islands': '🇹�🇨', 'Chad': '🇹🇩', 'French Southern Territories': '🇹🇫', 'Togo': '🇹🇬',
    'Thailand': '🇹�', 'Tajikistan': '🇹🇯', 'Tokelau': '🇹🇰', 'Timor-Leste': '🇹🇱', 'Turkmenistan': '🇹🇲',
    'Tunisia': '🇹🇳', 'Tonga': '🇹�🇴', 'Turkey': '🇹🇷', 'Trinidad & Tobago': '🇹🇹', 'Tuvalu': '🇹🇻',
    'Taiwan': '🇹🇼', 'Tanzania': '🇹🇿', 'Ukraine': '🇺🇦', 'Uganda': '🇺🇬', 'U.S. Outlying Islands': '🇺🇲',
    'United Nations': '🇺🇳', 'United States': '🇺🇸', 'Uruguay': '🇺🇾', 'Uzbekistan': '🇺🇿', 'Vatican City': '🇻🇦',
    'St. Vincent & Grenadines': '🇻🇨', 'Venezuela': '🇻🇪', 'British Virgin Islands': '🇻🇬',
    'U.S. Virgin Islands': '🇻🇮', 'Vietnam': '🇻🇳', 'Vanuatu': '🇻🇺', 'Wallis & Futuna': '🇼🇫',
    'Samoa': '🇼🇸', 'Kosovo': '🇽🇰', 'Yemen': '🇾🇪', 'Mayotte': 'YT', 'South Africa': '🇿🇦',
    'Zambia': '🇿🇲', 'Zimbabwe': '🇿🇼', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿'
};

function getFlag(country: string) {
    if (!country) return '🌐';
    return COUNTRY_FLAGS[country] || '🌐';
}

function SessionTimeline({ session }: { session: any }) {
    if (!session.pageViews && !session.events) return null;

    const timeline = [
        ...(session.pageViews || []).map((pv: any) => ({ ...pv, type: 'page_view' })),
        ...(session.events || []).map((e: any) => ({ ...e, type: 'event', path: e.metadata?.path || 'Action' }))
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (timeline.length === 0) return (
        <div className="py-8 text-center text-slate-500 italic text-sm">
            No detailed navigation data available for this session.
        </div>
    );

    return (
        <div className="py-8 px-10 bg-white/[0.01] border-t border-white/5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Navigation Journey</h3>

            {/* Technical Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Compass className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Browser</p>
                        <p className="text-white text-xs font-medium">{session.browser || 'Unknown'}</p>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">OS & Screen</p>
                        <p className="text-white text-xs font-medium">
                            {session.os || 'Unknown'}
                            {session.screenWidth && ` (${session.screenWidth}x${session.screenHeight})`}
                        </p>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                        <Languages className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Language</p>
                        <p className="text-white text-xs font-medium uppercase">{session.language || 'Unknown'}</p>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                        <Globe className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Network / ISP</p>
                        <p className="text-white text-xs font-medium truncate max-w-[120px]" title={session.org || session.isp}>
                            {session.org || session.isp || 'Unknown'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-0 relative">
                {/* Timeline Line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/5" />

                {timeline.map((item, i) => (
                    <div key={i} className="relative pl-10 pb-8 last:pb-4 group">
                        {/* Dot */}
                        <div className={`absolute left-0 top-0.5 w-6 h-6 rounded-full border-2 border-slate-900 z-10 flex items-center justify-center transition-transform group-hover:scale-110
                            ${item.type === 'page_view' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-brand-gold shadow-[0_0_10px_rgba(234,179,8,0.3)]'}
                        `}>
                            {item.type === 'page_view' ? (
                                <MousePointer2 className="w-3 h-3 text-white" />
                            ) : (
                                <Activity className="w-3 h-3 text-brand-blue" />
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <span className={`text-sm font-bold tracking-tight ${item.type === 'page_view' ? 'text-white' : 'text-brand-gold'}`}>
                                    {item.type === 'page_view' ? item.path : (item.name?.replace(/_/g, ' ') || 'Interaction')}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                {item.type === 'page_view' && item.duration && (
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                                        ⏱️ {item.duration}s duration
                                    </span>
                                )}
                                {item.type === 'event' && (
                                    <span className="text-[10px] text-brand-gold/60 uppercase font-bold tracking-tighter">
                                        Triggered {item.category || 'interaction'}
                                    </span>
                                )}
                            </div>

                            {item.metadata && Object.keys(item.metadata).length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {Object.entries(item.metadata).map(([k, v]: [string, any]) => (
                                        k !== 'path' && (
                                            <span key={k} className="text-[9px] bg-white/5 px-2 py-0.5 rounded border border-white/5 text-slate-500 font-medium whitespace-nowrap">
                                                <span className="text-slate-600 mr-1">{k}:</span>
                                                {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                            </span>
                                        )
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Exit Point */}
                <div className="relative pl-10 group mt-4">
                    <div className="absolute left-0 top-0 w-6 h-6 rounded-full border-2 border-slate-900 bg-red-500/20 z-10 flex items-center justify-center">
                        <LogOut className="w-3 h-3 text-red-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-red-400">Exit / Last Activity</span>
                            <span className="text-[10px] text-slate-600 bg-red-500/5 px-2 py-0.5 rounded font-mono">
                                {new Date(session.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        </div>
                        <span className="text-[10px] text-slate-500 italic">User left site from: <span className="text-slate-400 font-bold not-italic ml-1">{timeline[timeline.length - 1]?.path || 'Unknown page'}</span></span>
                    </div>
                </div>
            </div>
        </div >
    );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getZKeyAuthToken } from "@/lib/auth";
import { bookingClient } from "@/lib/booking-client";
import { Ticket, Clock, Infinity as InfinityIcon, CreditCard, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function WalletPage() {
    const token = await getZKeyAuthToken();
    if (!token) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <p className="text-slate-500 font-medium">Please log in to view your wallet.</p>
                <Link href="/sign-in" className="mt-4 text-blue-600 hover:underline">Sign in</Link>
            </div>
        );
    }

    const passes = await bookingClient.getMyPasses(token).catch(e => {
        console.error("[WalletPage] Error fetching passes:", e);
        return [];
    });

    const activePasses = passes.filter(p => p.status === 'ACTIVE');
    const pastPasses = passes.filter(p => p.status !== 'ACTIVE');

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">My Wallet</h2>
                <p className="text-slate-500 mt-1">
                    Manage your active passes and class credits.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {activePasses.length === 0 ? (
                    <Card className="md:col-span-2 border-dashed bg-slate-50/50">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <Ticket className="h-6 w-6 text-slate-400" />
                            </div>
                            <CardTitle className="text-lg font-semibold text-slate-900">No Active Passes</CardTitle>
                            <CardDescription className="mt-2 max-w-[250px]">
                                Purchase a class pack or membership to start booking sessions.
                            </CardDescription>
                            <Link href="/search?q=pass" className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                                Browse Passes
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    activePasses.map((pass) => (
                        <Card key={pass.id} className="relative overflow-hidden border-slate-200 hover:shadow-lg transition-all duration-300">
                            <div className={`absolute top-0 left-0 w-1 h-full ${pass.template.type === 'MEMBERSHIP' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <Badge variant="outline" className="mb-2 uppercase tracking-tight text-[10px] font-bold">
                                            {pass.template.type}
                                        </Badge>
                                        <CardTitle className="text-xl font-bold text-slate-900">
                                            {pass.template.name}
                                        </CardTitle>
                                    </div>
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${pass.template.type === 'MEMBERSHIP' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {pass.template.unlimited ? <InfinityIcon className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Balance</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-slate-900">
                                                    {pass.template.unlimited ? '∞' : pass.creditsRemaining}
                                                </span>
                                                {!pass.template.unlimited && (
                                                    <span className="text-sm text-slate-400 font-medium">/ {pass.template.creditsAmount} credits</span>
                                                )}
                                            </div>
                                        </div>
                                        {pass.expiryDate && (
                                            <div className="text-right">
                                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Expires On</p>
                                                <div className="flex items-center justify-end gap-1 text-slate-700 font-medium mt-1">
                                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                    <span className="text-sm">{new Date(pass.expiryDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress Bar for Packs */}
                                    {!pass.template.unlimited && pass.template.creditsAmount && (
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-6">
                                            <div
                                                className="h-full bg-emerald-500 transition-all duration-1000"
                                                style={{ width: `${(pass.creditsRemaining || 0) / pass.template.creditsAmount * 100}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {pastPasses.length > 0 && (
                <div className="pt-6">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Pass History</h3>
                    <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-slate-200">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-semibold text-slate-600">Name</th>
                                    <th className="px-6 py-3 font-semibold text-slate-600">Type</th>
                                    <th className="px-6 py-3 font-semibold text-slate-600 text-center">Final Balance</th>
                                    <th className="px-6 py-3 font-semibold text-slate-600 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pastPasses.map((pass) => (
                                    <tr key={pass.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{pass.template.name}</td>
                                        <td className="px-6 py-4 text-slate-500 capitalize">{pass.template.type.toLowerCase()}</td>
                                        <td className="px-6 py-4 text-center text-slate-500">{pass.template.unlimited ? '∞' : (pass.creditsRemaining || 0)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Badge variant="outline" className={`${pass.status === 'EXPIRED' ? 'text-orange-600 border-orange-200 bg-orange-50' : 'text-slate-400 border-slate-200 bg-slate-50'} text-[10px] font-bold`}>
                                                {pass.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

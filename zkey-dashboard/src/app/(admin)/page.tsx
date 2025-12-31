import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Layers,
  ShieldCheck,
  Users,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Settings,
  Bell
} from "lucide-react";

async function getStats() {
  const [tenants, applications, users] = await Promise.all([
    prisma.tenant.count(),
    prisma.application.count(),
    prisma.user.count(),
  ]);

  return { tenants, applications, users };
}

export default async function OverviewPage() {
  const stats = await getStats();

  const cards = [
    { name: "Total Tenants", value: stats.tenants, icon: Layers, color: "text-blue-600", bg: "bg-blue-100" },
    { name: "Active Applications", value: stats.applications, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-100" },
    { name: "Total Users", value: stats.users, icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Welcome to the ZKey multi-tenant management portal.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.name} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12%
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{card.name}</p>
              <h3 className="text-2xl font-bold text-slate-900">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-900 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-500" />
              Configuration & Providers
            </h3>
            <Link href="/settings" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center">
              Manage All
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/tenants" className="p-4 bg-slate-50 border rounded-xl hover:border-blue-200 transition-all group">
              <div className="p-2 bg-blue-100 rounded-lg w-fit mb-3 group-hover:bg-blue-600 transition-colors">
                <Bell className="w-4 h-4 text-blue-600 group-hover:text-white" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Notification APIs</h4>
              <p className="text-[10px] text-slate-500 mt-1">Configure Brevo & Mobile Labs keys.</p>
            </Link>
            <Link href="/applications" className="p-4 bg-slate-50 border rounded-xl hover:border-emerald-200 transition-all group">
              <div className="p-2 bg-emerald-100 rounded-lg w-fit mb-3 group-hover:bg-emerald-600 transition-colors">
                <ShieldCheck className="w-4 h-4 text-emerald-600 group-hover:text-white" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Auth Protocols</h4>
              <p className="text-[10px] text-slate-500 mt-1">Manage OTP & Wallet settings.</p>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-purple-500" />
            Service Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <span className="text-sm font-medium text-slate-700">Auth Service</span>
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <span className="text-sm font-medium text-slate-700">Database</span>
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                Healthy
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

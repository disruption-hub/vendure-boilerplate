import Link from "next/link";
import { Settings, Shield, Server, Bell, ArrowUpRight } from "lucide-react";

export default function SettingsPage() {
    const sections = [
        {
            title: "Identity & Auth",
            description: "Manage authentication methods and Stellar protocols.",
            icon: Shield,
            links: [
                { name: "Manage Applications", href: "/applications" },
                { name: "Auth Protocols", href: "/applications" },
                { name: "Token Policies", href: "#" }
            ]
        },
        {
            title: "Notification Providers",
            description: "Configure Brevo (Email) and Mobile Labs (SMS).",
            icon: Bell,
            links: [
                { name: "Brevo API Configuration", href: "/tenants" },
                { name: "SMS Gateway Settings", href: "/tenants" },
                { name: "Notification Templates", href: "#" }
            ]
        },
        {
            title: "Organization Setup",
            description: "Manage global SSO settings and tenant defaults.",
            icon: Settings,
            links: [
                { name: "Manage Tenants", href: "/tenants" },
                { name: "Global Defaults", href: "/tenants" },
                { name: "Security Policies", href: "/tenants" }
            ]
        },
        {
            title: "System Health",
            description: "Monitor infrastructure and background tasks.",
            icon: Server,
            links: [
                { name: "Database Status", href: "#" },
                { name: "Background Jobs", href: "#" },
                { name: "Error Logs", href: "#" }
            ]
        }
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Global Settings</h1>
                <p className="text-slate-500 mt-1">Configure system-wide parameters and instance defaults.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section) => (
                    <div key={section.title} className="bg-white p-6 rounded-xl border shadow-sm flex flex-col">
                        <div className="flex items-center mb-4">
                            <div className="p-2.5 bg-slate-100 rounded-lg mr-4">
                                <section.icon className="w-6 h-6 text-slate-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">{section.title}</h3>
                                <p className="text-xs text-slate-500">{section.description}</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-2 mt-2">
                            {section.links.map(link => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100 flex items-center justify-between group"
                                >
                                    {link.name}
                                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-xl border shadow-lg text-white relative overflow-hidden group">
                <Bell className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                <h3 className="text-xl font-bold mb-2">Need Help?</h3>
                <p className="text-blue-100/80 text-sm mb-6 max-w-[240px]">
                    Check out the official ZKey documentation for advanced configuration guides.
                </p>
                <button className="px-6 py-2 bg-white text-blue-700 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors shadow-sm active:scale-95">
                    View Docs
                </button>
            </div>
        </div>
    );
}

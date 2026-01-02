"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Loader2, ShieldCheck, Globe, Mail, MessageSquare, Plus, Trash2, X, Palette, Settings2 } from "lucide-react";
import { createApplication } from "./actions";

export default function CreateApplicationForm({ tenants }: { tenants: any[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // State for dynamic lists
    const [corsOrigins, setCorsOrigins] = useState<string[]>(['']);
    const [redirectUris, setRedirectUris] = useState<string[]>(['']);
    const [postLogoutRedirectUris, setPostLogoutRedirectUris] = useState<string[]>(['']);

    // Logo State
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const [vendureEnabled, setVendureEnabled] = useState(false);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Logo file size must be less than 2MB");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setLogoPreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    function addUrl(type: 'cors' | 'redirect' | 'logout') {
        if (type === 'cors') {
            setCorsOrigins([...corsOrigins, '']);
        } else if (type === 'redirect') {
            setRedirectUris([...redirectUris, '']);
        } else {
            setPostLogoutRedirectUris([...postLogoutRedirectUris, '']);
        }
    }

    function removeUrl(type: 'cors' | 'redirect' | 'logout', index: number) {
        if (type === 'cors') {
            const newOrigins = [...corsOrigins];
            newOrigins.splice(index, 1);
            setCorsOrigins(newOrigins.length > 0 ? newOrigins : ['']);
        } else if (type === 'redirect') {
            const newUris = [...redirectUris];
            newUris.splice(index, 1);
            setRedirectUris(newUris.length > 0 ? newUris : ['']);
        } else {
            const newUris = [...postLogoutRedirectUris];
            newUris.splice(index, 1);
            setPostLogoutRedirectUris(newUris.length > 0 ? newUris : ['']);
        }
    }

    function updateUrl(type: 'cors' | 'redirect' | 'logout', index: number, value: string) {
        if (type === 'cors') {
            const newOrigins = [...corsOrigins];
            newOrigins[index] = value;
            setCorsOrigins(newOrigins);
        } else if (type === 'redirect') {
            const newUris = [...redirectUris];
            newUris[index] = value;
            setRedirectUris(newUris);
        } else {
            const newUris = [...postLogoutRedirectUris];
            newUris[index] = value;
            setPostLogoutRedirectUris(newUris);
        }
    }

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            try {
                const application = await createApplication(formData);
                toast.success("Application created successfully");
                router.push(`/applications/${application.id}`);
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to create application");
            }
        });
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="border-b bg-slate-50/50 px-6 py-4 flex items-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 mr-2" />
                    <h3 className="font-semibold text-slate-900">General Information</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Owner Tenant</label>
                        <select
                            name="tenantId"
                            required
                            className="w-full px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                            <option value="">Select a tenant...</option>
                            {tenants.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Application Name</label>
                        <input
                            name="name"
                            required
                            placeholder="e.g. My Next.js Frontend"
                            className="w-full px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <div className="space-y-2 col-span-1 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <textarea
                            name="description"
                            placeholder="A brief description of this application..."
                            className="w-full px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all h-20"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="border-b bg-slate-50/50 px-6 py-4 flex items-center">
                    <Palette className="w-5 h-5 text-purple-500 mr-2" />
                    <h3 className="font-semibold text-slate-900">Branding</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-1 md:col-span-2">
                        {/* Hidden input to store base64 string */}
                        <input type="hidden" name="logo" value={logoPreview || ''} />

                        <label className="block text-sm font-medium text-slate-700 mb-2">Application Logo</label>
                        <div className="flex items-center gap-6">
                            <div className="flex-shrink-0">
                                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden relative group transition-colors hover:border-blue-400">
                                    {logoPreview ? (
                                        <img
                                            src={logoPreview}
                                            alt="Logo preview"
                                            className="w-full h-full object-contain p-2"
                                        />
                                    ) : (
                                        <div className="text-slate-300 group-hover:text-blue-400 transition-colors">
                                            <Palette className="w-8 h-8 mx-auto mb-1" />
                                            <span className="text-[10px] block text-center font-medium">No Logo</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                                {logoPreview && (
                                    <button
                                        type="button"
                                        onClick={() => setLogoPreview(null)}
                                        className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium flex items-center justify-center w-full"
                                    >
                                        <Trash2 className="w-3 h-3 mr-1" /> Remove
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 space-y-2 text-sm text-slate-500">
                                <p>Upload your application logo to be displayed on the login screen and emails.</p>
                                <p className="text-xs text-slate-400">Recommended size: 512x512px. Max size: 2MB. formats: PNG, JPG, WEBP.</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Primary Color</label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                name="primaryColor"
                                defaultValue="#3b82f6"
                                className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                            />
                            <input
                                placeholder="#3b82f6"
                                className="flex-1 px-4 py-2 bg-white border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                onChange={(e) => {
                                    const next = e.target.previousElementSibling as HTMLInputElement;
                                    if (next) next.value = e.target.value;
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Page Background Color</label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                name="backgroundColor"
                                defaultValue="#0f172a"
                                className="h-10 w-12 p-1 bg-white border rounded-lg cursor-pointer"
                            />
                            <input
                                placeholder="#0f172a"
                                className="flex-1 px-4 py-2 bg-white border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                onChange={(e) => {
                                    const next = e.target.previousElementSibling as HTMLInputElement;
                                    if (next) next.value = e.target.value;
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Login Form Title</label>
                        <input
                            name="loginTitle"
                            placeholder="Sign in to your account"
                            className="w-full px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>

                    <div className="space-y-2 col-span-1 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Login Form Subtitle</label>
                        <textarea
                            name="loginSubtitle"
                            placeholder="Enter your credentials to continue"
                            className="w-full px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all h-20 resize-none"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="border-b bg-slate-50/50 px-6 py-4 flex items-center">
                    <Globe className="w-5 h-5 text-blue-500 mr-2" />
                    <h3 className="font-semibold text-slate-900">Connectivity</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-slate-700">CORS Origins</label>
                            <button
                                type="button"
                                onClick={() => addUrl('cors')}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center text-xs font-medium"
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Origin
                            </button>
                        </div>
                        <div className="space-y-3">
                            {corsOrigins.map((origin, index) => (
                                <div key={`cors-${index}`} className="flex items-center gap-2">
                                    <input
                                        name="corsOrigins"
                                        type="text"
                                        value={origin}
                                        onChange={(e) => updateUrl('cors', index, e.target.value)}
                                        placeholder="https://example.com"
                                        className="flex-1 px-4 py-2 bg-white border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeUrl('cors', index)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        disabled={corsOrigins.length === 1 && corsOrigins[0] === ''}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-slate-700">Redirect URIs</label>
                            <button
                                type="button"
                                onClick={() => addUrl('redirect')}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center text-xs font-medium"
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Add URI
                            </button>
                        </div>
                        <div className="space-y-3">
                            {redirectUris.map((uri, index) => (
                                <div key={`redirect-${index}`} className="flex items-center gap-2">
                                    <input
                                        name="redirectUris"
                                        type="text"
                                        value={uri}
                                        onChange={(e) => updateUrl('redirect', index, e.target.value)}
                                        placeholder="https://example.com/callback"
                                        className="flex-1 px-4 py-2 bg-white border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeUrl('redirect', index)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        disabled={redirectUris.length === 1 && redirectUris[0] === ''}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-slate-700">Post Logout Redirect URIs</label>
                            <button
                                type="button"
                                onClick={() => addUrl('logout')}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center text-xs font-medium"
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Add URI
                            </button>
                        </div>
                        <div className="space-y-3">
                            {postLogoutRedirectUris.map((uri, index) => (
                                <div key={`logout-${index}`} className="flex items-center gap-2">
                                    <input
                                        name="postLogoutRedirectUris"
                                        type="text"
                                        value={uri}
                                        onChange={(e) => updateUrl('logout', index, e.target.value)}
                                        placeholder="https://example.com/logout-callback"
                                        className="flex-1 px-4 py-2 bg-white border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeUrl('logout', index)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        disabled={postLogoutRedirectUris.length === 1 && postLogoutRedirectUris[0] === ''}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="border-b bg-slate-50/50 px-6 py-4 flex items-center">
                    <Settings2 className="w-5 h-5 text-slate-500 mr-2" />
                    <h3 className="font-semibold text-slate-900">Token & Session Settings</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className="flex items-start p-4 bg-slate-50 border rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                            <input
                                type="checkbox"
                                name="alwaysIssueRefreshToken"
                                defaultChecked
                                className="w-4 h-4 mt-1 text-blue-600 rounded border-slate-300 mr-4"
                            />
                            <div>
                                <span className="text-sm font-bold text-slate-700 block">Always issue refresh token</span>
                                <span className="text-xs text-slate-500 mt-1 block">Always issue refresh tokens, regardless of consent prompt.</span>
                            </div>
                        </label>

                        <label className="flex items-start p-4 bg-slate-50 border rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                            <input
                                type="checkbox"
                                name="rotateRefreshToken"
                                className="w-4 h-4 mt-1 text-blue-600 rounded border-slate-300 mr-4"
                            />
                            <div>
                                <span className="text-sm font-bold text-slate-700 block">Rotate refresh token</span>
                                <span className="text-xs text-slate-500 mt-1 block">Issue a new refresh token when 70% of TTL has passed.</span>
                            </div>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Refresh token TTL (days)</label>
                            <input
                                name="refreshTokenTtl"
                                type="number"
                                defaultValue={14}
                                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Backchannel logout URI</label>
                            <input
                                name="backchannelLogoutUri"
                                type="url"
                                placeholder="https://your.website.com/backchannel_logout"
                                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>

                    <label className="flex items-start p-4 bg-slate-50 border rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                        <input
                            type="checkbox"
                            name="isSessionRequired"
                            className="w-4 h-4 mt-1 text-blue-600 rounded border-slate-300 mr-4"
                        />
                        <div>
                            <span className="text-sm font-bold text-slate-700 block">Is session required?</span>
                            <span className="text-xs text-slate-500 mt-1 block">Include `sid` claim in the logout token.</span>
                        </div>
                    </label>
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="border-b bg-slate-50/50 px-6 py-4 flex items-center">
                    <Mail className="w-5 h-5 text-blue-500 mr-2" />
                    <h3 className="font-semibold text-slate-900">Override Email Provider (Optional)</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Brevo API Key</label>
                        <input
                            name="brevoApiKey"
                            type="password"
                            placeholder="Leave empty to use tenant default"
                            className="w-full px-4 py-2 bg-white border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Sender Email</label>
                            <input
                                name="brevoSenderEmail"
                                type="email"
                                placeholder="auth@yourdomain.com"
                                className="w-full px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Sender Name</label>
                            <input
                                name="brevoSenderName"
                                placeholder="App Specific Auth"
                                className="w-full px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="border-b bg-slate-50/50 px-6 py-4 flex items-center">
                    <Settings2 className="w-5 h-5 text-slate-500 mr-2" />
                    <h3 className="font-semibold text-slate-900">Vendure Integration</h3>
                </div>
                <div className="p-6 space-y-4">
                    <label className="flex items-start p-4 bg-slate-50 border rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                        <input
                            type="checkbox"
                            name="vendureEnabled"
                            checked={vendureEnabled}
                            onChange={(e) => setVendureEnabled(e.target.checked)}
                            className="w-4 h-4 mt-1 text-blue-600 rounded border-slate-300 mr-4"
                        />
                        <div>
                            <span className="text-sm font-bold text-slate-700 block">Enable Vendure customer sync</span>
                            <span className="text-xs text-slate-500 mt-1 block">Required for dashboard Users create/edit/delete to sync into Vendure.</span>
                        </div>
                    </label>

                    {vendureEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4 md:col-span-2">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Development Admin API URL</label>
                                    <input
                                        name="vendureAdminApiUrlDev"
                                        placeholder="http://localhost:3000/admin-api"
                                        className="w-full px-4 py-2 bg-white border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                    <span className="text-[10px] text-slate-400">Used when running ZKey locally or in development mode.</span>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Production Admin API URL</label>
                                    <input
                                        name="vendureAdminApiUrlProd"
                                        placeholder="https://your-vendure-prod.com/admin-api"
                                        className="w-full px-4 py-2 bg-white border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                    <span className="text-[10px] text-slate-400">Used when deployed to the production environment (Vercel).</span>
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-700">Vendure Auth Token Header (optional)</label>
                                <input
                                    name="vendureAuthTokenHeader"
                                    placeholder="vendure-auth-token"
                                    className="w-full px-4 py-2 bg-white border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-700">Admin API Token (recommended)</label>
                                <input
                                    name="vendureAdminApiToken"
                                    type="password"
                                    placeholder="Leave empty to use username/password"
                                    className="w-full px-4 py-2 bg-white border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Superadmin Username</label>
                                <input
                                    name="vendureSuperadminUsername"
                                    placeholder="superadmin"
                                    className="w-full px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Superadmin Password</label>
                                <input
                                    name="vendureSuperadminPassword"
                                    type="password"
                                    placeholder="superadmin"
                                    className="w-full px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    disabled={isPending}
                    type="submit"
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold shadow-md active:scale-95"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5 mr-2" />
                            Register Application
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

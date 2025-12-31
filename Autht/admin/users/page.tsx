"use client";

import { useState, useEffect } from 'react';
import { Users, Search, CheckCircle, XCircle, MoreVertical, Loader2, ShieldAlert, Edit2, Trash2, Ban, Unlock, X, Building2, Wallet, Repeat, ArrowRight, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-bbc1.up.railway.app';

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal states
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [isResendModalOpen, setIsResendModalOpen] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${API_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleApprove = async (userId: string) => {
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${API_URL}/auth/admin/approve-user/${userId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to approve user');

            toast.success('User approved successfully');
            fetchUsers(); // Refresh list
        } catch (err) {
            console.error(err);
            toast.error('Failed to approve user');
        }
    };

    const handleToggleSuspension = async (userId: string) => {
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${API_URL}/admin/users/${userId}/suspend`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to update user status');

            toast.success('User status updated');
            fetchUsers();
            if (selectedUser?.id === userId) {
                // Refresh modal data if open
                handleViewDetails(userId);
            }
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleViewDetails = async (userId: string) => {
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${API_URL}/admin/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();

                // Clean data for editing
                let cleanPhone = (data.phoneNumber || '').trim();
                const cc = (data.countryCode || '').trim();

                if (cc && cleanPhone.startsWith(cc)) {
                    cleanPhone = cleanPhone.substring(cc.length).trim();
                }

                if (cleanPhone.includes(' ')) {
                    cleanPhone = cleanPhone.split(' ').filter(Boolean).pop() || '';
                }

                setSelectedUser({
                    ...data,
                    phoneNumber: cleanPhone
                });
                setIsEditModalOpen(true);
            }
        } catch (err) {
            toast.error('Failed to load user details');
        }
    };

    const handleResendOtp = async (type: 'email' | 'mobile') => {
        setIsResending(true);
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${API_URL}/admin/users/${selectedUser.id}/resend-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ type }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to resend OTP');

            toast.success(data.message || 'OTP resent successfully');
            setIsResendModalOpen(false);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsResending(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${API_URL}/admin/users/${selectedUser.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...selectedUser,
                    // Robust cleaning before save
                    phoneNumber: (selectedUser.phoneNumber || '').trim().split(' ').pop()?.replace(selectedUser.countryCode || '', '').trim().replace(/\s+/g, '') || '',
                    roles: selectedUser.roles
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update user');
            }

            toast.success('User updated successfully');
            setIsEditModalOpen(false);
            fetchUsers();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirmText !== 'DELETE') {
            toast.error('Please type DELETE to confirm');
            return;
        }

        const userId = userToDelete.id;
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${API_URL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to delete user');

            toast.success('User deleted successfully');
            setUserToDelete(null);
            setDeleteConfirmText('');
            fetchUsers();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete user');
        }
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.phoneNumber?.includes(search)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                    <p className="text-slate-400">Manage system users, investors, and project owners.</p>
                </div>
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:w-64 bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-slate-950/50">
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Joined</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading users...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">No users found.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-white">{user.name || 'Unnamed User'}</div>
                                            {user.roles?.includes('PROJECT_OWNER') && user.contactName && (
                                                <div className="text-xs text-purple-400 font-medium">Rep: {user.contactName}</div>
                                            )}
                                            <div className="text-sm text-slate-500">{user.email || user.phoneNumber || 'No contact info'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles?.map((r: string) => (
                                                    <span key={r} className={`
                                                        text-[10px] uppercase font-bold px-2 py-0.5 rounded-full
                                                        ${r === 'SYSTEM_ADMIN' ? 'bg-red-500/10 text-red-500' :
                                                            r === 'PROJECT_OWNER' ? 'bg-purple-500/10 text-purple-500' :
                                                                'bg-blue-500/10 text-blue-500'}
                                                    `}>
                                                        {r.replace('_', ' ')}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {user.isVerified ? (
                                                    <span className="flex items-center gap-1 text-xs text-green-500">
                                                        <CheckCircle className="w-3 h-3" /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                                        <XCircle className="w-3 h-3" /> Unverified
                                                    </span>
                                                )}

                                                {!user.isApproved ? (
                                                    <span className="flex items-center gap-1 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                                                        <ShieldAlert className="w-3 h-3" /> Pending Approval
                                                    </span>
                                                ) : user.isSuspended ? (
                                                    <span className="flex items-center gap-1 text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                                                        <Ban className="w-3 h-3" /> Suspended
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                        <CheckCircle className="w-3 h-3" /> Active
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {!user.isApproved && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApprove(user.id)}
                                                        className="bg-green-600 hover:bg-green-700 h-8"
                                                    >
                                                        Approve
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleViewDetails(user.id)}
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleToggleSuspension(user.id)}
                                                    className={`h-8 w-8 p-0 ${user.isSuspended ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-yellow-400 hover:bg-yellow-500/10'}`}
                                                    title={user.isSuspended ? 'Reactivate User' : 'Suspend User'}
                                                >
                                                    {user.isSuspended ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setUserToDelete(user)}
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {/* User Edit & Details Modal */}
                {isEditModalOpen && selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsEditModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-950/50">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-500" />
                                    User Details & Management
                                </h2>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-8">
                                {/* Basic Info Form */}
                                <form onSubmit={handleUpdateUser} id="user-edit-form" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">
                                            {selectedUser.roles?.includes('PROJECT_OWNER') ? 'Company / Entity Name' : 'Full Name'}
                                        </label>
                                        <input
                                            type="text"
                                            value={selectedUser.name || ''}
                                            onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                            placeholder={selectedUser.roles?.includes('PROJECT_OWNER') ? 'Legal Entity Name' : 'User Full Name'}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Person in Charge / Contact</label>
                                        <input
                                            type="text"
                                            value={selectedUser.contactName || ''}
                                            onChange={(e) => setSelectedUser({ ...selectedUser, contactName: e.target.value })}
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="Contact Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                                        <input
                                            type="email"
                                            value={selectedUser.email || ''}
                                            onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={selectedUser.countryCode || ''}
                                                onChange={(e) => setSelectedUser({ ...selectedUser, countryCode: e.target.value })}
                                                className="w-20 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                                placeholder="+1"
                                            />
                                            <input
                                                type="text"
                                                value={selectedUser.phoneNumber || ''}
                                                onChange={(e) => setSelectedUser({ ...selectedUser, phoneNumber: e.target.value })}
                                                className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Account Status</label>
                                        <div className="flex items-center gap-3 py-2">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleSuspension(selectedUser.id)}
                                                className={`
                                                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors
                                                    ${selectedUser.isSuspended
                                                        ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                                                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'}
                                                `}
                                                title={selectedUser.isSuspended ? 'Reactivate account' : 'Suspend account'}
                                            >
                                                {selectedUser.isSuspended ? <Ban className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                                {selectedUser.isSuspended ? 'Status: Suspended' : 'Status: Active'}
                                            </button>
                                            {!selectedUser.isApproved && selectedUser.isVerified && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleApprove(selectedUser.id)}
                                                    className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-yellow-500/20"
                                                >
                                                    Approve Now
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Verification</label>
                                        <div className="flex items-center gap-3 py-1">
                                            <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${selectedUser.isVerified ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                                {selectedUser.isVerified ? 'Verified' : 'Unverified'}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsResendModalOpen(true)}
                                                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 px-2 py-1"
                                            >
                                                <Repeat className="w-3.5 h-3.5" />
                                                Resend Code
                                            </button>
                                        </div>
                                    </div>

                                    <div className="col-span-1 md:col-span-2 space-y-3 pt-4 border-t border-white/5">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Assign Roles</label>
                                        <div className="flex flex-wrap gap-4">
                                            {['SYSTEM_ADMIN', 'PROJECT_OWNER', 'INVESTOR'].map((role) => (
                                                <label key={role} className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUser.roles?.includes(role)}
                                                        onChange={(e) => {
                                                            const newRoles = e.target.checked
                                                                ? [...(selectedUser.roles || []), role]
                                                                : selectedUser.roles?.filter((r: string) => r !== role);
                                                            setSelectedUser({ ...selectedUser, roles: newRoles });
                                                        }}
                                                        className="w-4 h-4 rounded border-white/10 bg-slate-950 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                                                    />
                                                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{role.replace('_', ' ')}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </form>

                                {/* Wallet Info */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                                        <Wallet className="w-4 h-4 text-purple-400" />
                                        Linked Wallet
                                    </h3>
                                    {selectedUser.walletAddress ? (
                                        <div className="bg-slate-950 border border-white/5 p-4 rounded-2xl break-all font-mono text-sm text-slate-300">
                                            {selectedUser.walletAddress}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-sm">No wallet linked to this account.</p>
                                    )}
                                </div>

                                {/* Linked Projects (Ownership or Investments) */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                                        <Building2 className="w-4 h-4 text-emerald-400" />
                                        Linked Projects
                                    </h3>

                                    {/* Projects Owned (if Project Owner) */}
                                    {selectedUser.roles?.includes('PROJECT_OWNER') && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] uppercase font-bold text-slate-500">Owning Portfolio</p>
                                            {selectedUser.ownedProjects?.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {selectedUser.ownedProjects.map((p: any) => (
                                                        <div key={p.id} className="bg-slate-950 border border-white/5 p-3 rounded-xl flex justify-between items-center group">
                                                            <div className="truncate pr-2">
                                                                <div className="text-xs font-bold text-white truncate">{p.name}</div>
                                                                <div className="text-[10px] text-slate-500">{p.status}</div>
                                                            </div>
                                                            <div className="text-[10px] font-mono text-slate-400 group-hover:text-emerald-400">
                                                                ${p.hardCap.toLocaleString()}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-600 italic">No projects owned yet.</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Investments (if Investor) */}
                                    {selectedUser.roles?.includes('INVESTOR') && (
                                        <div className="space-y-2 mt-4">
                                            <p className="text-[10px] uppercase font-bold text-slate-500">Investment Portfolio</p>
                                            {selectedUser.investments?.length > 0 ? (
                                                <div className="space-y-2">
                                                    {selectedUser.investments.slice(0, 5).map((inv: any) => (
                                                        <div key={inv.id} className="bg-slate-950 border border-white/5 p-3 rounded-xl flex justify-between items-center">
                                                            <div>
                                                                <div className="text-xs font-bold text-white">{inv.project.name}</div>
                                                                <div className="text-[10px] text-slate-500">{new Date(inv.purchaseDate).toLocaleDateString()}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-xs font-bold text-emerald-400">${inv.usdValue.toLocaleString()}</div>
                                                                <div className="text-[10px] text-slate-500">{inv.tokenAmount} Tokens</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {selectedUser.investments.length > 5 && (
                                                        <div className="text-center text-[10px] text-slate-500">
                                                            + {selectedUser.investments.length - 5} more investments
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-600 italic">No investments made yet.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 bg-slate-950 border-t border-white/5 flex justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    form="user-edit-form"
                                    disabled={isSaving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Safety Delete Confirmation Modal */}
                {userToDelete && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => {
                                setUserToDelete(null);
                                setDeleteConfirmText('');
                            }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
                            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                            exit={{ opacity: 0, scale: 0.9, rotateX: 20 }}
                            className="relative w-full max-w-md bg-slate-900 border border-red-500/20 rounded-3xl p-8 shadow-2xl text-center"
                        >
                            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                                <ShieldAlert className="w-10 h-10 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Hard Deletion Safety</h2>
                            <p className="text-slate-400 mb-8 text-sm">
                                You are about to permanently delete <span className="text-white font-bold">{userToDelete.email}</span>.
                                This action <span className="text-red-400 underline font-bold underline-offset-4">cannot be undone</span> and will remove all associated projects and investments.
                            </p>

                            <div className="space-y-4 text-left">
                                <label className="text-xs font-bold text-slate-500 uppercase px-1">
                                    Type <span className="text-white">DELETE</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="DELETE"
                                    className="w-full bg-black/40 border border-red-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-all font-mono"
                                />
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setUserToDelete(null);
                                            setDeleteConfirmText('');
                                        }}
                                        className="flex-1 text-slate-400 hover:text-white border border-white/5"
                                    >
                                        Abort
                                    </Button>
                                    <Button
                                        onClick={handleDelete}
                                        disabled={deleteConfirmText !== 'DELETE'}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-30"
                                    >
                                        Delete Forever
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* Resend OTP Selection Modal */}
                {isResendModalOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => setIsResendModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Resend Code</h3>
                                <button onClick={() => setIsResendModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm text-slate-400 mb-4">Choose where to send the new verification code:</p>

                                <button
                                    onClick={() => handleResendOtp('email')}
                                    disabled={isResending || !selectedUser?.email}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                            <Mail className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm text-slate-200">Email Address</div>
                                            <div className="text-xs text-slate-500">{selectedUser?.email || 'Not provided'}</div>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-500" />
                                </button>

                                <button
                                    onClick={() => handleResendOtp('mobile')}
                                    disabled={isResending || !selectedUser?.phoneNumber}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                            <Phone className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm text-slate-200">Mobile Number</div>
                                            <div className="text-xs text-slate-500">
                                                {selectedUser?.countryCode} {selectedUser?.phoneNumber || 'Not provided'}
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-500" />
                                </button>
                            </div>

                            {isResending && (
                                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-blue-400 font-bold">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Transmitting code...
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

'use client';

import { useState, useTransition, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { getUsers, getTenants, createUser, updateUser, deleteUser, verifyUser } from './actions';
import { toast } from 'sonner';

interface User {
    id: string;
    primaryEmail: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    phoneNumber?: string | null;
    walletAddress?: string | null;
    role: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    tenant?: {
        id: string;
        name: string;
    } | null;
    createdAt: string | Date;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function UsersClient({
    initialData
}: {
    initialData: { data: any[]; pagination: Pagination }
}) {
    const [users, setUsers] = useState<User[]>(initialData.data);
    const [pagination, setPagination] = useState<Pagination>(initialData.pagination);
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isPending, startTransition] = useTransition();

    const loadUsers = async (page: number = 1, searchQuery?: string) => {
        try {
            const data = await getUsers(page, 10, searchQuery);
            setUsers(data.data);
            setPagination(data.pagination);
        } catch (error) {
            toast.error('Failed to load users');
        }
    };

    const handleCreate = async (data: any) => {
        startTransition(async () => {
            try {
                await createUser(data);
                toast.success('User created successfully');
                setIsCreateOpen(false);
                await loadUsers();
            } catch (error: any) {
                toast.error(error.message);
            }
        });
    };

    const handleEdit = async (data: any) => {
        if (!selectedUser) return;
        startTransition(async () => {
            try {
                await updateUser(selectedUser.id, data);
                toast.success('User updated successfully');
                setIsEditOpen(false);
                setSelectedUser(null);
                await loadUsers(); // Refresh list
            } catch (error: any) {
                toast.error(error.message);
            }
        });
    };

    const handleDelete = async (user: User) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        startTransition(async () => {
            try {
                await deleteUser(user.id);
                toast.success('User deleted successfully');
                await loadUsers();
            } catch (error: any) {
                toast.error(error.message);
            }
        });
    };

    const handleVerify = async (user: User) => {
        if (!confirm('Are you sure you want to manually verify this user?')) return;
        startTransition(async () => {
            try {
                await verifyUser(user.id);
                toast.success('User verified successfully');
                await loadUsers();
            } catch (error: any) {
                toast.error(error.message);
            }
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadUsers(1, search);
    };

    const getInitials = (user: User) => {
        const first = user.firstName?.[0] || '';
        const last = user.lastName?.[0] || '';
        if (!first && !last) return (user.primaryEmail?.[0] || '?').toUpperCase();
        return (first + last).toUpperCase();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <form onSubmit={handleSearch} className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="search"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </form>

                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition shadow-sm hover:shadow-md active:translate-y-0.5"
                >
                    <Plus className="w-4 h-4" />
                    Add User
                </button>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm">
                <div className="overflow-x-auto rounded-2xl">
                    <table className="w-full min-w-[1000px]">
                    <thead className="bg-slate-50 border-b">
                            <tr className="border-b bg-slate-50/30">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">Phone</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">Wallet</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">Tenant</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right sticky right-0 bg-slate-50/95 backdrop-blur border-l">Actions</th>
                            </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                                            {getInitials(user)}
                                        </div>
                                        <div>
                                            <div className="font-semibold">{user.firstName} {user.lastName}</div>
                                            <div className="text-slate-500 font-normal">{user.primaryEmail || '-'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">
                                    {user.role}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {user.phoneNumber || user.phone || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {user.walletAddress ? (
                                        <span className="font-mono text-xs">{user.walletAddress}</span>
                                    ) : (
                                        '-'
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.emailVerified || user.phoneVerified ? (
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                            Verified
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                                            Pending
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {user.tenant?.name || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-white border-l">
                                    <div className="flex items-center justify-end gap-2">
                                        {!(user.emailVerified || user.phoneVerified) && (
                                            <button
                                                onClick={() => handleVerify(user)}
                                                className="px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition"
                                                title="Verify User"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setIsEditOpen(true);
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user)}
                                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                </div>

                {users.length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                        No users found
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => loadUsers(page, search)}
                            className={`px-4 py-2 rounded-lg font-medium transition ${page === pagination.page
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
            )}

            {/* Create Dialog */}
            {isCreateOpen && (
                <UserDialog
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    onSubmit={handleCreate}
                    isPending={isPending}
                />
            )}

            {/* Edit Dialog */}
            {isEditOpen && selectedUser && (
                <UserDialog
                    key={selectedUser.id}
                    isOpen={isEditOpen}
                    onClose={() => {
                        setIsEditOpen(false);
                        setSelectedUser(null);
                    }}
                    onSubmit={handleEdit}
                    isPending={isPending}
                    user={selectedUser}
                />
            )}
        </div>
    );
}

function UserDialog({
    isOpen,
    onClose,
    onSubmit,
    isPending,
    user,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    isPending: boolean;
    user?: User;
}) {
    const [formData, setFormData] = useState({
        primaryEmail: user?.primaryEmail || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phoneNumber: user?.phoneNumber || user?.phone || '',
        walletAddress: user?.walletAddress || '',
        role: user?.role || 'user',
        tenantId: user?.tenant?.id || '',
        password: '',
    });
    
    // Fetch tenants for dropdown
    const [tenants, setTenants] = useState<{id: string, name: string}[]>([]);
    
    useEffect(() => {
        if (isOpen && !user) {
             getTenants().then(setTenants).catch(() => {});
        }
    }, [isOpen, user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const submitData = user
            ? {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phoneNumber: formData.phoneNumber,
                walletAddress: formData.walletAddress,
                role: formData.role,
            }
            : formData;

        onSubmit(submitData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    {user ? 'Edit User' : 'Create User'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                        <input
                            type="email"
                            value={formData.primaryEmail}
                            onChange={(e) => setFormData({ ...formData, primaryEmail: e.target.value })}
                            disabled={!!user}
                            required
                            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                        <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                        <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                        <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Wallet Address</label>
                        <input
                            type="text"
                            value={formData.walletAddress}
                            onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    
                    {!user && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tenant</label>
                            <select
                                value={formData.tenantId}
                                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                                className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select Tenant...</option>
                                {tenants.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {!user && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isPending}
                            className="flex-1 px-6 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 font-medium transition disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            {user ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

import { getUsers } from './actions';
import UsersClient from './users-client';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
    try {
        const initialData = await getUsers(1, 10);
        // Serialize Dates for client component
        const serializedData = JSON.parse(JSON.stringify(initialData));

        return (
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Users</h1>
                    <p className="text-slate-500 mt-2">Manage user accounts and permissions</p>
                </div>

                <UsersClient initialData={serializedData} />
            </div>
        );
    } catch (error: any) {
        console.error("Users Page Error:", error);
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800">
                    <h2 className="text-lg font-bold mb-2">Failed to load users</h2>
                    <p className="text-sm opacity-90">{error.message || "An unexpected error occurred"}</p>
                    <p className="text-xs mt-4 font-mono">{error.stack}</p>
                </div>
            </div>
        );
    }
}

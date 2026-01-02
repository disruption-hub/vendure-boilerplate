import { getUsers } from './actions';
import UsersClient from './users-client';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
    const initialData = await getUsers(1, 10);

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Users</h1>
                <p className="text-slate-500 mt-2">Manage user accounts and permissions</p>
            </div>

            <UsersClient initialData={initialData} />
        </div>
    );
}

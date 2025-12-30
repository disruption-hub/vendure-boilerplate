'use client';

import { useSearchParams } from 'next/navigation';

export function SearchBar() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') ?? '';

    return (
        <form method="get" action="/search" key={initialQuery}>
            <input
                type="search"
                name="q"
                defaultValue={initialQuery}
                placeholder="Search..."
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
        </form>
    );
}

'use client';

type Props = {
    onSignOut: () => Promise<void>;
};

const SignOut = ({ onSignOut }: Props) => {
    return (
        <button
            onClick={() => {
                onSignOut();
            }}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
            Sign Out
        </button>
    );
};

export default SignOut;

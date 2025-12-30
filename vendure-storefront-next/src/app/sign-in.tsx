'use client';

type Props = {
    onSignIn: () => Promise<void>;
};

const SignIn = ({ onSignIn }: Props) => {
    return (
        <button
            onClick={() => {
                onSignIn();
            }}
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
            Sign In
        </button>
    );
};

export default SignIn;

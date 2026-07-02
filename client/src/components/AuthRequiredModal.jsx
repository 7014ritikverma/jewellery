import { Link } from "react-router-dom";
import { UserRound, X } from "lucide-react";

const AuthRequiredModal = ({ open, onClose, checkoutState }) => {
    if (!open) return null;

    const authState = {
        from: "/checkout",
        checkoutState,
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
            <button
                type="button"
                aria-label="Close login prompt"
                className="absolute inset-0"
                onClick={onClose}
            />
            <div className="relative w-full max-w-sm rounded-md bg-white p-6 text-center shadow-2xl">
                <button
                    type="button"
                    aria-label="Close login prompt"
                    onClick={onClose}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center text-[#3A001F] hover:bg-[#f8edf1]"
                >
                    <X size={19} />
                </button>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f8edf1] text-[#681333]">
                    <UserRound size={23} />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-[#2c1420]">Login to continue</h2>
                <p className="mt-2 text-sm leading-6 text-[#706168]">
                    Sign in or create an account to pay securely and track your order.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                    <Link
                        to="/signup"
                        state={authState}
                        className="rounded-md border border-[#681333] px-4 py-3 text-sm font-semibold text-[#681333]"
                    >
                        Sign up
                    </Link>
                    <Link
                        to="/login"
                        state={authState}
                        className="rounded-md bg-[#681333] px-4 py-3 text-sm font-semibold text-white"
                    >
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AuthRequiredModal;

import { useEffect, useState } from "react";
import axios from "axios";

const emptyForm = { email: "", password: "", mobile: "" };

const AdminLogin = () => {
    const [mode, setMode] = useState("login");
    const [form, setForm] = useState(emptyForm);
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState("credentials");
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (!cooldown) return;
        const timer = setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const switchMode = (nextMode) => {
        setMode(nextMode);
        setStep("credentials");
        setOtp("");
        setCooldown(0);
    };

    const requestOtp = async (e) => {
        e.preventDefault();

        if (!form.email.trim() || !form.password) {
            alert("Email aur password enter karo");
            return;
        }

        try {
            setLoading(true);
            await axios.post(`/api/admin/otp/request`, {
                email: form.email.trim(),
                password: form.password,
            });

            setStep("otp");
            setCooldown(45);
            alert("Admin OTP sent");
        } catch (err) {
            alert(err.response?.data || "Admin OTP send failed");
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (e) => {
        e.preventDefault();

        if (otp.replace(/\D/g, "").length !== 6) {
            alert("6 digit OTP enter karo");
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(`/api/admin/otp/verify`, {
                email: form.email.trim(),
                otp: otp.replace(/\D/g, ""),
            });

            localStorage.setItem("adminToken", res.data.token);
            window.location.href = "/admin";
        } catch (err) {
            alert(err.response?.data || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!form.email.trim() || !form.password || form.mobile.replace(/\D/g, "").length !== 10) {
            alert("Email, password aur 10 digit mobile required hai");
            return;
        }

        try {
            setLoading(true);
            await axios.post(`/api/admin/register`, {
                email: form.email.trim(),
                password: form.password,
                mobile: form.mobile.replace(/\D/g, ""),
            });

            alert("Admin registered. Ab login karo.");
            switchMode("login");
        } catch (err) {
            const msg = err.response?.data;
            alert(msg === "Admin already exists âŒ" ? "Admin already created. Please login" : (msg || "Register failed"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#6b0f1a] to-black px-4">
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl w-full max-w-md text-white">
                <h2 className="text-3xl font-bold text-center mb-6">Admin Access</h2>

                <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-black/20 p-1">
                    <button
                        type="button"
                        onClick={() => switchMode("login")}
                        className={`rounded-lg py-2 font-semibold ${mode === "login" ? "bg-yellow-500 text-black" : "text-white"}`}
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        onClick={() => switchMode("register")}
                        className={`rounded-lg py-2 font-semibold ${mode === "register" ? "bg-yellow-500 text-black" : "text-white"}`}
                    >
                        Register
                    </button>
                </div>

                {mode === "login" ? (
                    <form onSubmit={step === "credentials" ? requestOtp : verifyOtp} className="space-y-4">
                        <input
                            type="email"
                            placeholder="Email"
                            value={form.email}
                            disabled={step === "otp"}
                            className="w-full p-3 rounded-lg bg-white/20 border border-white/30 outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-70"
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={form.password}
                            disabled={step === "otp"}
                            className="w-full p-3 rounded-lg bg-white/20 border border-white/30 outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-70"
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />

                        {step === "otp" && (
                            <input
                                value={otp}
                                inputMode="numeric"
                                maxLength="6"
                                placeholder="Enter Admin OTP"
                                className="w-full p-3 rounded-lg bg-white/20 border border-white/30 outline-none focus:ring-2 focus:ring-yellow-500 tracking-[6px]"
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            />
                        )}

                        <button
                            disabled={loading}
                            className="w-full bg-yellow-500 text-black font-semibold py-3 rounded-lg hover:scale-105 transition disabled:opacity-60"
                        >
                            {step === "credentials"
                                ? (loading ? "Sending OTP..." : "Send OTP")
                                : (loading ? "Verifying..." : "Verify & Login")}
                        </button>

                        {step === "otp" && (
                            <div className="flex items-center justify-between text-sm">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep("credentials");
                                        setOtp("");
                                    }}
                                    className="text-gray-200"
                                >
                                    Change details
                                </button>
                                <button
                                    type="button"
                                    onClick={requestOtp}
                                    disabled={loading || cooldown > 0}
                                    className="font-semibold text-yellow-300 disabled:text-gray-400"
                                >
                                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                                </button>
                            </div>
                        )}
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <input
                            type="email"
                            placeholder="Admin Email"
                            value={form.email}
                            className="w-full p-3 rounded-lg bg-white/20 border border-white/30 outline-none focus:ring-2 focus:ring-yellow-500"
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />

                        <input
                            type="password"
                            placeholder="Admin Password"
                            value={form.password}
                            className="w-full p-3 rounded-lg bg-white/20 border border-white/30 outline-none focus:ring-2 focus:ring-yellow-500"
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />

                        <input
                            value={form.mobile}
                            inputMode="numeric"
                            maxLength="10"
                            placeholder="Admin Mobile"
                            className="w-full p-3 rounded-lg bg-white/20 border border-white/30 outline-none focus:ring-2 focus:ring-yellow-500"
                            onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                        />

                        <button
                            disabled={loading}
                            className="w-full bg-yellow-500 text-black font-semibold py-3 rounded-lg hover:scale-105 transition disabled:opacity-60"
                        >
                            {loading ? "Registering..." : "Register Admin"}
                        </button>
                    </form>
                )}

                <p className="text-center text-sm mt-4 text-gray-300">
                    Register me OTP nahi hai. OTP sirf login ke liye hai.
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;

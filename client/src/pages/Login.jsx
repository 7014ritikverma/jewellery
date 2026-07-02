import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
    const { login } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [mobile, setMobile] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState("mobile");
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (!cooldown) return;
        const timer = setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const cleanMobile = mobile.replace(/\D/g, "").slice(-10);

    const requestOtp = async () => {
        if (cleanMobile.length !== 10) {
            alert("Valid 10 digit mobile number enter karo");
            return;
        }

        try {
            setLoading(true);
            await axios.post(`/api/auth/otp/request`, {
                mobile: cleanMobile,
            });

            setStep("otp");
            setCooldown(45);
            alert("OTP sent successfully");
        } catch (err) {
            console.log(err);
            if (err.response?.status === 404) {
                alert("Account nahi mila. Pehle signup karo.");
                navigate("/signup", { state: { ...location.state, mobile: cleanMobile } });
                return;
            }
            alert(err.response?.data || "OTP send failed");
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async () => {
        if (otp.replace(/\D/g, "").length !== 6) {
            alert("6 digit OTP enter karo");
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(`/api/auth/otp/verify`, {
                mobile: cleanMobile,
                otp: otp.replace(/\D/g, ""),
            });

            login(res.data.token);
            alert("Login Successful");
            navigate(location.state?.from || "/", {
                state: location.state?.checkoutState,
                replace: true,
            });
        } catch (err) {
            console.log(err);
            alert(err.response?.data || "OTP verification failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 pt-24">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow">
                <h2 className="mb-1 text-xl font-bold">Customer Login</h2>
                <p className="mb-5 text-sm text-gray-500">Login securely with mobile OTP</p>

                <label className="mb-2 block text-sm font-semibold">Mobile Number</label>
                <input
                    value={mobile}
                    placeholder="Enter 10 digit mobile"
                    inputMode="numeric"
                    maxLength="10"
                    disabled={step === "otp"}
                    className="mb-4 w-full rounded-lg border p-3 disabled:bg-gray-100"
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />

                {step === "otp" && (
                    <>
                        <label className="mb-2 block text-sm font-semibold">OTP</label>
                        <input
                            value={otp}
                            placeholder="Enter 6 digit OTP"
                            inputMode="numeric"
                            maxLength="6"
                            className="mb-4 w-full rounded-lg border p-3 tracking-[6px]"
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        />
                    </>
                )}

                {step === "mobile" ? (
                    <button
                        onClick={requestOtp}
                        disabled={loading}
                        className="w-full rounded-lg bg-[#6b0f1a] p-3 font-semibold text-white disabled:opacity-60"
                    >
                        {loading ? "Sending..." : "Send OTP"}
                    </button>
                ) : (
                    <div className="space-y-3">
                        <button
                            onClick={verifyOtp}
                            disabled={loading}
                            className="w-full rounded-lg bg-[#6b0f1a] p-3 font-semibold text-white disabled:opacity-60"
                        >
                            {loading ? "Verifying..." : "Verify & Login"}
                        </button>

                        <div className="flex items-center justify-between text-sm">
                            <button
                                type="button"
                                onClick={() => {
                                    setStep("mobile");
                                    setOtp("");
                                }}
                                className="font-semibold text-gray-600"
                            >
                                Change number
                            </button>
                            <button
                                type="button"
                                onClick={requestOtp}
                                disabled={loading || cooldown > 0}
                                className="font-semibold text-[#6b0f1a] disabled:text-gray-400"
                            >
                                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                            </button>
                        </div>
                    </div>
                )}

                <p className="mt-5 text-center text-sm text-gray-600">
                    Account nahi hai?{" "}
                    <Link
                        to="/signup"
                        state={location.state}
                        className="font-semibold text-[#6b0f1a]"
                    >
                        Create account
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;

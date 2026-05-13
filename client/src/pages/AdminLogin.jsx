import { useState } from "react";
import axios from "axios";

const AdminLogin = () => {
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await axios.post(
                "http://localhost:5000/api/admin/login",
                form
            );

            localStorage.setItem("adminToken", res.data.token);
            window.location.href = "/admin";

        } catch (err) {
            alert("Invalid credentials ❌");
        }

        setLoading(false);
    };

    const handleRegister = async () => {
        try {
            await axios.post("http://localhost:5000/api/admin/register", {
                email: form.email,
                password: form.password,
            });

            alert("Admin Registered ✅");

        } catch (err) {
            const msg = err.response?.data;

            if (msg === "Admin already exists ❌") {
                alert("Admin already created. Please login 🔐");
            } else {
                alert(msg || "Error ❌");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#6b0f1a] to-black">

            {/* Card */}
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl w-full max-w-md text-white">

                <h2 className="text-3xl font-bold text-center mb-6">
                    Admin Login
                </h2>



                <form onSubmit={handleLogin} className="space-y-4">

                    {/* Email */}
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full p-3 rounded-lg bg-white/20 border border-white/30 outline-none focus:ring-2 focus:ring-yellow-500"
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />

                    {/* Password */}
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full p-3 rounded-lg bg-white/20 border border-white/30 outline-none focus:ring-2 focus:ring-yellow-500"
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />

                    {/* Button */}
                    <button
                        disabled={loading}
                        className="w-full bg-yellow-500 text-black font-semibold py-3 rounded-lg hover:scale-105 transition"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                    <button
                        type="button"
                        onClick={handleRegister}
                        className="w-full bg-gray-700 text-white py-2 rounded mt-2"
                    >
                        Register (Only First Time)
                    </button>

                </form>

                {/* Footer */}
                <p className="text-center text-sm mt-4 text-gray-300">
                    Secure Admin Access 🔐
                </p>

            </div>

        </div>
    );
};

export default AdminLogin;
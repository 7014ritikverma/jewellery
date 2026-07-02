import { useContext, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Signup = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useContext(AuthContext);
    const [form, setForm] = useState({
        name: "",
        email: "",
        mobile: location.state?.mobile || "",
        password: ""
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSignup = async () => {
        if (!form.mobile.trim() || !form.password.trim()) {
            alert("Mobile number aur password required hai");
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post("/api/auth/signup", {
                name: form.name.trim(),
                email: form.email.trim(),
                mobile: form.mobile.trim(),
                password: form.password
            });

            login(res.data.token);
            alert("Signup Successful");
            navigate(location.state?.from || "/", {
                state: location.state?.checkoutState,
                replace: true,
            });
        } catch (err) {
            console.log(err);
            alert(err.response?.data || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex justify-center items-center bg-gray-100 mt-20">
            <div className="bg-white p-8 rounded-xl shadow w-80 text-center">
                <h2 className="text-xl font-bold mb-4">Signup</h2>

                <input
                    name="name"
                    value={form.name}
                    placeholder="Name"
                    className="w-full border p-2 mb-3 rounded"
                    onChange={handleChange}
                />

                <input
                    name="email"
                    value={form.email}
                    placeholder="Email"
                    className="w-full border p-2 mb-3 rounded"
                    onChange={handleChange}
                />

                <input
                    name="mobile"
                    value={form.mobile}
                    placeholder="Mobile Number"
                    className="w-full border p-2 mb-3 rounded"
                    onChange={handleChange}
                />

                <input
                    name="password"
                    value={form.password}
                    type="password"
                    placeholder="Password"
                    className="w-full border p-2 mb-3 rounded"
                    onChange={handleChange}
                />

                <button
                    onClick={handleSignup}
                    disabled={loading}
                    className="w-full bg-[#6b0f1a] text-white py-2 rounded disabled:opacity-60"
                >
                    Signup
                </button>
            </div>
        </div>
    );
};

export default Signup;

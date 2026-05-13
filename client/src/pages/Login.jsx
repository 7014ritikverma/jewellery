import { useContext, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [mobile, setMobile] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!mobile.trim() || !password.trim()) {
            alert("Mobile number aur password enter karo");
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post("http://localhost:5000/api/auth/login", {
                mobile: mobile.trim(),
                password
            });

            login(res.data.token);
            alert("Login Successful");
            navigate("/");
        } catch (err) {
            console.log(err);
            alert(err.response?.data || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen">
            <div className="bg-white p-8 shadow rounded w-96">
                <h2 className="text-xl mb-4">Login</h2>

                <input
                    value={mobile}
                    placeholder="Mobile"
                    className="border p-2 w-full mb-3"
                    onChange={(e) => setMobile(e.target.value)}
                />

                <input
                    value={password}
                    type="password"
                    placeholder="Password"
                    className="border p-2 w-full mb-3"
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full bg-black text-white p-2 disabled:opacity-60"
                >
                    Login
                </button>
            </div>
        </div>
    );
};

export default Login;

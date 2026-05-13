import { useEffect, useState } from "react";
import axios from "axios";

const UserDashboard = () => {
    const [user, setUser] = useState({});
    const [edit, setEdit] = useState(false);

    const token = localStorage.getItem("userToken");

    useEffect(() => {
        axios.get("http://localhost:5000/api/user/profile", {
            headers: { Authorization: token },
        })
            .then(res => setUser(res.data))
            .catch(err => console.log(err));
    }, []);

    const handleUpdate = async () => {
        try {
            const res = await axios.put(
                "http://localhost:5000/api/user/profile",
                user,
                { headers: { Authorization: token } }
            );

            setUser(res.data);
            setEdit(false);
            alert("Profile Updated");
        } catch (err) {
            console.log(err);
            alert("Update failed");
        }
    };

    return (
        <div className="p-10 mt-20 bg-gray-100 min-h-screen">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-xl shadow">
                    <h2 className="text-xl font-bold mb-4">My Profile</h2>

                    {!edit ? (
                        <>
                            <div className="space-y-3 text-gray-700">
                                <p><b>Name:</b> {user.name || "-"}</p>
                                <p><b>Email:</b> {user.email || "-"}</p>
                                <p><b>Phone:</b> {user.mobile || user.phone || "-"}</p>
                                <p><b>Address:</b> {user.address || "-"}</p>
                            </div>

                            <button
                                onClick={() => setEdit(true)}
                                className="mt-4 bg-[#6b0f1a] text-white px-6 py-2 rounded"
                            >
                                Edit Profile
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="space-y-3">
                                <input
                                    value={user.name || ""}
                                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                                    className="w-full border p-3 rounded"
                                    placeholder="Name"
                                />

                                <input
                                    value={user.email || ""}
                                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                                    className="w-full border p-3 rounded"
                                    placeholder="Email"
                                />

                                <input
                                    value={user.mobile || user.phone || ""}
                                    onChange={(e) => setUser({ ...user, mobile: e.target.value, phone: e.target.value })}
                                    className="w-full border p-3 rounded"
                                    placeholder="Phone"
                                />

                                <textarea
                                    value={user.address || ""}
                                    onChange={(e) => setUser({ ...user, address: e.target.value })}
                                    className="w-full border p-3 rounded"
                                    placeholder="Address"
                                />
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={handleUpdate}
                                    className="bg-green-500 text-white px-6 py-2 rounded"
                                >
                                    Save
                                </button>

                                <button
                                    onClick={() => setEdit(false)}
                                    className="bg-gray-400 text-white px-6 py-2 rounded"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;

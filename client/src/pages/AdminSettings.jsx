import { useState } from "react";
import axios from "axios";

const AdminSettings = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      await axios.put(
        "http://localhost:5000/api/admin/update",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Updated Successfully ✅");

    } catch (err) {
      console.log(err);
      alert("Update Failed ❌");
    }
  };

  return (
    <div className="flex justify-center ">
      <div className="max-w-md bg-white p-6 rounded-xl shadow space-y-4">

        <h2 className="text-2xl font-bold">Admin Settings</h2>

        <input
          placeholder="New Email"
          className="border p-2 w-full rounded-lg"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="New Password"
          className="border p-2 w-full rounded-lg"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button
          onClick={handleUpdate}
          className="bg-[#6b0f1a] text-white px-4 py-2 rounded"
        >
          Update
        </button>

      </div>
    </div>
  );
};

export default AdminSettings;
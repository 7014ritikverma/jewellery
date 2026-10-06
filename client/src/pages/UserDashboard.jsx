import { useEffect, useState } from "react";
import axios from "axios";

const UserDashboard = () => {
  const [user, setUser] = useState({});
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("userToken");

  useEffect(() => {
    axios.get("/api/user/profile", { headers: { Authorization: token } })
      .then((res) => setUser(res.data))
      .catch((err) => console.log(err));
  }, [token]);

  const handleUpdate = async () => {
    try {
      setSaving(true);
      const res = await axios.put("/api/user/profile", user, { headers: { Authorization: token } });
      setUser(res.data);
      setEdit(false);
      alert("Profile updated");
    } catch (err) {
      console.log(err);
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const details = [["Name", user.name || "—"], ["Email", user.email || "—"], ["Phone", user.mobile || user.phone || "—"], ["Address", user.address || "—"]];

  return (
    <main className="min-h-screen bodoni-moda bg-[#fffaf8] px-4 pb-16 pt-36 text-[#3A001F] sm:px-6 lg:pt-40">
      <section className="mx-auto max-w-3xl">
        <div className="flex items-end justify-between gap-4 border-b border-[#ead7dc] pb-6">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A56028]">Account</p><h1 className="mt-2 text-2xl font-semibold sm:text-3xl">My profile</h1><p className="mt-2 text-sm text-[#7d5363]">Manage the details used for your orders.</p></div>
          {!edit && <button type="button" onClick={() => setEdit(true)} className="shrink-0 rounded-md bg-[#3A001F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5c0b2a]">Edit profile</button>}
        </div>

        {!edit ? <dl className="divide-y divide-[#ead7dc]">{details.map(([label, value]) => <div key={label} className="grid gap-1 py-5 sm:grid-cols-[140px_1fr] sm:gap-6"><dt className="text-sm font-medium text-[#7d5363]">{label}</dt><dd className="whitespace-pre-line break-words text-sm font-medium">{value}</dd></div>)}</dl> : (
          <form onSubmit={(event) => { event.preventDefault(); handleUpdate(); }} className="mt-7 space-y-5">
            <label className="block text-sm font-medium">Name<input value={user.name || ""} onChange={(e) => setUser({ ...user, name: e.target.value })} className="mt-2 w-full border-b border-[#cdaeb7] bg-transparent px-0 py-3 outline-none transition focus:border-[#3A001F]" /></label>
            <label className="block text-sm font-medium">Email<input type="email" value={user.email || ""} onChange={(e) => setUser({ ...user, email: e.target.value })} className="mt-2 w-full border-b border-[#cdaeb7] bg-transparent px-0 py-3 outline-none transition focus:border-[#3A001F]" /></label>
            <label className="block text-sm font-medium">Phone<input value={user.mobile || user.phone || ""} onChange={(e) => setUser({ ...user, mobile: e.target.value, phone: e.target.value })} className="mt-2 w-full border-b border-[#cdaeb7] bg-transparent px-0 py-3 outline-none transition focus:border-[#3A001F]" /></label>
            <label className="block text-sm font-medium">Address<textarea rows={3} value={user.address || ""} onChange={(e) => setUser({ ...user, address: e.target.value })} className="mt-2 w-full resize-none border-b border-[#cdaeb7] bg-transparent px-0 py-3 outline-none transition focus:border-[#3A001F]" /></label>
            <div className="flex gap-3 pt-3"><button type="submit" disabled={saving} className="rounded-md bg-[#3A001F] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button><button type="button" onClick={() => setEdit(false)} className="rounded-md px-4 py-2.5 text-sm font-semibold text-[#7d5363] hover:text-[#3A001F]">Cancel</button></div>
          </form>
        )}
      </section>
    </main>
  );
};

export default UserDashboard;

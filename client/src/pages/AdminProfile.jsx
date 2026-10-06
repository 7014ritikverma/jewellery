import { useEffect, useState } from "react";
import axios from "axios";
import { Camera } from "lucide-react";

const AdminProfile = () => {
  const [profile, setProfile] = useState({ name: "", email: "", mobile: "", profileImage: "" });
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  const handleAuthError = (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin-login";
      return true;
    }
    return false;
  };

  useEffect(() => {
    axios.get("/api/admin/profile", { headers })
      .then((res) => setProfile({ name: res.data?.name || "", email: res.data?.email || "", mobile: res.data?.mobile || "", profileImage: res.data?.profileImage || "" }))
      .catch((err) => { if (!handleAuthError(err)) alert("Unable to load admin profile"); });
  }, []);

  const uploadImage = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("images", file);
      const res = await axios.post("/api/upload", formData, { headers: { ...headers, "Content-Type": "multipart/form-data" } });
      setProfile((current) => ({ ...current, profileImage: res.data?.urls?.[0] || current.profileImage }));
    } catch (err) {
      if (!handleAuthError(err)) alert("Profile picture upload failed");
    } finally { setUploading(false); }
  };

  const sendOtp = async () => {
    try {
      await axios.post("/api/admin/update/request-otp", {}, { headers });
      setOtpSent(true);
      setOtp("");
      alert("OTP sent to the registered admin mobile number.");
    } catch (err) { if (!handleAuthError(err)) alert(err.response?.data || "OTP send failed"); }
  };

  const save = async () => {
    if (!otpSent || !otp) return alert("Send and enter the OTP before saving changes.");
    try {
      setSaving(true);
      await axios.put("/api/admin/update", { ...profile, password, otp }, { headers });
      setPassword("");
      setOtp("");
      setOtpSent(false);
      alert("Admin profile updated successfully.");
    } catch (err) { if (!handleAuthError(err)) alert(err.response?.data || "Profile update failed"); }
    finally { setSaving(false); }
  };

  const initials = (profile.name || profile.email || "A").trim().charAt(0).toUpperCase();
  return <div className="mx-auto max-w-3xl text-[#3A001F]">
    <div className="mb-6"><h2 className="text-2xl font-bold">Admin Profile</h2><p className="mt-1 text-sm text-[#7d5363]">Manage your admin details, profile picture and login credentials.</p></div>
    <div className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(58,0,31,0.05)] sm:p-7">
      <div className="mb-7 flex items-center gap-4 border-b border-[#f0e5e7] pb-6">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-[#fff0e8] text-2xl font-semibold text-[#A56028]">{profile.profileImage ? <img src={profile.profileImage} alt="Admin profile" className="h-full w-full object-cover" /> : initials}</div>
        <div><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#eadfe1] px-3 py-2 text-sm font-semibold hover:bg-[#fffaf8]"><Camera size={16} />{uploading ? "Uploading..." : "Change photo"}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0])} /></label><p className="mt-2 text-xs text-[#7d5363]">JPG, PNG or WEBP</p></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Username<input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Admin name" className="mt-1.5 w-full rounded-lg border border-[#eadfe1] p-2.5 font-normal outline-none focus:border-[#A56028]" /></label>
        <label className="text-sm font-medium">Email (login ID)<input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="mt-1.5 w-full rounded-lg border border-[#eadfe1] p-2.5 font-normal outline-none focus:border-[#A56028]" /></label>
        <label className="text-sm font-medium">Registered mobile<input value={profile.mobile} onChange={(e) => setProfile({ ...profile, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })} inputMode="numeric" className="mt-1.5 w-full rounded-lg border border-[#eadfe1] p-2.5 font-normal outline-none focus:border-[#A56028]" /></label>
        <label className="text-sm font-medium">New password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current password" className="mt-1.5 w-full rounded-lg border border-[#eadfe1] p-2.5 font-normal outline-none focus:border-[#A56028]" /></label>
      </div>
      <div className="mt-6 rounded-xl bg-[#fff8f4] p-4"><p className="text-sm text-[#7d5363]">A verification OTP is required before profile or login changes are saved.</p>{otpSent && <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter 6 digit OTP" inputMode="numeric" className="mt-3 w-full rounded-lg border border-[#eadfe1] bg-white p-2.5 outline-none focus:border-[#A56028]" />}<div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={sendOtp} className="rounded-lg border border-[#3A001F] px-4 py-2 text-sm font-semibold hover:bg-[#3A001F] hover:text-white">{otpSent ? "Resend OTP" : "Send OTP"}</button>{otpSent && <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-[#3A001F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : "Verify & save profile"}</button>}</div></div>
    </div>
  </div>;
};

export default AdminProfile;

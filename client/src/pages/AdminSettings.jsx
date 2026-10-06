import { useEffect, useRef, useState } from "react";
import axios from "axios";

const AdminSettings = () => {
  const [form, setForm] = useState({
    email: "",
    mobile: "",
    password: "",
  });
  const [rates, setRates] = useState([]);
  const [pricingSettings, setPricingSettings] = useState({ makingCharge: "" });
  const pricingDirtyRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [fetchingLiveRates, setFetchingLiveRates] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const token = localStorage.getItem("adminToken");

  const handleAuthError = (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin-login";
      return true;
    }

    return false;
  };

  const fetchRates = async () => {
    try {
      const res = await axios.get("/api/metals");
      setRates(res.data || []);
    } catch (err) {
      console.log(err);
      alert("Failed to load metal rates ❌");
    }
  };

  const fetchPricingSettings = async () => {
    try {
      const res = await axios.get("/api/metals/pricing-settings");
      if (!pricingDirtyRef.current) {
        setPricingSettings({ makingCharge: res.data?.makingCharge ?? "" });
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchRates();
    fetchPricingSettings();
    const interval = setInterval(() => {
      fetchRates();
      fetchPricingSettings();
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdate = async () => {

    try {
      const token = localStorage.getItem("adminToken");

      await axios.put(
        "/api/admin/update",
        {
          ...form,
          otp
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Updated Successfully ✅");

    } catch (err) {
      console.log("UPDATE ERROR:", err.response?.data);
      alert(err.response?.data || "Update Failed ❌");
    }
  };

  // const handleUpdate = async () => {
  //   try {
  //     await axios.put(
  //       "/api/admin/update",
  //       {
  //         ...form,
  //         otp
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     alert("Updated Successfully ✅");

  //   } catch (err) {
  //     console.log("UPDATE ERROR:", err.response?.data);
  //     alert(err.response?.data || "Update Failed ❌");
  //   }
  // };

  const handleSaveRates = async () => {
    try {
      setLoading(true);

      const headers = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.put(
        "/api/metals",
        { rates },
        headers
      );

      await axios.put(
        "/api/metals/pricing-settings",
        { makingCharge: Number(pricingSettings.makingCharge) || 0 },
        headers
      );

      await axios.post(
        "/api/metals/refresh",
        {},
        headers
      );

      alert("Metal rates and making charge updated ✅");
      pricingDirtyRef.current = false;
      fetchRates();
      const settingRes = await axios.get("/api/metals/pricing-settings");
      setPricingSettings({ makingCharge: settingRes.data?.makingCharge ?? "" });
    } catch (err) {
      if (handleAuthError(err)) return;
      console.log(err);
      alert("Saving metal rates failed ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRate = async (rate, index) => {
    if (!window.confirm("Do you really want to delete this metal rate?")) return;

    const next = rates.filter((_, idx) => idx !== index);
    setRates(next);

    if (!rate?.metal) return;

    try {
      const res = await axios.delete(
        `/api/metals/${encodeURIComponent(rate.metal)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRates(res.data || next);
    } catch (err) {
      if (handleAuthError(err)) return;
      console.log(err);
      alert("Removing metal rate failed");
      fetchRates();
    }
  };

  const normalizeMetalName = (metal = "") => {
    const value = String(metal).trim();
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  };

  const handleFetchLiveRates = async () => {
    try {
      setFetchingLiveRates(true);

      const res = await axios.post(
        "/api/metals/fetch",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedRates = Array.isArray(res.data) ? res.data : res.data?.rates;
      const warnings = Array.isArray(res.data?.warnings) ? res.data.warnings : [];

      setRates(updatedRates || []);
      alert(
        warnings.length
          ? `Live rates updated with warnings: ${warnings.join(", ")}`
          : "Live metal rates fetched and product prices refreshed"
      );
    } catch (err) {
      if (handleAuthError(err)) return;
      console.log(err);
      const message = err.response?.data?.message || err.response?.data || err.message;
      alert(`Live rate fetch failed: ${message}`);
    } finally {
      setFetchingLiveRates(false);
    }
  };

  const formatUpdatedAt = (value) => {
    if (!value) return "Manual";
    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handleSendOtp = async () => {
    try {
      await axios.post(
        "/api/admin/update/request-otp",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );


      setOtp("");
      setOtpSent(true);
      alert("OTP Sent");

    } catch (err) {
      console.log("OTP ERROR:", err.response?.data);
      alert(err.response?.data || "OTP send failed");
    }
  };

  return (
    <div className="flex justify-center ">
      <div className="max-w-2xl bg-white text-[#3A001F] p-6 rounded-xl shadow space-y-6">

        {false && <div className="space-y-4">
          <h2 className="text-2xl font-bold">Admin Settings</h2>

          <input
            placeholder="New Email"
            className="border p-2 w-full rounded-lg"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          {/* <input
            placeholder="Admin OTP Mobile"
            inputMode="numeric"
            maxLength="10"
            className="border p-2 w-full rounded-lg"
            onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
          /> */}

          <input
            type="password"
            placeholder="New Password"
            className="border p-2 w-full rounded-lg"
            onChange={(e) => setForm({ ...form, password: e.target.value })}

          />

          {otpSent && (
            <input
              placeholder="Enter OTP"
              inputMode="numeric"
              maxLength="10"
              className="border p-2 w-full rounded-lg"
              onChange={(e) => setOtp(e.target.value)}
            />
          )}

          {/* <button
            onClick={handleUpdate}
            className="bg-[#6b0f1a] text-white px-4 py-2 rounded"
          >
            Update Admin
          </button> */}

          <div className="flex gap-3">
            {!otpSent ? (
              <button
                onClick={handleSendOtp}
                className="bg-[#3A001F] text-white px-4 py-2 rounded"
              >
                Send OTP
              </button>
            ) : (
              <>
                <button
                  onClick={handleUpdate}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  Verify & Update
                </button>

                <button
                  onClick={handleSendOtp}
                  className="bg-[#A56028] text-white px-4 py-2 rounded"
                >
                  Resend OTP
                </button>
              </>
            )}
          </div>

        </div>}

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Metal Rate Manager</h2>

          <div className="rounded-lg border bg-[#fff8f4] p-4">
            <label className="mb-2 block font-semibold">Global Making Charge (%)</label>
            <input
              value={pricingSettings.makingCharge}
              placeholder="Example: 6 means 6% of product price"
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-lg border p-2"
              onChange={(e) => {
                pricingDirtyRef.current = true;
                setPricingSettings({
                  ...pricingSettings,
                  makingCharge: e.target.value,
                });
              }}
            />
            <p className="mt-2 text-xs text-[#A56028]">
              Products and variants use this percentage unless a custom percentage is set in product options.
            </p>
          </div>

          {rates.map((rate, index) => (
            <div key={rate._id || index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.2fr_auto] gap-3 items-center">
              <input
                value={rate.metal || ""}
                placeholder="Metal"
                className="border p-2 rounded-lg"
                onChange={(e) => {
                  const next = [...rates];
                  next[index] = { ...next[index], metal: normalizeMetalName(e.target.value) };
                  setRates(next);
                }}
              />
              <input
                value={rate.rate || ""}
                placeholder="Rate per gram"
                type="number"
                min="0"
                step="0.01"
                className="border p-2 rounded-lg"
                onChange={(e) => {
                  const next = [...rates];
                  next[index] = { ...next[index], rate: e.target.value };
                  setRates(next);
                }}
              />
              <div className="text-sm text-[#A56028]">
                {/* <p>{rate.source && rate.source !== "manual" ? `Live market (${rate.source})` : "Manual"} / {rate.currency || "INR"} per {rate.unit || "gram"}</p> */}
                <p>Updated: {formatUpdatedAt(rate.lastFetchedAt || rate.updatedAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveRate(rate, index)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Remove
              </button>
            </div>
          ))}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleFetchLiveRates}
              disabled={fetchingLiveRates}
              className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
            >
              {fetchingLiveRates ? "Fetching..." : "Refresh Live Rates Now"}
            </button>

            <button
              type="button"
              onClick={() => setRates([...rates, { metal: "", rate: "" }])}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Add Metal
            </button>

            <button
              type="button"
              onClick={handleSaveRates}
              disabled={loading}
              className="bg-[#6b0f1a] text-white px-4 py-2 rounded disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Metal Rates"}
            </button>
          </div>

          <p className="text-sm text-gray-600">
            Live rates auto-update on the server every 5 minutes and this page refreshes every minute. Use manual refresh only when you want an immediate update.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

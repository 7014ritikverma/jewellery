// 

import { useEffect, useState } from "react";
import axios from "axios";
import OrderTracking from "../components/OrderTracking";
import EmptyState from "../components/EmptyState";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loadingAction, setLoadingAction] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [shiprocketSetup, setShiprocketSetup] = useState(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [selectedCouriers, setSelectedCouriers] = useState({});
  const [returnNotes, setReturnNotes] = useState({});
  const token = localStorage.getItem("adminToken");

  const handleAuthError = (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin-login";
      return true;
    }

    return false;
  };

  const fetchOrders = () => {
    axios.get("/api/orders/all", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => setOrders(res.data))
      .catch(err => {
        if (handleAuthError(err)) return;
        console.log(err);
      });
  };

  useEffect(() => {
    axios.get("/api/orders/all", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setOrders(res.data))
      .catch(err => {
        if (handleAuthError(err)) return;
        console.log(err);
      });
  }, []);

  const runShipmentAction = async (id, action, body = {}) => {
    try {
      setLoadingAction(`${id}:${action}`);

      const res = await axios.post(
        `/api/orders/${id}/shiprocket/${action}`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders(orders.map(o => o._id === id ? res.data : o));
      alert("Shiprocket updated");
    } catch (err) {
      if (handleAuthError(err)) return;
      console.log(err);
      alert(err.response?.data?.message || err.response?.data || "Shiprocket action failed");
    } finally {
      setLoadingAction("");
    }
  };

  const checkShiprocketSetup = async () => {
    try {
      setSetupLoading(true);
      const res = await axios.get("/api/orders/shiprocket/setup", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShiprocketSetup(res.data);
    } catch (err) {
      if (handleAuthError(err)) return;
      console.log(err);
      setShiprocketSetup({
        connected: false,
        message: err.response?.data?.message || err.response?.data || "Shiprocket setup check failed",
      });
    } finally {
      setSetupLoading(false);
    }
  };

  const updateReturnStatus = async (id, status) => {
    try {
      setLoadingAction(`${id}:return`);
      const res = await axios.put(
        `/api/orders/${id}/return`,
        {
          status,
          adminNote: returnNotes[id] || "",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders(orders.map(o => o._id === id ? res.data : o));
    } catch (err) {
      if (handleAuthError(err)) return;
      console.log(err);
      alert(err.response?.data || "Return update failed");
    } finally {
      setLoadingAction("");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query
      || order.user?.name?.toLowerCase().includes(query)
      || order.user?.email?.toLowerCase().includes(query)
      || order._id?.toLowerCase().includes(query)
      || order.shiprocket?.awbCode?.toLowerCase().includes(query)
      || order.items?.some((item) => item.product?.name?.toLowerCase().includes(query));

    const matchesStatus = statusFilter === "All" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "All" || order.paymentMethod === paymentFilter || order.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const countByStatus = (status) => orders.filter((order) => order.status === status).length;

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders();
    }, 5000); // हर 5 सेकंड में refresh

    return () => clearInterval(interval);

  }, []);

  return (
    <div className="p-10 text-[#3A001F]">

      <h2 className="text-2xl font-bold mb-6">Order Management</h2>

      <div className="mb-5 rounded bg-white p-4 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-bold">Shiprocket Setup</h3>
            <p className="text-sm text-[#A56028]">
              Check API login and exact pickup location name before creating shipments.
            </p>
          </div>
          <button
            type="button"
            onClick={checkShiprocketSetup}
            disabled={setupLoading}
            className="rounded bg-[#3A001F] px-4 py-2 text-white disabled:opacity-60"
          >
            {setupLoading ? "Checking..." : "Check Setup"}
          </button>
        </div>

        {shiprocketSetup && (
          <div className="mt-3 rounded border p-3 text-sm">
            {shiprocketSetup.connected ? (
              <>
                <p className="font-semibold text-green-700">Shiprocket API connected</p>
                <p>Configured pickup: {shiprocketSetup.configuredPickupLocation || "-"}</p>
                <p>Pickup pincode: {shiprocketSetup.configuredPickupPincode || "-"}</p>
                <p className={shiprocketSetup.pickupLocationMatched ? "text-green-700" : "text-red-600"}>
                  Pickup match: {shiprocketSetup.pickupLocationMatched ? "Matched" : "Not matched"}
                </p>
                {shiprocketSetup.locations?.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold">Pickup locations in your Shiprocket account:</p>
                    <div className="mt-1 grid gap-2 md:grid-cols-2">
                      {shiprocketSetup.locations.map((item, index) => (
                        <div key={`${item.id || item.pickupLocation}-${index}`} className="rounded border p-2">
                          <p className="font-semibold">{item.pickupLocation || "-"}</p>
                          <p>{[item.address, item.city, item.state, item.pincode].filter(Boolean).join(", ")}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="font-semibold text-red-600">{shiprocketSetup.message}</p>
            )}
          </div>
        )}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {["Pending", "Processing", "Shipped", "Delivered"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded border p-3 text-left ${statusFilter === status ? "border-[#A56028] bg-[#3A001F] text-white" : "bg-white"}`}
          >
            <p className="text-xs">{status}</p>
            <p className="text-xl font-bold">{countByStatus(status)}</p>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setStatusFilter("All")}
          className={`rounded border p-3 text-left ${statusFilter === "All" ? "border-[#A56028] bg-[#3A001F] text-white" : "bg-white"}`}
        >
          <p className="text-xs">All</p>
          <p className="text-xl font-bold">{orders.length}</p>
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 bg-white p-4 rounded shadow md:grid-cols-[1fr_160px_160px_auto]">
        <input
          value={search}
          placeholder="Search order, customer, product, AWB"
          className="border p-2 rounded"
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={statusFilter}
          className="border p-2 rounded"
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All</option>
          <option>Pending</option>
          <option>Processing</option>
          <option>Shipped</option>
          <option>Delivered</option>
        </select>
        <select
          value={paymentFilter}
          className="border p-2 rounded"
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option>All</option>
          <option>COD</option>
          <option>ONLINE</option>
          <option>Paid</option>
          <option>Pending</option>
        </select>
        <button
          onClick={fetchOrders}
          className="bg-blue-500 text-white cursor-pointer px-4 py-2 rounded"
        >
          Refresh
        </button>
      </div>

      {filteredOrders.map(order => (
        <div key={order._id} className="bg-white p-4 rounded shadow mb-4 relative">

          {order.status === "Pending" && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              NEW
            </span>
          )}

          <p><b>User:</b> {order.user?.name}</p>
          <p><b>Order ID:</b> {order._id}</p>
          <p><b>Email:</b> {order.user?.email}</p>
          <p><b>Address:</b> {order.address}</p>
          <p><b>Mobile:</b> {order.deliveryMobile || order.shippingAddress?.phone || "-"}</p>
          <p><b>Pincode:</b> {order.shippingAddress?.pincode || "-"}</p>
          <p><b>Payment Method:</b> {order.paymentMethod || "COD"}</p>
          <p><b>Payment Status:</b> {order.paymentStatus || "Pending"}</p>
          <p><b>Total:</b> ₹{order.total}</p>

          <p className="mt-2">
            <b>Status:</b> {order.status}
          </p>

          <div className="my-4">
            <OrderTracking order={order} compact />
          </div>

          {/* PRODUCTS */}
          <div className="mt-3">
            {order.items.map(i => (
              <div key={i._id} className="flex gap-3 items-center mb-3">
                <img
                  src={i.itemImage || i.product?.images?.[0]}
                  alt={i.product?.name}
                  className="w-16 h-16 object-cover"
                />
                <div>
                  <p className="font-semibold">{i.product?.name}</p>
                  <p className="text-sm text-gray-600">
                    Qty: {i.qty} | Price: Rs. {i.itemPrice || i.product?.price || 0} | Subtotal: Rs. {(i.itemPrice || i.product?.price || 0) * (i.qty || 0)}
                  </p>
                  {i.variants?.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {i.variants.map((variant) => `${variant.group}: ${variant.option}`).join(" | ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t pt-3">
            <p className="font-semibold">Shiprocket</p>
            <p className="text-sm text-gray-700">
              Shipment: {order.shiprocket?.shipmentId || "-"} | AWB: {order.shiprocket?.awbCode || "-"} | {order.shiprocket?.status || "Not created"}
            </p>
            {order.shiprocket?.lastError && (
              <p className="text-sm text-red-600">{order.shiprocket.lastError}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loadingAction === `${order._id}:create` || Boolean(order.shiprocket?.shipmentId)}
                onClick={() => runShipmentAction(order._id, "create")}
                className="bg-[#3A001F] text-white px-3 py-2 rounded disabled:opacity-50"
              >
                Create Shipment
              </button>

              <button
                type="button"
                disabled={loadingAction === `${order._id}:couriers`}
                onClick={() => runShipmentAction(order._id, "couriers")}
                className="bg-orange-600 text-white px-3 py-2 rounded disabled:opacity-50"
              >
                Check Couriers
              </button>

              {order.shiprocket?.availableCouriers?.length > 0 && (
                <select
                  value={selectedCouriers[order._id] || ""}
                  className="border px-3 py-2 rounded"
                  onChange={(e) => setSelectedCouriers({
                    ...selectedCouriers,
                    [order._id]: e.target.value,
                  })}
                >
                  <option value="">Auto courier</option>
                  {order.shiprocket.availableCouriers.map((courier) => (
                    <option key={courier.courierCompanyId} value={courier.courierCompanyId}>
                      {courier.courierName} {courier.rate ? `- Rs. ${courier.rate}` : ""} {courier.etd ? `- ${courier.etd}` : ""}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                disabled={loadingAction === `${order._id}:awb` || !order.shiprocket?.shipmentId || Boolean(order.shiprocket?.awbCode)}
                onClick={() => runShipmentAction(order._id, "awb", {
                  courierId: selectedCouriers[order._id] || undefined,
                })}
                className="bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-50"
              >
                Assign AWB
              </button>

              <button
                type="button"
                disabled={loadingAction === `${order._id}:pickup` || !order.shiprocket?.shipmentId}
                onClick={() => runShipmentAction(order._id, "pickup")}
                className="bg-green-600 text-white px-3 py-2 rounded disabled:opacity-50"
              >
                Generate Pickup
              </button>

              <button
                type="button"
                disabled={loadingAction === `${order._id}:label` || !order.shiprocket?.awbCode}
                onClick={() => runShipmentAction(order._id, "label")}
                className="bg-gray-800 text-white px-3 py-2 rounded disabled:opacity-50"
              >
                Generate Label
              </button>

              {order.shiprocket?.labelUrl && (
                <a
                  href={order.shiprocket.labelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="border px-3 py-2 rounded text-blue-700"
                >
                  Open Label
                </a>
              )}

              <button
                type="button"
                disabled={loadingAction === `${order._id}:sync` || !order.shiprocket?.awbCode}
                onClick={() => runShipmentAction(order._id, "sync")}
                className="bg-purple-600 text-white px-3 py-2 rounded disabled:opacity-50"
              >
                Sync Tracking
              </button>
            </div>
          </div>

        </div>
      ))}

      {filteredOrders.length === 0 && (
        <div className="bg-white p-6 rounded shadow text-center text-gray-600">
          No orders found.
        </div>
      )}

    </div>
  );
};

export default AdminOrders;

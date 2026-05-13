// 

import { useEffect, useState } from "react";
import axios from "axios";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const token = localStorage.getItem("adminToken");

  const fetchOrders = () => {
    axios.get("http://localhost:5000/api/orders/all", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => setOrders(res.data))
      .catch(err => console.log(err));
  };

  useEffect(() => {
    axios.get("http://localhost:5000/api/orders/all", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setOrders(res.data));
  }, []);

  const updateStatus = (id, status) => {
    axios.put(
      `http://localhost:5000/api/orders/${id}`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(res => {
        setOrders(orders.map(o => o._id === id ? res.data : o));
      });
  };

  const deleteDeliveredOrder = (id) => {
    const confirmed = window.confirm("Do you want to delete this order?");

    if (!confirmed) return;

    axios.delete(`http://localhost:5000/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setOrders(orders.filter(order => order._id !== id));
      })
      .catch(err => {
        console.log(err);
        alert(err.response?.data || "Order delete failed");
      });
  };

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders();
    }, 5000); // हर 5 सेकंड में refresh

    return () => clearInterval(interval);

  }, []);

  return (
    <div className="p-10">

      <h2 className="text-2xl font-bold mb-6">All Orders</h2>

      <button
        onClick={fetchOrders}
        className="bg-blue-500 text-white cursor-pointer px-4 py-2 mb-4 rounded"
      >
        Refresh Orders
      </button>

      {orders.map(order => (
        <div key={order._id} className="bg-white p-4 rounded shadow mb-4">

          <p><b>User:</b> {order.user?.name}</p>
          <p><b>Email:</b> {order.user?.email}</p>
          <p><b>Address:</b> {order.address}</p>
          <p><b>Payment Method:</b> {order.paymentMethod || "COD"}</p>
          <p><b>Payment Status:</b> {order.paymentStatus || "Pending"}</p>
          <p><b>Total:</b> ₹{order.total}</p>

          <p className="mt-2">
            <b>Status:</b> {order.status}
          </p>

          {/* PRODUCTS */}
          <div className="mt-3">
            {order.items.map(i => (
              <div key={i._id} className="flex gap-3 items-center mb-3">
                <img
                  src={i.product?.images?.[0]}
                  alt={i.product?.name}
                  className="w-16 h-16 object-cover"
                />
                <div>
                  <p className="font-semibold">{i.product?.name}</p>
                  <p className="text-sm text-gray-600">
                    Qty: {i.qty} | Price: Rs. {i.product?.price || 0} | Subtotal: Rs. {(i.product?.price || 0) * (i.qty || 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-3 items-center">
            {/* STATUS CHANGE */}
            <select
              className="border p-2"
              onChange={(e) => updateStatus(order._id, e.target.value)}
              value={order.status}
            >
              <option>Pending</option>
              <option>Processing</option>
              <option>Shipped</option>
              <option>Delivered</option>
            </select>

            {order.status === "Delivered" && (
              <button
                onClick={() => deleteDeliveredOrder(order._id)}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            )}
          </div>

        </div>
      ))}

    </div>
  );
};

export default AdminOrders;

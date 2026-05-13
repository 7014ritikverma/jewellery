import { useState } from "react";
import AdminProducts from "./AdminProducts";
import AdminOrders from "./AdminOrders";
import AdminAddProduct from "./AdminAddProduct";
import AdminSettings from "./AdminSettings";
import { Menu } from "lucide-react";
import axios from "axios";
import { useEffect } from "react";

const Admin = () => {
  const [active, setActive] = useState("dashboard");
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState({
    products: 0,
    orders: 0,
    users: 0
  });
  const [refresh, setRefresh] = useState(false);


  const triggerRefresh = () => {
    setRefresh(prev => !prev);
  };


  const menu = [
    { name: "Dashboard", key: "dashboard" },
    { name: "Products", key: "products" },
    { name: "Add Product", key: "addProduct" },
    { name: "Orders", key: "orders" },
    { name: "Settings", key: "settings" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    const fetchData = async () => {
      try {
        const [pRes, oRes] = await Promise.all([
          axios.get("http://localhost:5000/api/products"),
          axios.get("http://localhost:5000/api/orders/all", {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setCounts({
          products: pRes.data.length,
          orders: oRes.data.length,  // 🔥 FIX
          users: 0 // अभी static रख सकते हो
        });

      } catch (err) {
        console.log("ERROR:", err.response?.data || err.message);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 5000); // 🔥 auto refresh
    return () => clearInterval(interval);

  }, [refresh]);


  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <div className={`bg-[#6b0f1a] text-white w-64 p-6 max-md:h-full fixed md:static  z-50 transition-all ${open ? "left-0" : "-left-64 md:left-0"}`}>

        <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>

        <ul className="space-y-4">
          {menu.map(item => (
            <li
              key={item.key}
              onClick={() => {
                setActive(item.key);
                setOpen(false);
              }}
              className={`cursor-pointer px-3 py-2 rounded-lg ${active === item.key ? "bg-white text-[#6b0f1a]" : "hover:bg-white/20"
                }`}
            >
              {item.name}
            </li>
          ))}
        </ul>

        <button
          className="mt-10 bg-black px-4 py-2 rounded-lg w-full"
          onClick={() => {
            localStorage.removeItem("adminToken");
            window.location.href = "/";
          }}
        >
          Logout
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 md:p-10 ml-0 ">

        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between mb-4">
          <Menu onClick={() => setOpen(!open)} className="cursor-pointer" />
          <h2 className="font-bold">Admin</h2>
        </div>

        {/* Content Switch */}
        {active === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="bg-white p-6 rounded-xl shadow text-center">
              <h2 className="text-lg text-gray-500">Total Products</h2>
              <p className="text-3xl font-bold text-[#6b0f1a]">
                {counts.products}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow text-center">
              <h2>Orders</h2>
              <p className="text-3xl font-bold">
                {counts.orders}   {/* 🔥 FIX */}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow text-center">
              <h2>Users</h2>
              <p className="text-3xl font-bold">
                {counts.users}
              </p>
            </div>

          </div>
        )}

        {active === "addProduct" && <AdminAddProduct onSuccess={triggerRefresh} />}
        {active === "products" && <AdminProducts onUpdate={triggerRefresh} />}
        {active === "orders" && <AdminOrders />}
        {active === "settings" && <AdminSettings />}

      </div>
    </div>
  );
};

export default Admin;
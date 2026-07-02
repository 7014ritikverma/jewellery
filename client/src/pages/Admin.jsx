import { useState } from "react";
import AdminProducts from "./AdminProducts";
import AdminOrders from "./AdminOrders";
import AdminAddProduct from "./AdminAddProduct";
import AdminSettings from "./AdminSettings";
import AdminHomeContent from "./AdminHomeContent";
import { Menu } from "lucide-react";
import axios from "axios";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  PlusSquare,
  ClipboardList,
  Image,
  Settings,
  LogOut, Package, ShoppingCart, Users
} from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";

const Admin = () => {
  const [active, setActive] = useState("dashboard");
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState({
    products: 0,
    orders: 0,
    users: 0
  });
  const [users, setUsers] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const location = useLocation();

  const handleAuthError = (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin-login";
      return true;
    }

    return false;
  };

  const triggerRefresh = () => {
    setRefresh(prev => !prev);
  };


  const menu = [
    { name: "Dashboard", key: "dashboard", icon: LayoutDashboard },
    { name: "Products", key: "products", icon: ShoppingBag },
    { name: "Add Product", key: "addProduct", icon: PlusSquare },
    { name: "Orders", key: "orders", icon: ClipboardList },
    { name: "Home Content", key: "homeContent", icon: Image },
    { name: "Settings", key: "settings", icon: Settings },
    { name: "Logout", key: "logout", icon: LogOut },
  ];

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      window.location.href = "/admin-login";
      return;
    }

    const fetchData = async () => {
      try {
        const [pRes, oRes, uRes] = await Promise.all([
          axios.get("/api/products"),
          axios.get("/api/orders/all", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get("/api/user/all", {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setCounts({
          products: pRes.data.length,
          orders: oRes.data.length,
          users: uRes.data.length
        });
        setUsers(uRes.data);

      } catch (err) {
        if (handleAuthError(err)) return;
        console.log("ERROR:", err.response?.data || err.message);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(interval);

  }, [refresh]);

  useEffect(() => {
    const tab =
      new URLSearchParams(location.search).get("tab");

    if (tab) {
      setActive(tab);
    }
  }, [location]);


  return (
    <div className="flex h-screen overflow-hidden">

      <div
        className={`sticky top-0 h-screen shrink-0 overflow-y-auto flex flex-col scroll-smooth bg-[#3A001F] text-white w-28 p-3 z-50`}
      >

        {/* Logo */}
        <div className="flex justify-center mb-8">
          {/* <div className="w-14 h-14 rounded-full border-2 border-[#FFBC73] flex items-center justify-center">
          </div> */}
          {/* <span className="text-2xl text-center">Admin Panel</span> */}
          <img src="Logo2.png" alt="Logo" />
        </div>

        {/* Menu */}
        <div className="flex-1 flex flex-col gap-6">
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.key}

                onClick={() => {
                  if (item.key === "logout") {
                    setLogoutConfirmOpen(true);
                    return;
                  }

                  setActive(item.key);
                  setOpen(false);
                }}
                className={`group relative flex flex-col items-center cursor-pointer rounded-2xl p-3 transition-all duration-300 ${active === item.key
                  ? "bg-[#A56028] text-white font-semibold shadow-lg scale-105"
                  : "text-white hover:bg-white/10"
                  }
`}
              >
                <Icon className="" size={26} />

                <span className="text-xs mt-2 text-center">
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="h-screen flex-1 overflow-y-auto p-4 md:p-10">

        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between mb-4">
          <Menu onClick={() => setOpen(!open)} className="cursor-pointer" />
          <h2 className="font-bold">Admin</h2>
        </div>

        {/* Content Switch */}
        {active === "dashboard" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

              {/* Products */}
              <div className="bg-white rounded-2xl p-5 shadow-md flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#FFBC73] flex items-center justify-center">
                    <ShoppingCart size={28} className="text-[#3A001F]" />
                  </div>
                  <div>
                    <p className="text-[#A56028] font-medium">
                      Total Products
                    </p>

                    <div className="flex items-center gap-2">
                      <h2 className="text-3xl text-[#3A001F] font-bold">
                        {counts.products}
                      </h2>

                    </div>
                  </div>
                </div>
              </div>

              {/* Orders */}
              <div className="bg-white rounded-2xl p-5 shadow-md flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#FFBC73] flex items-center justify-center">

                    <Package size={28} className="text-[#3A001F]" />

                  </div>

                  <div>
                    <p className="text-[#A56028] font-medium">
                      Orders
                    </p>

                    <div className="flex items-center gap-2">
                      <h2 className="text-3xl text-[#3A001F] font-bold">
                        {counts.orders}
                      </h2>

                    </div>
                  </div>
                </div>
              </div>

              {/* Users */}
              <div className="bg-white rounded-2xl p-5 shadow-md flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#FFBC73] flex items-center justify-center">
                    <Users size={28} className="text-[#3A001F]" />
                  </div>

                  <div>
                    <p className="text-[#A56028] font-medium">
                      Users
                    </p>

                    <div className="flex items-center gap-2">
                      <h2 className="text-3xl text-[#3A001F] font-bold">
                        {counts.users}
                      </h2>

                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Users List */}
            <div className="bg-white p-6 rounded-xl shadow ">
              <h2 className="text-xl font-bold mb-4 text-[#3A001F]">Users</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-[#A56028]">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Mobile</th>
                      {/* <th className="text-left p-2">Phone</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id} className="border-b text-[#3A001F]">
                        <td className="p-2">{user.name || "N/A"}</td>
                        <td className="p-2">{user.email || "N/A"}</td>
                        <td className="p-2">{user.mobile || "N/A"}</td>
                        {/* <td className="p-2">{user.phone || "N/A"}</td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {active === "addProduct" && <AdminAddProduct onSuccess={triggerRefresh} />}
        {active === "products" && <AdminProducts onUpdate={triggerRefresh} />}
        {active === "orders" && <AdminOrders />}
        {active === "homeContent" && <AdminHomeContent />}
        {active === "settings" && <AdminSettings />}

      </div>
      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Logout?"
        message="Are you sure you want to Logout?"
        confirmText="Yes, logout"
        cancelText="Cancle"
        danger
        onConfirm={() => {
          localStorage.removeItem("adminToken");
          window.location.href = "/";
        }}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </div>
  );
};

export default Admin;

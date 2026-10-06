import { AnimatePresence } from "framer-motion";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppChatbot from "./components/WhatsAppChatbot";
import BackToTopButton from "./components/BackToTopButton";

import Home from "./pages/Home";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import BuyNowQuantity from "./pages/BuyNowQuantity";
import ProductDetails from "./pages/ProductDetails";
import UserDashboard from "./pages/UserDashboard";
import MyOrders from "./pages/MyOrders";

import Admin from "./pages/Admin";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminAddProduct from "./pages/AdminAddProduct";
import AdminLogin from "./pages/AdminLogin";
import OrderDetails from "./pages/OrderDetails";
import ScrollToTop from "./components/ScrollToTop";
import PageTransition from "./components/PageTransition";

<Route path="/order/:id" element={<OrderDetails />} />

import ProtectedRoute from "./components/ProtectedRoute";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Jobs from "./pages/Jobs";
import Blogs from "./pages/Blogs";
import BulkInquiry from "./pages/BulkInquiry";
import BrandStory from "./pages/BrandStory";
import Collab from "./pages/Collab";
import TermsConditions from "./pages/TermsConditions";
import FAQ from "./pages/FAQ";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ReturnRefund from "./pages/ReturnRefund";

function AppContent() {
  const location = useLocation();
  const backgroundLocation = location.state?.backgroundLocation;

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isCheckoutRoute = location.pathname === "/checkout";

  return (
    <>
      <ScrollToTop />

      {!isAdminRoute && !isCheckoutRoute && <Navbar />}


      <AnimatePresence mode="wait">
      <PageTransition key={location.pathname}>
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Products />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/bulk-inquiry" element={<BulkInquiry />} />
        <Route path="/brand-story" element={<BrandStory />} />
        <Route path="/collab" element={<Collab />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/return-refund" element={<ReturnRefund />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute type="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute type="user">
              <MyOrders />
            </ProtectedRoute>
          }
        />

        <Route path="/order/:id" element={<OrderDetails />} />

        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/buy-now" element={<BuyNowQuantity />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/products/:id" element={<ProductDetails />} />



        <Route path="/admin-login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute type="admin">
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute type="admin">
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/products"
          element={
            <ProtectedRoute type="admin">
              <AdminProducts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute type="admin">
              <AdminOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/add-product"
          element={
            <ProtectedRoute type="admin">
              <AdminAddProduct />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute type="admin">
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
      </PageTransition>
      </AnimatePresence>

      {backgroundLocation && (
        <Routes>
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
        </Routes>
      )}

      {!isAdminRoute && !isCheckoutRoute && <Footer />}

      {!isAdminRoute && !isCheckoutRoute && <WhatsAppChatbot />}

      {!isAdminRoute && !isCheckoutRoute && <BackToTopButton />}

    </>
  );
}

export default AppContent;

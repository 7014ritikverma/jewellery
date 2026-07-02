import ReactDOM from "react-dom/client";
import './index.css'
import './config/api.js'
import App from './App.jsx'
import { AuthProvider } from "./context/AuthContext.jsx";
import { WishlistProvider } from "./context/WishlistContext";
import { CartProvider } from "./context/CartContext";
ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <CartProvider>
      <WishlistProvider>

        <App />

      </WishlistProvider>
    </CartProvider>
  </AuthProvider>
);

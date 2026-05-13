import { BrowserRouter } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import AppContent from "./AppContent";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
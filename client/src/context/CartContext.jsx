import { createContext, useEffect, useState } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  const getCartKey = (product) => {
    const variants = Array.isArray(product.selectedVariants)
      ? product.selectedVariants.map((item) => `${item.group}:${item.option}`).join("|")
      : "";

    return variants ? `${product._id || product.id}:${variants}` : `${product._id || product.id}`;
  };

  // load from localStorage
  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("cart")) || [];
      setCart(Array.isArray(data) ? data : []);
    } catch {
      setCart([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  // save to localStorage
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart, hydrated]);

  // ADD TO CART
  const addToCart = (product) => {
    if (product.quantity <= 0) {
      alert("Product is out of stock!");
      return;
    }

    const cartKey = getCartKey(product);
    const exist = cart.find((item) => (item.cartKey || item._id) === cartKey);

    if (exist) {
      if (exist.qty + 1 > product.quantity) {
        alert("Not enough stock available!");
        return;
      }
      setCart(
        cart.map((item) =>
          (item.cartKey || item._id) === cartKey
            ? { ...item, qty: item.qty + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, cartKey, qty: 1 }]);
    }
  };

  // REMOVE ONE ITEM
  const removeItem = (key) => {
    setCart(cart.filter((item) => (item.cartKey || item._id) !== key));
  };

  // INCREASE QTY
  const increaseQty = (key) => {
    setCart(
      cart.map((item) => {
        if ((item.cartKey || item._id) === key) {
          if (item.qty + 1 > item.quantity) {
            alert("Not enough stock available!");
            return item;
          }
          return { ...item, qty: item.qty + 1 };
        }
        return item;
      })
    );
  };

  // DECREASE QTY
  const decreaseQty = (key) => {
    setCart(
      cart.map((item) =>
        (item.cartKey || item._id) === key && item.qty > 1
          ? { ...item, qty: item.qty - 1 }
          : item
      )
    );
  };

  // CLEAR CART
  const clearCart = () => {
    setCart([]);
    localStorage.setItem("cart", JSON.stringify([]));
  };

  // TOTAL
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeItem,
        increaseQty,
        decreaseQty,
        clearCart,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

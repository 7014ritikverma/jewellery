import { useContext, useState } from "react";
import { FiMinus, FiPlus, FiShoppingBag, FiTrash2, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { formatPrice } from "../utils/formatPrice";
import AuthRequiredModal from "../components/AuthRequiredModal";

const Cart = () => {
  const {
    cart,
    removeItem,
    increaseQty,
    decreaseQty,
    clearCart,
    total,
  } = useContext(CartContext);

  const navigate = useNavigate();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const token = localStorage.getItem("userToken");
  const checkoutState = { cartItems: cart, total };

  const proceedToPayment = () => {
    if (!token) {
      setShowAuthPrompt(true);
      return;
    }

    navigate("/checkout", { state: checkoutState });
  };

  const closeCart = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  return (
    <div className="fixed inset-0 z-[70] bodoni-moda mt-0 bg-black/45">
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 cursor-default"
        onClick={closeCart}
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl sm:w-[430px]">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3A001F] text-white">
              <FiShoppingBag size={18} />
            </span>
            <div>
              <h1 className="text-lg font-bold text-[#3A001F]">Your Cart</h1>
              <p className="text-xs text-gray-500">{cart.length} item{cart.length === 1 ? "" : "s"}</p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close cart"
            onClick={closeCart}
            className="flex h-10 w-10 items-center justify-center rounded-full border text-gray-700 hover:bg-gray-50"
          >
            <FiX size={20} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <img
              src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png"
              alt="Empty cart"
              className="mb-6 h-28 w-28 object-contain opacity-80"
            />
            <h2 className="mb-2 text-2xl font-bold text-[#3A001F]">Your cart is empty</h2>
            <p className="text-sm text-gray-600">Add a piece you love and it will appear here.</p>
            <button
              type="button"
              onClick={() => navigate("/shop")}
              className="mt-7 rounded bg-[#3A001F] px-6 py-3 text-sm font-semibold text-white"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                {cart.map((item) => {
                  const itemKey = item.cartKey || item._id;

                  return (
                    <div key={itemKey} className="flex gap-3 border-b pb-4">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/product/${item._id}`, {
                            state: { product: item },
                          })
                        }
                        className="h-20 w-20 shrink-0 overflow-hidden rounded border bg-gray-50"
                      >
                        <img
                          src={item.images?.[0]}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </button>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-[#3A001F]">
                          {item.name}
                        </h3>

                        {item.selectedVariants?.length > 0 && (
                          <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                            {item.selectedVariants
                              .map((variant) => `${variant.group}: ${variant.option}`)
                              .join(" | ")}
                          </p>
                        )}

                        <p className="mt-2 text-sm font-bold text-[#A56028]">
                          Rs. {formatPrice(item.price)}
                        </p>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex h-9 items-center overflow-hidden rounded border">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() => decreaseQty(itemKey)}
                              className="flex h-9 w-9 items-center justify-center hover:bg-gray-50"
                            >
                              <FiMinus size={14} />
                            </button>
                            <span className="w-9 text-center text-sm font-semibold">{item.qty}</span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() => increaseQty(itemKey)}
                              className="flex h-9 w-9 items-center justify-center hover:bg-gray-50"
                            >
                              <FiPlus size={14} />
                            </button>
                          </div>

                          <button
                            type="button"
                            aria-label="Remove item"
                            onClick={() => removeItem(itemKey)}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 hover:bg-red-50"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t bg-white px-5 py-4">
              <div className="mb-4 flex items-center justify-between text-base font-bold text-[#3A001F]">
                <span>Total</span>
                <span>Rs. {formatPrice(total)}</span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={clearCart}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-red-200 text-red-500 hover:bg-red-50"
                  aria-label="Clear cart"
                >
                  <FiTrash2 size={18} />
                </button>

                <button
                  type="button"
                  onClick={proceedToPayment}
                  className="h-12 flex-1 rounded bg-[#3A001F] text-sm font-semibold text-white"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
      <AuthRequiredModal
        open={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        checkoutState={checkoutState}
      />
    </div>
  );
};

export default Cart;
